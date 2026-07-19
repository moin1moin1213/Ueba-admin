import { cookies } from 'next/headers'
import { ADMIN_COOKIE_NAME } from '@/lib/admin-constants'

export { ADMIN_COOKIE_NAME }

export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) return false

  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value

  return !!token && token === secret
}
