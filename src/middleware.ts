import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

// 不需要认证的路径
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/me',
  '/api/auth/logout',
]

// 静态资源路径
const staticPaths = [
  '/_next',
  '/favicon.ico',
  '/images',
  '/icons',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 静态资源直接放行
  if (staticPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 公开路径直接放行
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // 检查是否有认证令牌
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    // 如果是API请求，返回401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { 
          success: false, 
          message: '未登录或令牌已过期' 
        },
        { status: 401 }
      )
    }
    
    // 页面请求重定向到登录页
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 验证令牌
  const payload = verifyToken(token)
  
  if (!payload) {
    // 清除无效令牌
    const response = pathname.startsWith('/api/') 
      ? NextResponse.json(
          { 
            success: false, 
            message: '令牌无效或已过期' 
          },
          { status: 401 }
        )
      : NextResponse.redirect(new URL('/login', request.url))

    response.cookies.set('token', '', {
      httpOnly: true,
      secure: false, // 开发环境设为false
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
      domain: undefined
    })

    return response
  }

  // 在请求头中添加用户信息，供API使用
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.id)
  requestHeaders.set('x-user-phone', payload.phone)
  requestHeaders.set('x-user-roles', JSON.stringify(payload.roles))

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 