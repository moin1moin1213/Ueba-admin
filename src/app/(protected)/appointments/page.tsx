'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader } from '@/components/Loader'

interface AppointmentRow {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  fee: number
  symptoms: string | null
  created_at: string
  patient: { name: string; phone: string } | null
  doctor: {
    speciality: string
    profile: { name: string } | null
  } | null
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/appointments')
        const result = await res.json()
        if (result.success) setAppointments(result.appointments)
        else toast.error(result.message || 'Failed to load appointments')
      } catch (error) {
        console.error(error)
        toast.error('Failed to load appointments')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-dark mb-6">Appointments</h1>

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
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 sticky left-0 bg-white">
                    <div className="font-medium text-text-dark">{a.patient?.name || '—'}</div>
                    <div className="text-text-grey text-xs">{a.patient?.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-dark">{a.doctor?.profile?.name || '—'}</div>
                    <div className="text-text-grey text-xs">{a.doctor?.speciality}</div>
                  </td>
                  <td className="px-4 py-3 text-text-grey">
                    {a.appointment_date} · {a.appointment_time}
                  </td>
                  <td className="px-4 py-3 text-text-dark">৳{a.fee}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor[a.status] || 'bg-gray-100 text-gray-700'}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {appointments.length === 0 && (
            <p className="text-text-grey p-6 text-center">No appointments found.</p>
          )}
        </div>
      )}
    </div>
  )
}
