import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { getErrorMessage } from '@/lib/error-message'

// PATCH: { action: 'approve' | 'reject' | 'ban' | 'unban' | 'freeze' | 'unfreeze' | 'update_commission' }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action } = body

    if (action === 'approve') {
      const { error } = await supabaseServer
        .from('doctors')
        .update({ is_approved: true })
        .eq('id', id)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    if (action === 'reject') {
      // No dedicated "rejected" status column exists, so a reject
      // permanently removes the application: doctor row, profile row,
      // and the auth user itself (so the email becomes free again).
      await supabaseServer.from('doctors').delete().eq('id', id)
      await supabaseServer.from('profiles').delete().eq('id', id)
      await supabaseServer.auth.admin.deleteUser(id)

      return NextResponse.json({ success: true })
    }

    if (action === 'ban') {
      // Ban at the Supabase Auth level too (not just a flag) so the
      // account is actually blocked from logging in anywhere, with no
      // changes needed in the main app.
      const { error: authError } = await supabaseServer.auth.admin.updateUserById(id, {
        ban_duration: '876000h', // ~100 years, effectively indefinite
      })

      if (authError) throw authError

      const { error } = await supabaseServer
        .from('doctors')
        .update({ is_banned: true })
        .eq('id', id)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    if (action === 'unban') {
      const { error: authError } = await supabaseServer.auth.admin.updateUserById(id, {
        ban_duration: 'none',
      })

      if (authError) throw authError

      const { error } = await supabaseServer
        .from('doctors')
        .update({ is_banned: false })
        .eq('id', id)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    if (action === 'freeze') {
      // Lighter than a ban: the doctor can still log in, but is marked
      // unavailable so patients can't see or book them.
      const { error } = await supabaseServer
        .from('doctors')
        .update({ is_frozen: true, is_available: false })
        .eq('id', id)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    if (action === 'unfreeze') {
      const { error } = await supabaseServer
        .from('doctors')
        .update({ is_frozen: false, is_available: true })
        .eq('id', id)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    if (action === 'update_commission') {
      const { commission_type, commission_value } = body

      if (commission_type !== 'percentage' && commission_type !== 'fixed') {
        return NextResponse.json(
          { success: false, message: 'commission_type must be "percentage" or "fixed"' },
          { status: 400 }
        )
      }

      const value = Number(commission_value)

      if (Number.isNaN(value) || value < 0) {
        return NextResponse.json(
          { success: false, message: 'commission_value must be a valid non-negative number' },
          { status: 400 }
        )
      }

      if (commission_type === 'percentage' && value > 100) {
        return NextResponse.json(
          { success: false, message: 'Percentage commission cannot exceed 100' },
          { status: 400 }
        )
      }

      const { error } = await supabaseServer
        .from('doctors')
        .update({ commission_type, commission_value: value })
        .eq('id', id)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('admin/doctors PATCH error:', error)
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Action failed') },
      { status: 500 }
    )
  }
}
