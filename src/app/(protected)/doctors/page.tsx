'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useConfirm } from '@/components/ConfirmModal'

interface Doctor {
  id: string
  bmdc_number: string
  speciality: string
  degree: string
  experience: number
  consultation_fee: number
  is_approved: boolean
  is_available: boolean
  is_banned: boolean
  is_frozen: boolean
  hospital_id: string | null
  hospital_name: string | null
  commission_type: 'percentage' | 'fixed'
  commission_value: number
  profile: {
    name: string
    email: string
    phone: string
    district: string
    upazila: string
    created_at: string
  } | null
}

export default function AdminDoctorsPage() {
  const confirm = useConfirm()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [actionId, setActionId] = useState<string | null>(null)

  // Draft commission edits, keyed by doctor id, so typing doesn't
  // immediately overwrite the saved value until "Save" is pressed.
  const [drafts, setDrafts] = useState<
    Record<string, { commission_type: 'percentage' | 'fixed'; commission_value: string }>
  >({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const loadDoctors = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/doctors')
      const result = await res.json()
      if (result.success) {
        setDoctors(result.doctors)
        const nextDrafts: typeof drafts = {}
        for (const d of result.doctors as Doctor[]) {
          nextDrafts[d.id] = {
            commission_type: d.commission_type || 'percentage',
            commission_value: String(d.commission_value ?? 10),
          }
        }
        setDrafts(nextDrafts)
      } else {
        toast.error(result.message || 'Failed to load doctors')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load doctors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctors()
  }, [])

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'ban' | 'unban' | 'freeze' | 'unfreeze') => {
    if (action === 'reject') {
      const ok = await confirm({
        title: 'Reject doctor',
        message: 'This will permanently delete this doctor\'s account. This cannot be undone.',
        confirmLabel: 'Reject',
        danger: true,
      })
      if (!ok) return
    }

    if (action === 'ban') {
      const ok = await confirm({
        title: 'Ban doctor',
        message: 'This will suspend the doctor\'s account and block them from logging in.',
        confirmLabel: 'Ban',
        danger: true,
      })
      if (!ok) return
    }

    if (action === 'freeze') {
      const ok = await confirm({
        title: 'Freeze doctor',
        message: 'The doctor can still log in, but will be hidden from patients as unavailable.',
        confirmLabel: 'Freeze',
      })
      if (!ok) return
    }

    setActionId(id)
    try {
      const res = await fetch(`/api/doctors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const result = await res.json()

      if (!result.success) {
        toast.error(result.message || 'Action failed')
        return
      }

      loadDoctors()
    } catch (error) {
      console.error(error)
      toast.error('Action failed')
    } finally {
      setActionId(null)
    }
  }

  const handleSaveCommission = async (id: string) => {
    const draft = drafts[id]
    if (!draft) return

    setSavingId(id)
    try {
      const res = await fetch(`/api/doctors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_commission',
          commission_type: draft.commission_type,
          commission_value: draft.commission_value,
        }),
      })
      const result = await res.json()

      if (!result.success) {
        toast.error(result.message || 'Failed to update commission')
        return
      }

      loadDoctors()
    } catch (error) {
      console.error(error)
      toast.error('Failed to update commission')
    } finally {
      setSavingId(null)
    }
  }

  const filtered = doctors.filter((d) => {
    if (filter === 'pending') return !d.is_approved
    if (filter === 'approved') return d.is_approved
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-dark">Doctors</h1>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved'] as const).map((f) => (
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
        <p className="text-text-grey">No doctors found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((doctor) => {
            const draft = drafts[doctor.id] || { commission_type: 'percentage' as const, commission_value: '10' }
            const feePreview =
              draft.commission_type === 'percentage'
                ? `≈ ৳${((Number(draft.commission_value) || 0) / 100 * doctor.consultation_fee).toFixed(0)} on a ৳${doctor.consultation_fee} fee`
                : `flat ৳${Number(draft.commission_value) || 0} per appointment`

            return (
              <div key={doctor.id} className="bg-white rounded-2xl border border-border p-5">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-dark">{doctor.profile?.name || 'Unknown'}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          doctor.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {doctor.is_approved ? 'Approved' : 'Pending'}
                      </span>
                      {doctor.is_banned && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          Banned
                        </span>
                      )}
                      {doctor.is_frozen && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          Frozen
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-grey mt-1">{doctor.profile?.email}</p>
                    <p className="text-sm text-text-grey">{doctor.profile?.phone}</p>
                    <div className="text-sm text-text-dark mt-2 space-y-0.5">
                      <p>Speciality: {doctor.speciality}</p>
                      <p>Degree: {doctor.degree}</p>
                      <p>BMDC: {doctor.bmdc_number}</p>
                      <p>Experience: {doctor.experience} years</p>
                      <p>Consultation Fee: ৳{doctor.consultation_fee}</p>
                      <p>Location: {doctor.profile?.district}, {doctor.profile?.upazila}</p>
                      <p>
                        {doctor.hospital_id ? (
                          <>Hospital: <span className="font-medium">{doctor.hospital_name || 'Unknown hospital'}</span></>
                        ) : (
                          <span className="text-text-grey italic">Independent Doctor</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-2">
                    {!doctor.is_approved && (
                      <>
                        <button
                          onClick={() => handleAction(doctor.id, 'approve')}
                          disabled={actionId === doctor.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(doctor.id, 'reject')}
                          disabled={actionId === doctor.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {doctor.is_approved && !Boolean(doctor.is_banned) && (
                      <button
                        onClick={() => handleAction(doctor.id, 'ban')}
                        disabled={actionId === doctor.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-60"
                      >
                        Ban
                      </button>
                    )}

                    {doctor.is_approved && Boolean(doctor.is_banned) && (
                      <button
                        onClick={() => handleAction(doctor.id, 'unban')}
                        disabled={actionId === doctor.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-60"
                      >
                        Unban
                      </button>
                    )}

                    {doctor.is_approved && !Boolean(doctor.is_frozen) && (
                      <button
                        onClick={() => handleAction(doctor.id, 'freeze')}
                        disabled={actionId === doctor.id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-60"
                      >
                        Freeze
                      </button>
                    )}

                    {doctor.is_approved && Boolean(doctor.is_frozen) && (
                      <button
                        onClick={() => handleAction(doctor.id, 'unfreeze')}
                        disabled={actionId === doctor.id}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm disabled:opacity-60"
                      >
                        Unfreeze
                      </button>
                    )}
                  </div>
                </div>

                {/* Commission editor */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium text-text-dark mb-2">Platform Commission</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={draft.commission_type}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [doctor.id]: { ...draft, commission_type: e.target.value as 'percentage' | 'fixed' },
                        }))
                      }
                      className="px-3 py-2 border border-border rounded-lg text-sm"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (৳)</option>
                    </select>

                    <input
                      type="number"
                      min={0}
                      max={draft.commission_type === 'percentage' ? 100 : undefined}
                      value={draft.commission_value}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [doctor.id]: { ...draft, commission_value: e.target.value },
                        }))
                      }
                      className="w-24 px-3 py-2 border border-border rounded-lg text-sm"
                    />

                    <button
                      onClick={() => handleSaveCommission(doctor.id)}
                      disabled={savingId === doctor.id}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-60"
                    >
                      {savingId === doctor.id ? 'Saving...' : 'Save'}
                    </button>

                    <span className="text-xs text-text-grey">{feePreview}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
