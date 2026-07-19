import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { getErrorMessage } from '@/lib/error-message'

export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // 1. Completed payments in the last 30 days
    const { data: payments, error: paymentsError } = await supabaseServer
      .from('payments')
      .select('id, appointment_id, patient_id, amount, status, created_at')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })

    if (paymentsError) throw paymentsError

    const appointmentIds = Array.from(
      new Set((payments || []).map((p) => p.appointment_id).filter(Boolean))
    )

    // 2. Appointments -> which doctor
    const { data: appointments, error: apptError } = await supabaseServer
      .from('appointments')
      .select('id, doctor_id')
      .in('id', appointmentIds.length ? appointmentIds : ['00000000-0000-0000-0000-000000000000'])

    if (apptError) throw apptError

    const appointmentDoctorMap = new Map((appointments || []).map((a) => [a.id, a.doctor_id]))
    const doctorIds = Array.from(new Set((appointments || []).map((a) => a.doctor_id).filter(Boolean)))

    // 3. Doctors -> which hospital (only hospital-affiliated doctors matter here)
    const { data: doctors, error: doctorsError } = await supabaseServer
      .from('doctors')
      .select('id, hospital_id')
      .in('id', doctorIds.length ? doctorIds : ['00000000-0000-0000-0000-000000000000'])

    if (doctorsError) throw doctorsError

    const doctorHospitalMap = new Map((doctors || []).map((d) => [d.id, d.hospital_id]))
    const hospitalIds = Array.from(
      new Set((doctors || []).map((d) => d.hospital_id).filter(Boolean))
    ) as string[]

    // 4. Hospital commission settings + names
    const { data: hospitals, error: hospitalsError } = await supabaseServer
      .from('hospitals')
      .select('id, commission_type, commission_value')
      .in('id', hospitalIds.length ? hospitalIds : ['00000000-0000-0000-0000-000000000000'])

    if (hospitalsError) throw hospitalsError

    const { data: hospitalProfiles, error: hospitalProfilesError } = await supabaseServer
      .from('profiles')
      .select('id, name')
      .in('id', hospitalIds.length ? hospitalIds : ['00000000-0000-0000-0000-000000000000'])

    if (hospitalProfilesError) throw hospitalProfilesError

    const hospitalCommissionMap = new Map(
      (hospitals || []).map((h) => [h.id, { type: h.commission_type, value: h.commission_value }])
    )
    const hospitalNameMap = new Map((hospitalProfiles || []).map((p) => [p.id, p.name]))

    // 5. Doctor + patient names for the transaction list
    const patientIds = Array.from(new Set((payments || []).map((p) => p.patient_id).filter(Boolean)))
    const allNamedIds = Array.from(new Set([...doctorIds, ...patientIds]))

    const { data: namedProfiles, error: namedProfilesError } = await supabaseServer
      .from('profiles')
      .select('id, name')
      .in('id', allNamedIds.length ? allNamedIds : ['00000000-0000-0000-0000-000000000000'])

    if (namedProfilesError) throw namedProfilesError

    const nameMap = new Map((namedProfiles || []).map((p) => [p.id, p.name]))

    // 6. Group everything by hospital
    interface HospitalGroup {
      hospital_id: string
      hospital_name: string
      commission_type: string
      commission_value: number
      total_amount: number
      commission_amount: number
      transaction_count: number
      transactions: Array<{
        payment_id: string
        doctor_name: string
        patient_name: string
        amount: number
        created_at: string
      }>
    }

    const groups = new Map<string, HospitalGroup>()

    for (const payment of payments || []) {
      const doctorId = appointmentDoctorMap.get(payment.appointment_id)
      if (!doctorId) continue

      const hospitalId = doctorHospitalMap.get(doctorId)
      if (!hospitalId) continue // independent doctor, not tied to any hospital

      if (!groups.has(hospitalId)) {
        const commission = hospitalCommissionMap.get(hospitalId) || {
          type: 'percentage',
          value: 10,
        }
        groups.set(hospitalId, {
          hospital_id: hospitalId,
          hospital_name: hospitalNameMap.get(hospitalId) || 'Unknown hospital',
          commission_type: commission.type,
          commission_value: Number(commission.value),
          total_amount: 0,
          commission_amount: 0,
          transaction_count: 0,
          transactions: [],
        })
      }

      const group = groups.get(hospitalId)!
      const amount = Number(payment.amount) || 0

      group.total_amount += amount
      group.transaction_count += 1
      group.transactions.push({
        payment_id: payment.id,
        doctor_name: nameMap.get(doctorId) || 'Unknown doctor',
        patient_name: nameMap.get(payment.patient_id) || 'Unknown patient',
        amount,
        created_at: payment.created_at,
      })
    }

    // Compute commission per hospital based on its own rate
    for (const group of groups.values()) {
      group.commission_amount =
        group.commission_type === 'fixed'
          ? group.commission_value * group.transaction_count
          : (group.commission_value / 100) * group.total_amount
    }

    const result = Array.from(groups.values()).sort((a, b) => b.total_amount - a.total_amount)

    return NextResponse.json({ success: true, hospitals: result })
  } catch (error) {
    console.error('admin/hospital-transactions GET error:', error)
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Failed to load hospital transactions') },
      { status: 500 }
    )
  }
}
