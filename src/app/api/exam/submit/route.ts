import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // 验证用户是否登录
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { answers, duration, score } = data

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, message: '答案数据格式错误' },
        { status: 400 }
      )
    }

    // 不需要再查询用户，直接使用user对象
    if (!user.id) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    // 创建考试记录
    const exam = await prisma.exam.create({
      data: {
        userId: user.id,
        score: score || 0,
        duration: duration || 0,
        totalQuestions: answers.length,
        correctQuestions: answers.filter(a => a.isCorrect).length,
        status: 'completed'
      }
    })

    // 保存每道题的答题记录
    const answerRecords = answers.map(answer => ({
      examId: exam.id,
      questionId: answer.questionId,
      userAnswer: answer.answer || '',
      isCorrect: answer.isCorrect || false
    }))

    // 批量插入答题记录
    await prisma.examAnswer.createMany({
      data: answerRecords
    })

    return NextResponse.json({
      success: true,
      data: { examId: exam.id }
    })
  } catch (error) {
    console.error('保存考试结果失败:', error)
    return NextResponse.json(
      { success: false, message: '保存考试结果失败' },
      { status: 500 }
    )
  }
} 