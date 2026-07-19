'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useConfirm } from '@/components/ConfirmModal'

interface WithdrawalRow {
  id: string
  user_id: string
  role: string
  amount: number
  method: string
  account_number: string
  bank_name: string | null
  account_holder_name: string | null
  status: string
  created_at: string
  requester: { name: string; email: string } | null
}

export default function AdminWithdrawalsPage() {
  const confirm = useConfirm()
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('pending')
  const [actionId, setActionId] = useState<string | null>(null)

  const loadWithdrawals = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/withdrawals')
      const result = await res.json()
      if (result.success) setWithdrawals(result.withdrawals)
      else toast.error(result.message || 'Failed to load withdrawals')
    } catch (error) {
      console.error(error)
      toast.error('Failed to load withdrawals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWithdrawals()
  }, [])

  const handleAction = async (id: string, action: 'complete' | 'reject') => {
    const ok = await confirm({
      title: action === 'complete' ? 'Mark as paid' : 'Reject withdrawal',
      message:
        action === 'complete'
          ? 'Confirm that this withdrawal has been paid out. This will deduct the amount from the wallet balance.'
          : 'Reject this withdrawal request?',
      confirmLabel: action === 'complete' ? 'Mark Paid' : 'Reject',
      danger: action === 'reject',
    })
    if (!ok) return

    setActionId(id)
    try {
      const res = await fetch(`/api/withdrawals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const result = await res.json()

      if (!result.success) {
        toast.error(result.message || 'Action failed')
        return
      }

      loadWithdrawals()
    } catch (error) {
      console.error(error)
      toast.error('Action failed')
    } finally {
      setActionId(null)
    }
  }

  const filtered = withdrawals.filter((w) => filter === 'all' || w.status === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-text-dark">Withdrawal Requests</h1>
        <div className="flex gap-2">
          {(['pending', 'completed', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                filter === f ? 'bg-primary text-white' : 'bg-white border border-border text-text-dark'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-text-grey">No withdrawal requests found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <div key={w.id} className="bg-white rounded-2xl border border-border p-5">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text-dark">{w.requester?.name || 'Unknown'}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">{w.role}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        w.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : w.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>
                  <p className="text-sm text-text-grey mt-1">{w.requester?.email}</p>
                  <div className="text-sm text-text-dark mt-2 space-y-0.5">
                    <p>Amount: ৳{w.amount}</p>
                    <p>Method: {w.method}{w.bank_name ? ` · ${w.bank_name}` : ''}</p>
                    <p>Account: {w.account_number}{w.account_holder_name ? ` (${w.account_holder_name})` : ''}</p>
                    <p className="text-text-grey text-xs">{new Date(w.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {w.status === 'pending' && (
                  <div className="flex sm:flex-col gap-2">
                    <button
                      onClick={() => handleAction(w.id, 'complete')}
                      disabled={actionId === w.id}
                      className="px-4 py-2 bg-secondary text-white rounded-lg text-sm disabled:opacity-60"
                    >
                      Mark Paid
                    </button>
                    <button
                      onClick={() => handleAction(w.id, 'reject')}
                      disabled={actionId === w.id}
                      className="px-4 py-2 bg-error text-white rounded-lg text-sm disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
