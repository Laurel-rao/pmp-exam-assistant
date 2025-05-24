import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs' // 明确用 nodejs runtime，避免 edge 限制

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      console.log('[导入题库] 未上传文件');
      return NextResponse.json({ success: false, message: '未上传文件' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const text = Buffer.from(arrayBuffer).toString('utf-8');
    let parsed;
    try {
      parsed = JSON.parse(text);
      console.log('[导入题库] 解析后的JSON:', parsed);
    } catch (e) {
      console.log('[导入题库] JSON解析失败:', e);
      return NextResponse.json({ success: false, message: 'JSON 解析失败' }, { status: 400 });
    }
    // 兼容 {questions: [...]} 或直接数组
    const questions = Array.isArray(parsed) ? parsed : parsed.questions;
    console.log('[导入题库] questions 字段:', questions);
    if (!Array.isArray(questions)) {
      console.log('[导入题库] 题库格式错误，questions 不是数组');
      return NextResponse.json({ success: false, message: '题库格式错误，需为数组或包含 questions 字段' }, { status: 400 });
    }
    // 批量写入数据库，统计成功和失败
    let successCount = 0;
    let failCount = 0;
    let failList: any[] = [];
    for (const q of questions) {
      try {
        let difficulty = Number(q.difficulty);
        if (!difficulty || isNaN(difficulty)) difficulty = 1;
        let answer = q.answer;
        if (Array.isArray(answer)) answer = answer.join(',');
        // 选项对象转数组，保证为数组格式
        let options = q.options;
        if (options && !Array.isArray(options) && typeof options === 'object') {
          options = ['A','B','C','D','E','F','G','H']
            .map(k => options[k])
            .filter(Boolean);
        }
        const data = {
          ...q,
          id: randomUUID(), // 强制生成 uuid
          category: q.category || 'executing',
          difficulty,
          answer, // 保证 answer 为字符串
          options, // 保证 options 为数组
        };
        delete data.id && data.id; // 移除原始 id 字段（防止被覆盖）
        await prisma.question.create({ data });
        successCount++;
      } catch (e) {
        failCount++;
        if (failList.length < 5) {
          failList.push({ question: q, error: (e as any).message });
          console.log('[导入题库] 导入失败:', q, (e as any).message);
        }
        if (failCount === 5) {
          console.log('[导入题库] 失败条数过多，仅显示前5条');
        }
      }
    }
    console.log(`[导入题库] 导入完成，成功${successCount}条，失败${failCount}条`);
    return NextResponse.json({ success: true, successCount, failCount, failList });
  } catch (e) {
    console.log('[导入题库] 导入异常:', e);
    return NextResponse.json({ success: false, message: '导入异常: ' + (e as any).message });
  }
} 