import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserMenus } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: '未登录或令牌已过期' 
        },
        { status: 401 }
      )
    }

    // 获取用户菜单权限
    const menus = await getUserMenus(user.id)

    return NextResponse.json({
      success: true,
      data: {
        user,
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