import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 获取随机题目
    const questionsCount = await prisma.question.count();
    const skip = Math.floor(Math.random() * questionsCount);
    
    const question = await prisma.question.findFirst({
      skip,
      take: 1,
    });

    if (!question) {
      return NextResponse.json(
        { error: "No questions found" },
        { status: 404 }
      );
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error("Error fetching random question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 