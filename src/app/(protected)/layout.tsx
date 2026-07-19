import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import AdminSidebar from '@/components/AdminSidebar'
import { ConfirmProvider } from '@/components/ConfirmModal'

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authenticated = await isAdminAuthenticated()

  if (!authenticated) {
    redirect('/login')
  }

  return (
    <ConfirmProvider>
      <div className="min-h-screen bg-background lg:flex">
        <AdminSidebar />
        <main className="flex-1 min-w-0 pt-16 lg:pt-0 p-4 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </ConfirmProvider>
  )
}
