import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { getErrorMessage } from '@/lib/error-message'

// PATCH: { action: 'complete' | 'reject' }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { action } = await req.json()

    const { data: withdrawal, error: fetchError } = await supabaseServer
      .from('withdrawal_requests')
      .select('id, user_id, role, amount, status')
      .eq('id', id)
      .single()

    if (fetchError || !withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Withdrawal request not found' },
        { status: 404 }
      )
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'This request has already been reviewed' },
        { status: 400 }
      )
    }

    const walletTable =
      withdrawal.role === 'doctor' ? 'doctor_wallets' : 'hospital_wallets'
    const walletIdColumn =
      withdrawal.role === 'doctor' ? 'doctor_id' : 'hospital_id'

    if (action === 'complete') {
      const { data: wallet, error: walletError } = await supabaseServer
        .from(walletTable)
        .select('balance, total_withdrawn')
        .eq(walletIdColumn, withdrawal.user_id)
        .single()

      if (walletError || !wallet) {
        return NextResponse.json(
          { success: false, message: 'Wallet not found for this user' },
          { status: 404 }
        )
      }

      if (Number(wallet.balance) < Number(withdrawal.amount)) {
        return NextResponse.json(
          { success: false, message: 'Wallet balance is lower than the requested amount' },
          { status: 400 }
        )
      }

      const { error: updateWalletError } = await supabaseServer
        .from(walletTable)
        .update({
          balance: Number(wallet.balance) - Number(withdrawal.amount),
          total_withdrawn: Number(wallet.total_withdrawn || 0) + Number(withdrawal.amount),
        })
        .eq(walletIdColumn, withdrawal.user_id)

      if (updateWalletError) throw updateWalletError

      const { error: updateStatusError } = await supabaseServer
        .from('withdrawal_requests')
        .update({ status: 'completed' })
        .eq('id', id)

      if (updateStatusError) throw updateStatusError

      return NextResponse.json({ success: true })
    }

    if (action === 'reject') {
      const { error: updateStatusError } = await supabaseServer
        .from('withdrawal_requests')
        .update({ status: 'rejected' })
        .eq('id', id)

      if (updateStatusError) throw updateStatusError

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('admin/withdrawals PATCH error:', error)
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Action failed') },
      { status: 500 }
    )
  }
}
