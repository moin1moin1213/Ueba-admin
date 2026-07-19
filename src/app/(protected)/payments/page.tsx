'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader } from '@/components/Loader'

interface PaymentRow {
  id: string
  amount: number
  payment_method: string
  transaction_id: string
  status: string
  created_at: string
  patient: { name: string; phone: string } | null
  appointment: {
    appointment_date: string
    doctor: { profile: { name: string } | null } | null
  } | null
}

const statusColor: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/payments')
        const result = await res.json()
        if (result.success) setPayments(result.payments)
        else toast.error(result.message || 'Failed to load payments')
      } catch (error) {
        console.error(error)
        toast.error('Failed to load payments')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalCompleted = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-text-dark">Payment History</h1>
        <div className="bg-white rounded-xl border border-border px-4 py-2 text-sm">
          Total Completed: <span className="font-semibold text-text-dark">৳{totalCompleted.toLocaleString()}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-left text-text-grey border-b border-border">
                <th className="px-4 py-3 sticky left-0 bg-white z-10">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 sticky left-0 bg-white">
                    <div className="font-medium text-text-dark">{p.patient?.name || '—'}</div>
                    <div className="text-text-grey text-xs">{p.patient?.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-text-dark">{p.appointment?.doctor?.profile?.name || '—'}</td>
                  <td className="px-4 py-3 text-text-dark">৳{p.amount}</td>
                  <td className="px-4 py-3 text-text-grey capitalize">{p.payment_method}</td>
                  <td className="px-4 py-3 text-text-grey">{p.transaction_id}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor[p.status] || 'bg-gray-100 text-gray-700'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-grey">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {payments.length === 0 && (
            <p className="text-text-grey p-6 text-center">No payments found.</p>
          )}
        </div>
      )}
    </div>
  )
}
