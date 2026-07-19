import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { getErrorMessage } from '@/lib/error-message'

export async function GET() {
  try {
    const { data: doctors, error: doctorsError } = await supabaseServer
      .from('doctors')
      .select(`
        id,
        bmdc_number,
        speciality,
        degree,
        experience,
        consultation_fee,
        is_approved,
        is_available,
        is_banned,
        is_frozen,
        commission_type,
        commission_value,
        hospital_id
      `)
      .order('id', { ascending: false })

    if (doctorsError) throw doctorsError

    const ids = (doctors || []).map((d) => d.id)

    const { data: profiles, error: profilesError } = await supabaseServer
      .from('profiles')
      .select('id, name, email, phone, district, upazila, created_at')
      .in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])

    if (profilesError) throw profilesError

    // Resolve hospital names for doctors who are affiliated with one
    const hospitalIds = Array.from(
      new Set((doctors || []).map((d) => d.hospital_id).filter(Boolean))
    ) as string[]

    const { data: hospitalProfiles, error: hospitalProfilesError } = await supabaseServer
      .from('profiles')
      .select('id, name')
      .in('id', hospitalIds.length ? hospitalIds : ['00000000-0000-0000-0000-000000000000'])

    if (hospitalProfilesError) throw hospitalProfilesError

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]))
    const hospitalNameMap = new Map((hospitalProfiles || []).map((p) => [p.id, p.name]))

    const merged = (doctors || []).map((d) => ({
      ...d,
      is_approved: d.is_approved === true,
      is_banned: d.is_banned === true,
      is_frozen: d.is_frozen === true,
      hospital_name: d.hospital_id ? hospitalNameMap.get(d.hospital_id) || null : null,
      profile: profileMap.get(d.id) || null,
    }))

    return NextResponse.json({ success: true, doctors: merged })
  } catch (error) {
    console.error('admin/doctors GET error:', error)
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Failed to load doctors') },
      { status: 500 }
    )
  }
}
