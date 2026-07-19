import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { getErrorMessage } from '@/lib/error-message'

export async function GET() {
  try {
    const { data: hospitals, error: hospitalsError } = await supabaseServer
      .from('hospitals')
      .select(`
        id,
        dghs_license,
        whatsapp_number,
        address,
        total_beds,
        available_beds,
        has_oxygen,
        has_ot,
        is_approved,
        is_banned,
        is_frozen,
        commission_type,
        commission_value
      `)
      .order('id', { ascending: false })

    if (hospitalsError) throw hospitalsError

    const ids = (hospitals || []).map((h) => h.id)

    const { data: profiles, error: profilesError } = await supabaseServer
      .from('profiles')
      .select('id, name, email, phone, district, upazila, created_at')
      .in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])

    if (profilesError) throw profilesError

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]))

    const merged = (hospitals || []).map((h) => ({
      ...h,
      is_approved: h.is_approved === true,
      is_banned: h.is_banned === true,
      is_frozen: h.is_frozen === true,
      profile: profileMap.get(h.id) || null,
    }))

    return NextResponse.json({ success: true, hospitals: merged })
  } catch (error) {
    console.error('admin/hospitals GET error:', error)
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Failed to load hospitals') },
      { status: 500 }
    )
  }
}
