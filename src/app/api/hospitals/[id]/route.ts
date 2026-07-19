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
        .from('hospitals')
        .update({ is_approved: true })
        .eq('id', id)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    if (action === 'reject') {
      await supabaseServer.from('hospitals').delete().eq('id', id)
      await supabaseServer.from('profiles').delete().eq('id', id)
      await supabaseServer.auth.admin.deleteUser(id)

      return NextResponse.json({ success: true })
    }

    if (action === 'ban') {
      const { error: authError } = await supabaseServer.auth.admin.updateUserById(id, {
        ban_duration: '876000h',
      })

      if (authError) throw authError

      const { error } = await supabaseServer
        .from('hospitals')
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
        .from('hospitals')
        .update({ is_banned: false })
        .eq('id', id)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    if (action === 'freeze') {
      // Lighter than a ban: the hospital can still log in, but is
      // marked frozen. NOTE: unlike doctors (which have an existing
      // is_available column patient listings already check), hospitals
      // don't have an equivalent field here - the main app's hospital
      // search/listing query needs to filter out is_frozen = true for
      // this to actually hide them from patients.
      const { error } = await supabaseServer
        .from('hospitals')
        .update({ is_frozen: true })
        .eq('id', id)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    if (action === 'unfreeze') {
      const { error } = await supabaseServer
        .from('hospitals')
        .update({ is_frozen: false })
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
        .from('hospitals')
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
    console.error('admin/hospitals PATCH error:', error)
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Action failed') },
      { status: 500 }
    )
  }
}
