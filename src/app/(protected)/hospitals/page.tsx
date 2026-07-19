'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useConfirm } from '@/components/ConfirmModal'

interface Hospital {
  id: string
  dghs_license: string
  whatsapp_number: string
  address: string
  total_beds: number
  available_beds: number
  has_oxygen: boolean
  has_ot: boolean
  is_approved: boolean
  is_banned: boolean
  is_frozen: boolean
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

export default function AdminHospitalsPage() {
  const confirm = useConfirm()
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [actionId, setActionId] = useState<string | null>(null)

  const [drafts, setDrafts] = useState<
    Record<string, { commission_type: 'percentage' | 'fixed'; commission_value: string }>
  >({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const loadHospitals = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/hospitals')
      const result = await res.json()
      if (result.success) {
        setHospitals(result.hospitals)
        const nextDrafts: typeof drafts = {}
        for (const h of result.hospitals as Hospital[]) {
          nextDrafts[h.id] = {
            commission_type: h.commission_type || 'percentage',
            commission_value: String(h.commission_value ?? 10),
          }
        }
        setDrafts(nextDrafts)
      } else {
        toast.error(result.message || 'Failed to load hospitals')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load hospitals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHospitals()
  }, [])

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'ban' | 'unban' | 'freeze' | 'unfreeze') => {
    if (action === 'reject') {
      const ok = await confirm({
        title: 'Reject hospital',
        message: 'This will permanently delete this hospital\'s account. This cannot be undone.',
        confirmLabel: 'Reject',
        danger: true,
      })
      if (!ok) return
    }

    if (action === 'ban') {
      const ok = await confirm({
        title: 'Ban hospital',
        message: 'This will suspend the hospital\'s account and block them from logging in.',
        confirmLabel: 'Ban',
        danger: true,
      })
      if (!ok) return
    }

    if (action === 'freeze') {
      const ok = await confirm({
        title: 'Freeze hospital',
        message: 'The hospital can still log in, but will be hidden/restricted for patients.',
        confirmLabel: 'Freeze',
      })
      if (!ok) return
    }

    setActionId(id)
    try {
      const res = await fetch(`/api/hospitals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const result = await res.json()

      if (!result.success) {
        toast.error(result.message || 'Action failed')
        return
      }

      loadHospitals()
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
      const res = await fetch(`/api/hospitals/${id}`, {
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

      loadHospitals()
    } catch (error) {
      console.error(error)
      toast.error('Failed to update commission')
    } finally {
      setSavingId(null)
    }
  }

  const filtered = hospitals.filter((h) => {
    if (filter === 'pending') return !h.is_approved
    if (filter === 'approved') return h.is_approved
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-dark">Hospitals</h1>
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
        <p className="text-text-grey">No hospitals found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((hospital) => {
            const draft = drafts[hospital.id] || { commission_type: 'percentage' as const, commission_value: '10' }
            const feePreview =
              draft.commission_type === 'percentage'
                ? `${draft.commission_value || 0}% of each appointment fee`
                : `flat ৳${Number(draft.commission_value) || 0} per appointment`

            return (
              <div key={hospital.id} className="bg-white rounded-2xl border border-border p-5">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-dark">{hospital.profile?.name || 'Unknown'}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          hospital.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {hospital.is_approved ? 'Approved' : 'Pending'}
                      </span>
                      {hospital.is_banned && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          Banned
                        </span>
                      )}
                      {hospital.is_frozen && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          Frozen
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-grey mt-1">{hospital.profile?.email}</p>
                    <p className="text-sm text-text-grey">{hospital.profile?.phone}</p>
                    <div className="text-sm text-text-dark mt-2 space-y-0.5">
                      <p>DGHS License: {hospital.dghs_license}</p>
                      <p>Address: {hospital.address}</p>
                      <p>Total Beds: {hospital.total_beds}</p>
                      <p>Oxygen: {hospital.has_oxygen ? 'Yes' : 'No'} · OT: {hospital.has_ot ? 'Yes' : 'No'}</p>
                      <p>Location: {hospital.profile?.district}, {hospital.profile?.upazila}</p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-2">
                    {!hospital.is_approved && (
                      <>
                        <button
                          onClick={() => handleAction(hospital.id, 'approve')}
                          disabled={actionId === hospital.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(hospital.id, 'reject')}
                          disabled={actionId === hospital.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {hospital.is_approved && !Boolean(hospital.is_banned) && (
                      <button
                        onClick={() => handleAction(hospital.id, 'ban')}
                        disabled={actionId === hospital.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-60"
                      >
                        Ban
                      </button>
                    )}

                    {hospital.is_approved && Boolean(hospital.is_banned) && (
                      <button
                        onClick={() => handleAction(hospital.id, 'unban')}
                        disabled={actionId === hospital.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-60"
                      >
                        Unban
                      </button>
                    )}

                    {hospital.is_approved && !Boolean(hospital.is_frozen) && (
                      <button
                        onClick={() => handleAction(hospital.id, 'freeze')}
                        disabled={actionId === hospital.id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-60"
                      >
                        Freeze
                      </button>
                    )}

                    {hospital.is_approved && Boolean(hospital.is_frozen) && (
                      <button
                        onClick={() => handleAction(hospital.id, 'unfreeze')}
                        disabled={actionId === hospital.id}
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
                          [hospital.id]: { ...draft, commission_type: e.target.value as 'percentage' | 'fixed' },
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
                          [hospital.id]: { ...draft, commission_value: e.target.value },
                        }))
                      }
                      className="w-24 px-3 py-2 border border-border rounded-lg text-sm"
                    />

                    <button
                      onClick={() => handleSaveCommission(hospital.id)}
                      disabled={savingId === hospital.id}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-60"
                    >
                      {savingId === hospital.id ? 'Saving...' : 'Save'}
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
