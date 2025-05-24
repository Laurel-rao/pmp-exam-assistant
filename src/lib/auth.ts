import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface UserPayload {
  id: string
  phone: string
  name?: string
  roles: string[]
}

// 生成JWT令牌
export function generateToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

// 验证JWT令牌
export function verifyToken(token: string): UserPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload
    return decoded
  } catch (error) {
    console.log('verifyToken error', error)
    return null
  }
}

// Edge Runtime 兼容的 token 校验
export async function verifyTokenEdge(token: string, secret: string): Promise<UserPayload | null> {
  try {
    if (!token) {
      console.warn('verifyTokenEdge: token is empty')
      return null
    }
    
    if (!secret) {
      console.error('verifyTokenEdge: secret is empty')
      return null
    }
    
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    )
    
    // 验证payload是否包含必要的字段
    if (!payload.id || !payload.phone || !Array.isArray(payload.roles)) {
      console.error('verifyTokenEdge: invalid payload structure', payload)
      return null
    }
    
    // jose 返回的 payload 不是严格的 UserPayload 类型，需要断言
    return payload as UserPayload
  } catch (e) {
    console.error('verifyTokenEdge error:', e)
    return null
  }
}

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12)
}

// 验证密码
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcryptjs.compare(password, hashedPassword)
}

// 从请求中获取用户信息
export async function getCurrentUser(request: NextRequest): Promise<UserPayload | null> {
  try {
    console.log('getCurrentUser: 开始处理请求')
    
    // 尝试从不同来源获取token
    const cookieToken = request.cookies.get('token')?.value
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '')
    
    console.log('getCurrentUser: Cookie Token:', cookieToken ? '存在' : '不存在')
    console.log('getCurrentUser: Header Token:', headerToken ? '存在' : '不存在')
    
    const token = cookieToken || headerToken
    
    if (!token) {
      console.log('getCurrentUser: 未找到有效token')
      return null
    }

    // 使用与middleware相同的验证方法
    console.log('getCurrentUser: 开始验证token')
    const payload = await verifyTokenEdge(token, JWT_SECRET)
    
    if (!payload) {
      console.log('getCurrentUser: token验证失败')
      return null
    }
    
    console.log('getCurrentUser: token验证成功, payload:', JSON.stringify(payload))

    // 验证用户是否存在且状态正常
    console.log('getCurrentUser: 开始查询用户数据, ID:', payload.id)
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!user) {
      console.log('getCurrentUser: 未找到用户')
      return null
    }
    
    if (user.status !== 1) {
      console.log('getCurrentUser: 用户状态异常, status:', user.status)
      return null
    }
    
    const roles = user.userRoles.map(ur => ur.role.code)
    console.log('getCurrentUser: 用户角色:', roles)

    return {
      id: user.id,
      phone: user.phone,
      name: user.name || undefined,
      roles: roles
    }
  } catch (error) {
    console.error('getCurrentUser error:', error)
    return null
  }
}

// 获取用户菜单权限
export async function getUserMenus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              roleMenus: {
                include: {
                  menu: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!user) return []

  const menus = new Map()
  
  user.userRoles.forEach(userRole => {
    userRole.role.roleMenus.forEach(roleMenu => {
      const menu = roleMenu.menu
      if (menu.status === 1) {
        menus.set(menu.id, menu)
      }
    })
  })

  return Array.from(menus.values()).sort((a, b) => a.sort - b.sort)
}

// 检查用户权限
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const menus = await getUserMenus(userId)
  return menus.some(menu => menu.permission === permission)
}

// 检查用户是否有管理员权限（不区分大小写）
export function checkAdminPermission(user: UserPayload | null): boolean {
  if (!user) return false
  return user.roles.some(role => role.toLowerCase() === 'admin')
}

// 客户端工具函数
export function getClientToken(): string | null {
  if (typeof window === 'undefined') return null
  // 优先从 cookie 中获取 token
  const cookies = document.cookie.split(';')
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='))
  if (tokenCookie) {
    return tokenCookie.split('=')[1]
  }
  // 如果 cookie 中没有，则从 localStorage 获取
  return localStorage.getItem('token')
}

export function setClientToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('token', token)
}

export function removeClientToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
}

// 创建带认证的fetch函数
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getClientToken()
  
  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  })
} 