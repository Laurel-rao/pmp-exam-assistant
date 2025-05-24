import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import QuestionNavBar from '../QuestionNavBar'

export default async function QuestionDetail({ params }: { params: { id: string } }) {
  const { id } = await params
  const question = await prisma.question.findUnique({
    where: { id: id},
  })
  if (!question) return notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <QuestionNavBar />
      <div className="container mx-auto px-4 py-8">
        <a href="/questions" className="mb-6 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 inline-block">← 返回题库列表</a>
        <h1 className="text-2xl font-bold mb-4">题目详情</h1>
        <div className="max-w-2xl mx-auto py-8">
          <div className="mb-4">
            <span className="font-semibold">题目类型：</span>{question.type}
          </div>
          <div className="mb-4">
            <span className="font-semibold">内容：</span>{question.content}
          </div>
          <div className="mb-4">
            <span className="font-semibold">选项：</span>
            <ul className="list-disc pl-6">
              {Array.isArray(question.options)
                ? question.options.map((opt, idx) => (
                    <li key={idx}>{String.fromCharCode(65 + idx)}. {typeof opt === 'object' ? JSON.stringify(opt) : String(opt)}</li>
                  ))
                : typeof question.options === 'object' && question.options !== null
                  ? Object.entries(question.options).map(([key, value], idx) => (
                      <li key={idx}>{key}. {typeof value === 'object' ? JSON.stringify(value) : String(value)}</li>
                    ))
                  : <li>无选项数据</li>
              }
            </ul>
          </div>
          <div className="mb-4">
            <span className="font-semibold">答案：</span>{question.answer}
          </div>
          <div className="mb-4">
            <span className="font-semibold">解析：</span>{question.explanation}
          </div>
          <div className="mb-4">
            <span className="font-semibold">知识领域：</span>{question.category}
          </div>
          <div className="mb-4">
            <span className="font-semibold">难度：</span>{question.difficulty}
          </div>
          <div className="mb-4">
            <span className="font-semibold">状态：</span>{question.status === 1 ? '启用' : '禁用'}
          </div>
          <div className="text-gray-500 text-sm">ID: {question.id}</div>
        </div>
      </div>
    </div>
  )
} 