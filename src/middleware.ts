import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 不需要认证的路径
const publicPaths = ['/login', '/register', '/api/auth/login', '/api/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 如果是公开路径，直接放行
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 获取token
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    // 没有token，重定向到登录页
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 验证token
    verify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    // token无效，重定向到登录页
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// 配置需要进行中间件处理的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 