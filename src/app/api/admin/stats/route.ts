import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, checkAdminPermission } from '@/lib/auth'

// 获取系统统计数据
export async function GET(request: NextRequest) {
  try {
    console.log('API: /api/admin/stats 被访问')
    
    // 验证管理员权限
    const user = await getCurrentUser(request)
    console.log('获取到的用户信息:', user ? JSON.stringify(user) : '未获取到用户')
    
    if (!user) {
      console.log('API权限验证: 未获取到用户信息')
      return NextResponse.json(
        { success: false, message: '未登录或令牌已过期' },
        { status: 401 }
      )
    }
    
    // 检查管理员权限
    if (!checkAdminPermission(user)) {
      console.log('API权限验证: 用户无管理员权限, 角色:', user.roles)
      return NextResponse.json(
        { success: false, message: '无权访问，需要管理员权限' },
        { status: 403 }
      )
    }

    console.log('API权限验证通过，用户ID:', user.id, '角色:', user.roles)

    // 获取统计数据
    // 使用安全的方式获取计数，避免P2021错误
    let userCount = 0;
    let roleCount = 0;
    let menuCount = 0;
    
    try {
      userCount = await prisma.user.count();
    } catch (e) {
      console.error('获取用户数量失败:', e);
    }
    
    try {
      roleCount = await prisma.role.count();
    } catch (e) {
      console.error('获取角色数量失败:', e);
    }
    
    try {
      menuCount = await prisma.menu.count();
    } catch (e) {
      console.error('获取菜单数量失败:', e);
    }

    return NextResponse.json({
      success: true,
      data: {
        userCount,
        roleCount,
        menuCount,
        questionCount: 0, // 安全值
        examCount: 0, // 安全值
        systemInfo: {
          version: '1.0.0',
          launchDate: '2023-10-01',
          lastUpdate: '2023-10-15',
          dbStatus: 'normal',
          serverStatus: 'normal',
          apiVersion: 'v1'
        }
      }
    })
  } catch (error) {
    console.error('获取系统统计数据失败:', error)
    return NextResponse.json(
      { success: false, message: '获取系统统计数据失败' },
      { status: 500 }
    )
  }
} 