'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader } from '@/components/Loader'

interface Transaction {
  payment_id: string
  doctor_name: string
  patient_name: string
  amount: number
  created_at: string
}

interface HospitalGroup {
  hospital_id: string
  hospital_name: string
  commission_type: 'percentage' | 'fixed'
  commission_value: number
  total_amount: number
  commission_amount: number
  transaction_count: number
  transactions: Transaction[]
}

export default function HospitalTransactionsPage() {
  const [groups, setGroups] = useState<HospitalGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/hospital-transactions')
        const result = await res.json()
        if (result.success) setGroups(result.hospitals)
        else toast.error(result.message || 'Failed to load hospital transactions')
      } catch (error) {
        console.error(error)
        toast.error('Failed to load hospital transactions')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const grandTotal = groups.reduce((sum, g) => sum + g.total_amount, 0)
  const grandCommission = groups.reduce((sum, g) => sum + g.commission_amount, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-text-dark">Hospital Transactions</h1>
      </div>
      <p className="text-sm text-text-grey mb-6">Last 30 days · completed payments only</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader />
        </div>
      ) : groups.length === 0 ? (
        <p className="text-text-grey">No hospital-linked transactions in the last 30 days.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="text-2xl font-bold text-text-dark">৳{grandTotal.toLocaleString()}</div>
              <div className="text-sm text-text-grey mt-1">Total transacted (all hospitals)</div>
            </div>
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="text-2xl font-bold text-text-dark">৳{grandCommission.toFixed(0)}</div>
              <div className="text-sm text-text-grey mt-1">Platform commission earned</div>
            </div>
          </div>

          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.hospital_id} className="bg-white rounded-2xl border border-border p-5">
                <button
                  onClick={() => setExpandedId(expandedId === group.hospital_id ? null : group.hospital_id)}
                  className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left"
                >
                  <div>
                    <h3 className="font-semibold text-text-dark">{group.hospital_name}</h3>
                    <p className="text-xs text-text-grey">
                      {group.transaction_count} transaction{group.transaction_count !== 1 ? 's' : ''} ·{' '}
                      {group.commission_type === 'percentage'
                        ? `${group.commission_value}% commission`
                        : `৳${group.commission_value} fixed per transaction`}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-lg font-bold text-text-dark">৳{group.total_amount.toLocaleString()}</div>
                      <div className="text-xs text-text-grey">total</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-teal-700">৳{group.commission_amount.toFixed(0)}</div>
                      <div className="text-xs text-text-grey">commission</div>
                    </div>
                    <span className="text-text-grey">{expandedId === group.hospital_id ? '▲' : '▼'}</span>
                  </div>
                </button>

                {expandedId === group.hospital_id && (
                  <div className="mt-4 pt-4 border-t border-border overflow-x-auto">
                    <table className="w-full text-sm whitespace-nowrap">
                      <thead>
                        <tr className="text-left text-text-grey border-b border-border">
                          <th className="py-2 pr-4">Doctor</th>
                          <th className="py-2 pr-4">Patient</th>
                          <th className="py-2 pr-4">Amount</th>
                          <th className="py-2 pr-4">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.transactions.map((t) => (
                          <tr key={t.payment_id} className="border-b border-border last:border-0">
                            <td className="py-2 pr-4 text-text-dark">{t.doctor_name}</td>
                            <td className="py-2 pr-4 text-text-grey">{t.patient_name}</td>
                            <td className="py-2 pr-4 text-text-dark">৳{t.amount}</td>
                            <td className="py-2 pr-4 text-text-grey">
                              {new Date(t.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
