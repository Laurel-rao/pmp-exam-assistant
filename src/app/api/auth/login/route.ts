import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sign } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const { phone, password } = await request.json();

    // 验证手机号格式
    if (!/^1\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: "手机号格式不正确" },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    // 验证密码
    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "手机号或密码错误" },
        { status: 401 }
      );
    }

    // 生成JWT token
    const token = sign(
      { userId: user.id, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 设置cookie
    cookies().set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7天
    });

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "登录失败" },
      { status: 500 }
    );
  }
} 