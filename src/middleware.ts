import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge } from '@/lib/auth'

// 不需要认证的路径
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/debug/db', // 调试API
  '/api/debug/token', // Token调试API
]

// 静态资源路径
const staticPaths = [
  '/_next',
  '/favicon.ico',
  '/images',
  '/icons',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('Middleware: 请求路径', pathname)

  // 静态资源直接放行
  if (staticPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 公开路径直接放行
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  console.log('Middleware: 需要认证的路径')
  
  // 检查是否有认证令牌
  const cookieToken = request.cookies.get('token')?.value
  const headerToken = request.headers.get('authorization')?.replace('Bearer ', '')
  
  console.log('Middleware: Cookie Token:', cookieToken ? '存在' : '不存在')
  console.log('Middleware: Header Token:', headerToken ? '存在' : '不存在')
  
  const token = cookieToken || headerToken

  if (!token) {
    console.log('Middleware: 未找到有效token')
    
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

  // 验证令牌（Edge 兼容）
  console.log('Middleware: 开始验证token')
  const payload = await verifyTokenEdge(token, process.env.JWT_SECRET || 'your-secret-key')
  
  if (!payload) {
    console.error('Middleware: JWT验证失败，token:', token ? token.substring(0, 10) + '...' : 'undefined')
    
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

  console.log('Middleware: JWT验证成功，用户ID:', payload.id, '角色:', payload.roles)

  // 在请求头中添加用户信息，供API使用
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.id)
  requestHeaders.set('x-user-phone', payload.phone)
  requestHeaders.set('x-user-roles', JSON.stringify(payload.roles))
  
  console.log('Middleware: 已添加用户信息到请求头')

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