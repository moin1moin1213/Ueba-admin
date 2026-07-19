'use client'

import { useEffect, useState } from 'react'

interface Stats {
  totalPatients: number
  totalDoctors: number
  pendingDoctors: number
  totalHospitals: number
  pendingHospitals: number
  totalAppointments: number
  pendingWithdrawals: number
  totalRevenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/stats')
        const result = await res.json()
        if (result.success) setStats(result.stats)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cards = stats
    ? [
        { label: 'Total Patients', value: stats.totalPatients, icon: '🧑‍🤝‍🧑' },
        { label: 'Total Doctors', value: stats.totalDoctors, icon: '🩺' },
        { label: 'Pending Doctor Approvals', value: stats.pendingDoctors, icon: '⏳', highlight: stats.pendingDoctors > 0 },
        { label: 'Total Hospitals', value: stats.totalHospitals, icon: '🏥' },
        { label: 'Pending Hospital Approvals', value: stats.pendingHospitals, icon: '⏳', highlight: stats.pendingHospitals > 0 },
        { label: 'Total Appointments', value: stats.totalAppointments, icon: '📅' },
        { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, icon: '💸', highlight: stats.pendingWithdrawals > 0 },
        { label: 'Total Revenue (Completed)', value: `৳${stats.totalRevenue.toLocaleString()}`, icon: '💰' },
      ]
    : []

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-dark mb-6">Dashboard</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`bg-white rounded-2xl border p-5 ${
                card.highlight ? 'border-warning' : 'border-border'
              }`}
            >
              <div className="text-2xl mb-2">{card.icon}</div>
              <div className="text-2xl font-bold text-text-dark">{card.value}</div>
              <div className="text-sm text-text-grey mt-1">{card.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
