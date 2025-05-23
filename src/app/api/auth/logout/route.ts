import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: '登出成功'
    })

    // 清除Cookie
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    })

    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '服务器内部错误' 
      },
      { status: 500 }
    )
  }
} 