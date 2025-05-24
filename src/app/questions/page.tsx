'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  BookOpen, 
  Search, 
  Filter, 
  Star,
  ChevronLeft,
  ChevronRight,
  Home,
  Heart,
  AlertCircle
} from 'lucide-react'

interface Question {
  id: string
  type: string
  content: string
  options: any
  category: string
  difficulty: number
  isFavorited?: boolean
  answer?: string
  explanation?: string
}

const categories = [
  { value: 'all', label: '全部分类' },
  { value: 'initiation', label: '启动过程组' },
  { value: 'planning', label: '规划过程组' },
  { value: 'executing', label: '执行过程组' },
  { value: 'monitoring', label: '监控过程组' },
  { value: 'closing', label: '收尾过程组' },
]

const difficulties = [
  { value: 'all', label: '全部难度' },
  { value: '1', label: '简单' },
  { value: '2', label: '较易' },
  { value: '3', label: '中等' },
  { value: '4', label: '较难' },
  { value: '5', label: '困难' },
]

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [detailQuestion, setDetailQuestion] = useState<Question | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const questionsPerPage = 10

  useEffect(() => {
    fetchQuestions()
  }, [currentPage, selectedCategory, selectedDifficulty, searchTerm])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: questionsPerPage.toString(),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedDifficulty !== 'all' && { difficulty: selectedDifficulty }),
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/questions?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setQuestions(data.data.questions)
        setTotalPages(data.data.totalPages)
        setTotalCount(data.data.totalCount)
      }
    } catch (error) {
      console.error('获取题目失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchQuestions()
  }

  const toggleFavorite = async (questionId: string) => {
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId })
      })
      
      if (response.ok) {
        setQuestions(prev => 
          prev.map(q => 
            q.id === questionId 
              ? { ...q, isFavorited: !q.isFavorited }
              : q
          )
        )
      }
    } catch (error) {
      console.error('收藏操作失败:', error)
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
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">题库浏览</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-8">
        {detailQuestion ? (
          <div className="max-w-2xl mx-auto py-8">
            <button
              className="mb-6 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              onClick={() => setDetailQuestion(null)}
            >
              ← 返回题库列表
            </button>
            <h1 className="text-2xl font-bold mb-4">题目详情</h1>
            <div className="mb-4">
              <span className="font-semibold">题目类型：</span>{detailQuestion.type}
            </div>
            <div className="mb-4">
              <span className="font-semibold">内容：</span>{detailQuestion.content}
            </div>
            <div className="mb-4">
              <span className="font-semibold">选项：</span>
              <ul className="list-disc pl-6">
                {Array.isArray(detailQuestion.options)
                  ? detailQuestion.options.map((opt, idx) => (
                      <li key={idx}>{String.fromCharCode(65 + idx)}. {opt}</li>
                    ))
                  : null}
              </ul>
            </div>
            <div className="mb-4">
              <span className="font-semibold">答案：</span>{detailQuestion.answer}
            </div>
            <div className="mb-4">
              <span className="font-semibold">解析：</span>{detailQuestion.explanation}
            </div>
            <div className="mb-4">
              <span className="font-semibold">知识领域：</span>{detailQuestion.category}
            </div>
            <div className="mb-4">
              <span className="font-semibold">难度：</span>{detailQuestion.difficulty}
            </div>
            <div className="text-gray-500 text-sm">ID: {detailQuestion.id}</div>
          </div>
        ) : (
          <>
            {/* 页面标题 */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">题库浏览</h1>
              <p className="text-gray-600">浏览完整的PMP考试题库，支持搜索和筛选</p>
            </div>
            {/* 搜索和筛选区域 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <form onSubmit={handleSearch} className="space-y-4">
                {/* 搜索框 */}
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="搜索题目内容..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    筛选
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    搜索
                  </button>
                </div>

                {/* 筛选条件 */}
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">知识领域</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {categories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">难度等级</label>
                      <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {difficulties.map(difficulty => (
                          <option key={difficulty.value} value={difficulty.value}>
                            {difficulty.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* 题目列表 */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">加载中...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">未找到题目</h3>
                  <p className="text-gray-500">请尝试调整搜索条件或筛选条件</p>
                </div>
              ) : (
                questions.map((question, index) => (
                  <div key={question.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* 题目标题 */}
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                            第 {(currentPage - 1) * questionsPerPage + index + 1} 题
                          </span>
                          <span className="bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded">
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
                          <p className="text-gray-900 leading-relaxed">{question.content}</p>
                        </div>

                        {/* 选项 */}
                        <div className="space-y-2">
                          {question.options && Array.isArray(question.options) && question.options.map((option: any, optionIndex: number) => (
                            <div key={optionIndex} className="flex items-center space-x-3">
                              <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                {String.fromCharCode(65 + optionIndex)}
                              </span>
                              <span className="text-gray-700">{option}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex flex-col items-center space-y-2 ml-4">
                        <button
                          onClick={() => toggleFavorite(question.id)}
                          className={`p-2 rounded-lg transition duration-200 ${
                            question.isFavorited
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${question.isFavorited ? 'fill-current' : ''}`} />
                        </button>
                        <Link
                          href={`/questions/${question.id}`}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition duration-200"
                        >
                          详情
                        </Link>
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
                            ? 'bg-blue-600 text-white'
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
                <span className="ml-6 text-gray-500 text-sm">共 {totalCount} 题</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 