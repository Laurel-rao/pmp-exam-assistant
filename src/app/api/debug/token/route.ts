import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, verifyTokenEdge } from '@/lib/auth'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    console.log('API: /api/debug/token 被访问')
    
    // 获取token
    const cookieToken = request.cookies.get('token')?.value
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '')
    
    console.log('Cookie Token:', cookieToken ? '存在' : '不存在')
    console.log('Header Token:', headerToken ? '存在' : '不存在')
    
    const token = cookieToken || headerToken
    
    if (!token) {
      return NextResponse.json({
        success: false,
        message: '未找到token'
      })
    }
    
    // 解码JWT payload（不验证签名）
    let decodedPayload = null
    try {
      decodedPayload = jwt.decode(token)
      console.log('原始解码结果:', decodedPayload)
    } catch (e) {
      console.error('Token解码失败:', e)
    }
    
    // 使用verifyToken验证
    const verifiedToken = verifyToken(token)
    console.log('verifyToken结果:', verifiedToken)
    
    // 使用verifyTokenEdge验证
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
    const verifiedTokenEdge = await verifyTokenEdge(token, JWT_SECRET)
    console.log('verifyTokenEdge结果:', verifiedTokenEdge)
    
    return NextResponse.json({
      success: true,
      data: {
        token: token.substring(0, 10) + '...',
        decodedPayload,
        verifyToken: verifiedToken ? '验证成功' : '验证失败',
        verifyTokenEdge: verifiedTokenEdge ? '验证成功' : '验证失败',
        verifiedPayload: verifiedToken || verifiedTokenEdge
      }
    })
  } catch (error) {
    console.error('Token调试API错误:', error)
    return NextResponse.json({
      success: false,
      message: '服务器内部错误'
    }, { status: 500 })
  }
} 