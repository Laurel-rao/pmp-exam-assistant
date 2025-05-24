import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // 清除Cookie中的token
    cookies().delete('token')
    
    return NextResponse.json({
      success: true,
      message: '登出成功'
    })
  } catch (error) {
    console.error('登出失败:', error)
    return NextResponse.json(
      { success: false, message: '登出失败' },
      { status: 500 }
    )
  }
}

// 处理GET请求，用于链接跳转
export async function GET(request: NextRequest) {
  try {
    // 清除Cookie中的token
    cookies().delete('token')
    
    // 跳转到登录页
    return NextResponse.redirect(new URL('/login', request.url))
  } catch (error) {
    console.error('登出跳转失败:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
} 