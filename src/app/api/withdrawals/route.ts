import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { getErrorMessage } from '@/lib/error-message'

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Attach requester name/email separately (user_id points at profiles.id
    // for both doctor and hospital requests)
    const userIds = Array.from(new Set((data || []).map((w) => w.user_id)))

    const { data: profiles } = await supabaseServer
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'])

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]))

    const withdrawals = (data || []).map((w) => ({
      ...w,
      requester: profileMap.get(w.user_id) || null,
    }))

    return NextResponse.json({ success: true, withdrawals })
  } catch (error) {
    console.error('admin/withdrawals GET error:', error)
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Failed to load withdrawals') },
      { status: 500 }
    )
  }
}
