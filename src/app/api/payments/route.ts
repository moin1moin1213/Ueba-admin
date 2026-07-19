import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { getErrorMessage } from '@/lib/error-message'

export async function GET() {
  try {
    const { data: payments, error: paymentsError } = await supabaseServer
      .from('payments')
      .select('id, patient_id, appointment_id, amount, payment_method, transaction_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200)

    if (paymentsError) throw paymentsError

    const patientIds = Array.from(new Set((payments || []).map((p) => p.patient_id).filter(Boolean)))
    const appointmentIds = Array.from(new Set((payments || []).map((p) => p.appointment_id).filter(Boolean)))

    const [{ data: patients, error: patientsError }, { data: appointments, error: apptError }] = await Promise.all([
      supabaseServer
        .from('profiles')
        .select('id, name, phone')
        .in('id', patientIds.length ? patientIds : ['00000000-0000-0000-0000-000000000000']),
      supabaseServer
        .from('appointments')
        .select('id, appointment_date, doctor_id')
        .in('id', appointmentIds.length ? appointmentIds : ['00000000-0000-0000-0000-000000000000']),
    ])

    if (patientsError) throw patientsError
    if (apptError) throw apptError

    const doctorIds = Array.from(new Set((appointments || []).map((a) => a.doctor_id).filter(Boolean)))
    const { data: doctors, error: doctorsError } = await supabaseServer
      .from('doctors')
      .select('id')
      .in('id', doctorIds.length ? doctorIds : ['00000000-0000-0000-0000-000000000000'])

    if (doctorsError) throw doctorsError

    const doctorProfileIds = Array.from(new Set((doctors || []).map((d) => d.id)))
    const { data: doctorProfiles, error: doctorProfilesError } = await supabaseServer
      .from('profiles')
      .select('id, name')
      .in('id', doctorProfileIds.length ? doctorProfileIds : ['00000000-0000-0000-0000-000000000000'])

    if (doctorProfilesError) throw doctorProfilesError

    const patientMap = new Map((patients || []).map((p) => [p.id, p]))
    const doctorProfileMap = new Map((doctorProfiles || []).map((p) => [p.id, p]))
    const appointmentMap = new Map(
      (appointments || []).map((a) => [
        a.id,
        {
          appointment_date: a.appointment_date,
          doctor: { profile: doctorProfileMap.get(a.doctor_id) || null },
        },
      ])
    )

    const merged = (payments || []).map((p) => ({
      ...p,
      patient: patientMap.get(p.patient_id) || null,
      appointment: appointmentMap.get(p.appointment_id) || null,
    }))

    return NextResponse.json({ success: true, payments: merged })
  } catch (error) {
    console.error('admin/payments GET error:', error)
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Failed to load payments') },
      { status: 500 }
    )
  }
}
