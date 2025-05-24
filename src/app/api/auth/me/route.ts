import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserMenus } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('API: /api/auth/me 被访问')
    console.log('Request Headers:', Object.fromEntries(request.headers.entries()))
    
    const user = await getCurrentUser(request)
    
    if (!user) {
      console.log('API: /api/auth/me - 未获取到用户信息')
      return NextResponse.json(
        { 
          success: false, 
          message: '未登录或令牌已过期' 
        },
        { status: 401 }
      )
    }
    
    console.log('API: /api/auth/me - 获取到用户:', user.id, '角色:', user.roles)

    // 获取用户更详细的信息
    const userDetail = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })
    
    if (!userDetail) {
      console.log('API: /api/auth/me - 无法获取用户详细信息')
      return NextResponse.json(
        { 
          success: false, 
          message: '用户不存在' 
        },
        { status: 404 }
      )
    }
    
    console.log('API: /api/auth/me - 用户角色详情:', 
      userDetail.userRoles.map(ur => `${ur.role.name}(${ur.role.code})`).join(', '))

    // 获取用户菜单权限
    const menus = await getUserMenus(user.id)

    return NextResponse.json({
      success: true,
      data: {
        user,
        userDetail: {
          id: userDetail.id,
          name: userDetail.name,
          phone: userDetail.phone,
          email: userDetail.email,
          status: userDetail.status,
          lastLogin: userDetail.lastLogin,
          createdAt: userDetail.createdAt,
          roles: userDetail.userRoles.map(ur => ({
            id: ur.role.id,
            name: ur.role.name,
            code: ur.role.code,
            description: ur.role.description
          }))
        },
        menus
      }
    })

  } catch (error) {
    console.error('Get user info error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '服务器内部错误' 
      },
      { status: 500 }
    )
  }
} 