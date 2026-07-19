'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useConfirm } from '@/components/ConfirmModal'

interface UserRow {
  id: string
  name: string
  email: string
  phone: string
  role: string
  district: string
  upazila: string
  created_at: string
}

export default function AdminUsersPage() {
  const confirm = useConfirm()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<'all' | 'patient' | 'doctor' | 'hospital'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadUsers = async (role: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users?role=${role}`)
      const result = await res.json()
      if (result.success) setUsers(result.users)
      else toast.error(result.message || 'Failed to load users')
    } catch (error) {
      console.error(error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers(roleFilter)
  }, [roleFilter])

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Delete user',
      message: `Permanently delete ${name}'s account? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      const result = await res.json()

      if (!result.success) {
        toast.error(result.message || 'Delete failed')
        return
      }

      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (error) {
      console.error(error)
      toast.error('Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-text-dark">Users</h1>
        <div className="flex gap-2">
          {(['all', 'patient', 'doctor', 'hospital'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                roleFilter === r ? 'bg-primary text-white' : 'bg-white border border-border text-text-dark'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="text-left text-text-grey border-b border-border">
                  <th className="px-4 py-3 sticky left-0 bg-white z-10">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-text-dark sticky left-0 bg-white">{user.name}</td>
                    <td className="px-4 py-3 text-text-grey">{user.email}</td>
                    <td className="px-4 py-3 text-text-grey">{user.phone}</td>
                    <td className="px-4 py-3 capitalize">{user.role}</td>
                    <td className="px-4 py-3 text-text-grey">{user.district}, {user.upazila}</td>
                    <td className="px-4 py-3 text-text-grey">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={deletingId === user.id}
                        className="text-error text-sm disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <p className="text-text-grey p-6 text-center">No users found.</p>
          )}
        </div>
      )}
    </div>
  )
}
