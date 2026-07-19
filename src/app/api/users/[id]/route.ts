import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { getErrorMessage } from '@/lib/error-message'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Clean up role-specific rows first (safe even if they don't exist)
    await supabaseServer.from('doctors').delete().eq('id', id)
    await supabaseServer.from('hospitals').delete().eq('id', id)
    await supabaseServer.from('profiles').delete().eq('id', id)
    await supabaseServer.auth.admin.deleteUser(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('admin/users DELETE error:', error)
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Delete failed') },
      { status: 500 }
    )
  }
}
