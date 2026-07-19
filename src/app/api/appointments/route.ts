import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { getErrorMessage } from '@/lib/error-message'

export async function GET() {
  try {
    const { data: appointments, error: apptError } = await supabaseServer
      .from('appointments')
      .select('id, patient_id, doctor_id, appointment_date, appointment_time, status, fee, symptoms, created_at')
      .order('created_at', { ascending: false })
      .limit(200)

    if (apptError) throw apptError

    const patientIds = Array.from(new Set((appointments || []).map((a) => a.patient_id).filter(Boolean)))
    const doctorIds = Array.from(new Set((appointments || []).map((a) => a.doctor_id).filter(Boolean)))

    const [{ data: patients, error: patientsError }, { data: doctors, error: doctorsError }] = await Promise.all([
      supabaseServer
        .from('profiles')
        .select('id, name, phone')
        .in('id', patientIds.length ? patientIds : ['00000000-0000-0000-0000-000000000000']),
      supabaseServer
        .from('doctors')
        .select('id, speciality')
        .in('id', doctorIds.length ? doctorIds : ['00000000-0000-0000-0000-000000000000']),
    ])

    if (patientsError) throw patientsError
    if (doctorsError) throw doctorsError

    const doctorProfileIds = Array.from(new Set((doctors || []).map((d) => d.id)))
    const { data: doctorProfiles, error: doctorProfilesError } = await supabaseServer
      .from('profiles')
      .select('id, name')
      .in('id', doctorProfileIds.length ? doctorProfileIds : ['00000000-0000-0000-0000-000000000000'])

    if (doctorProfilesError) throw doctorProfilesError

    const patientMap = new Map((patients || []).map((p) => [p.id, p]))
    const doctorProfileMap = new Map((doctorProfiles || []).map((p) => [p.id, p]))
    const doctorMap = new Map(
      (doctors || []).map((d) => [
        d.id,
        { speciality: d.speciality, profile: doctorProfileMap.get(d.id) || null },
      ])
    )

    const merged = (appointments || []).map((a) => ({
      ...a,
      patient: patientMap.get(a.patient_id) || null,
      doctor: doctorMap.get(a.doctor_id) || null,
    }))

    return NextResponse.json({ success: true, appointments: merged })
  } catch (error) {
    console.error('admin/appointments GET error:', error)
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Failed to load appointments') },
      { status: 500 }
    )
  }
}
