import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('API: /api/debug/db 被访问')
    
    // 获取所有用户及其角色
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        createdAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      }
    })
    
    // 获取所有角色
    const roles = await prisma.role.findMany()
    
    // 获取用户角色关联
    const userRoles = await prisma.userRole.findMany({
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            name: true
          }
        },
        role: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })
    
    console.log('数据库查询完成')
    console.log('用户数量:', users.length)
    console.log('角色数量:', roles.length)
    console.log('用户角色关联数量:', userRoles.length)

    return NextResponse.json({
      success: true,
      data: {
        users,
        roles,
        userRoles
      }
    })
  } catch (error) {
    console.error('数据库调试API错误:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '服务器内部错误' 
      },
      { status: 500 }
    )
  }
} 