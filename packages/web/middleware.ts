import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/* Admin 路由守卫（占位） */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 拦截 /admin 路由（排除 /admin/login）
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_token')?.value

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // TODO: 验证 token 有效性
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}