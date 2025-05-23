import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import { NextRequest } from 'next/server'
import { prisma } from './prisma'

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
    const token = request.cookies.get('token')?.value
    if (!token) return null

    const payload = verifyToken(token)
    if (!payload) return null

    // 验证用户是否存在且状态正常
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

    if (!user || user.status !== 1) return null

    return {
      id: user.id,
      phone: user.phone,
      name: user.name || undefined,
      roles: user.userRoles.map(ur => ur.role.code)
    }
  } catch (error) {
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

// 客户端工具函数
export function getClientToken(): string | null {
  if (typeof window === 'undefined') return null
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
    headers
  })
} 