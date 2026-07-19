import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { getErrorMessage } from '@/lib/error-message'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')

    let query = supabaseServer
      .from('profiles')
      .select('id, name, email, phone, role, district, upazila, created_at')
      .order('created_at', { ascending: false })

    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, users: data })
  } catch (error) {
    console.error('admin/users GET error:', error)
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Failed to load users') },
      { status: 500 }
    )
  }
}
