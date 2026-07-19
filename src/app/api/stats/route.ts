import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { getErrorMessage } from '@/lib/error-message'

export async function GET() {
  try {
    const [
      { count: totalPatients },
      { count: totalDoctors },
      { count: pendingDoctors },
      { count: totalHospitals },
      { count: pendingHospitals },
      { count: totalAppointments },
      { count: pendingWithdrawals },
      { data: completedPayments },
    ] = await Promise.all([
      supabaseServer.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
      supabaseServer.from('doctors').select('*', { count: 'exact', head: true }),
      supabaseServer.from('doctors').select('*', { count: 'exact', head: true }).eq('is_approved', false),
      supabaseServer.from('hospitals').select('*', { count: 'exact', head: true }),
      supabaseServer.from('hospitals').select('*', { count: 'exact', head: true }).eq('is_approved', false),
      supabaseServer.from('appointments').select('*', { count: 'exact', head: true }),
      supabaseServer.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseServer.from('payments').select('amount').eq('status', 'completed'),
    ])

    const totalRevenue = (completedPayments || []).reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    )

    return NextResponse.json({
      success: true,
      stats: {
        totalPatients: totalPatients || 0,
        totalDoctors: totalDoctors || 0,
        pendingDoctors: pendingDoctors || 0,
        totalHospitals: totalHospitals || 0,
        pendingHospitals: pendingHospitals || 0,
        totalAppointments: totalAppointments || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
        totalRevenue,
      },
    })
  } catch (error) {
    console.error('admin/stats error:', error)
    return NextResponse.json(
      { success: false, message: getErrorMessage(error, 'Failed to load stats') },
      { status: 500 }
    )
  }
}
