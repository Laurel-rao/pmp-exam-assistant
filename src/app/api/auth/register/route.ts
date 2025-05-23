import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    // 检查手机号是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该手机号已注册" },
        { status: 400 }
      );
    }

    // 创建新用户
    const user = await prisma.user.create({
      data: {
        phone,
        password,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "注册失败" },
      { status: 500 }
    );
  }
} 