import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME } from '@/lib/admin-constants'

export function middleware(request: NextRequest) {

  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const isPublicRoute =
    pathname === '/login' ||
    pathname === '/api/login'

  if (isPublicRoute) {
    return NextResponse.next()
  }

  const secret = process.env.ADMIN_SESSION_SECRET
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value

  const isValid = !!secret && !!token && token === secret

  if (!isValid) {

    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)

  }

  return NextResponse.next()

}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
