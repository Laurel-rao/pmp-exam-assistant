'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Star, 
  Home, 
  ChevronLeft,
  ChevronRight,
  Heart,
  AlertCircle,
  Calendar,
  BookOpen
} from 'lucide-react'

interface Question {
  id: string
  type: string
  content: string
  options: string[]
  category: string
  difficulty: number
  isFavorited: boolean
  favoritedAt: string
}

export default function FavoritesPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const questionsPerPage = 5

  useEffect(() => {
    fetchFavorites()
  }, [currentPage])

  const fetchFavorites = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: questionsPerPage.toString()
      })

      const response = await fetch(`/api/favorites?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setQuestions(data.data.questions)
        setTotalPages(data.data.totalPages)
        setTotalCount(data.data.totalCount)
      }
    } catch (error) {
      console.error('获取收藏列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (questionId: string) => {
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId })
      })
      
      if (response.ok) {
        // 从收藏列表中移除
        setQuestions(prev => prev.filter(q => q.id !== questionId))
        setTotalCount(prev => prev - 1)
      }
    } catch (error) {
      console.error('取消收藏失败:', error)
    }
  }

  const getDifficultyLabel = (difficulty: number) => {
    const labels = ['', '简单', '较易', '中等', '较难', '困难']
    return labels[difficulty] || '未知'
  }

  const getDifficultyColor = (difficulty: number) => {
    const colors = ['', 'text-green-600', 'text-blue-600', 'text-yellow-600', 'text-orange-600', 'text-red-600']
    return colors[difficulty] || 'text-gray-600'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <Home className="w-5 h-5" />
                <span>首页</span>
              </Link>
              <span className="text-gray-300">/</span>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-gray-900">收藏夹</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">我的收藏</h1>
          <p className="text-gray-600">
            查看您收藏的题目 {totalCount > 0 && `(共 ${totalCount} 道题目)`}
          </p>
        </div>

        {/* 收藏统计 */}
        {totalCount > 0 && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{totalCount}</h2>
                <p className="text-yellow-100">道收藏题目</p>
              </div>
              <Star className="w-12 h-12 text-yellow-200" />
            </div>
          </div>
        )}

        {/* 题目列表 */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">加载中...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无收藏</h3>
              <p className="text-gray-500 mb-6">您还没有收藏任何题目</p>
              <Link
                href="/questions"
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                去题库浏览
              </Link>
            </div>
          ) : (
            questions.map((question, index) => (
              <div key={question.id} className="bg-white rounded-lg shadow hover:shadow-md transition duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* 题目标题 */}
                      <div className="flex items-center space-x-3 mb-4">
                        <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                          第 {(currentPage - 1) * questionsPerPage + index + 1} 题
                        </span>
                        <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                          {question.type === 'single' ? '单选题' : '多选题'}
                        </span>
                        <span className={`text-sm font-medium ${getDifficultyColor(question.difficulty)}`}>
                          {getDifficultyLabel(question.difficulty)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {question.category}
                        </span>
                      </div>

                      {/* 题目内容 */}
                      <div className="mb-4">
                        <p className="text-gray-900 leading-relaxed text-lg">{question.content}</p>
                      </div>

                      {/* 选项预览 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                        {question.options.slice(0, 4).map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <span className="truncate">{option}</span>
                          </div>
                        ))}
                      </div>

                      {/* 收藏时间 */}
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>收藏于 {formatDate(question.favoritedAt)}</span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex flex-col items-center space-y-3 ml-6">
                      <button
                        onClick={() => toggleFavorite(question.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition duration-200"
                        title="取消收藏"
                      >
                        <Heart className="w-5 h-5 fill-current" />
                      </button>
                      <Link
                        href={`/questions/${question.id}`}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition duration-200"
                      >
                        查看详情
                      </Link>
                      <Link
                        href={`/practice?questionId=${question.id}`}
                        className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition duration-200"
                      >
                        开始练习
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一页
            </button>
            
            <div className="flex items-center space-x-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1
                if (totalPages > 5) {
                  if (currentPage > 3) {
                    pageNum = currentPage - 2 + i
                  }
                  if (currentPage > totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  }
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium ${
                      currentPage === pageNum
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 