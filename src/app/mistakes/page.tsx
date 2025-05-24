'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookMarked, Search, Home, ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import { authenticatedFetch } from '@/lib/auth'

interface MistakeRecord {
  id: string
  questionId: string
  userId: string
  question: {
    id: string
    type: string
    content: string
    options: string[]
    answer: string
    explanation: string
    category: string
    difficulty: number
  }
  userAnswer: string
  createdAt: string
}

export default function MistakesPage() {
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const router = useRouter()

  const pageSize = 5

  // 获取错题记录
  const fetchMistakes = async (page = 1, searchTerm = '', categoryFilter = '') => {
    setLoading(true)
    try {
      let url = `/api/mistakes?page=${page}&limit=${pageSize}`
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`
      if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`

      const response = await authenticatedFetch(url)
      const data = await response.json()

      if (data.success) {
        setMistakes(data.data.mistakes)
        setTotalPages(Math.ceil(data.data.total / pageSize))
      } else {
        setError(data.message || '获取错题记录失败')
      }
    } catch (err) {
      setError('获取错题记录时发生错误')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    fetchMistakes(currentPage, search, category)
  }, [currentPage, search, category])

  // 翻页处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 搜索处理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // 重置为第一页
    fetchMistakes(1, search, category)
  }

  // 返回主页
  const handleBackHome = () => {
    router.push('/')
  }

  // 渲染分页
  const renderPagination = () => {
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`px-3 py-1 mx-1 rounded ${
            currentPage === i 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      )
    }
    return (
      <div className="flex justify-center mt-6">
        <button
          className="px-3 py-1 mx-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        {pages}
        <button
          className="px-3 py-1 mx-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <BookMarked className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold">我的错题本</h1>
            </div>
            <button
              onClick={handleBackHome}
              className="flex items-center text-gray-600 hover:text-blue-600"
            >
              <Home className="h-5 w-5 mr-1" />
              返回首页
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* 搜索和筛选 */}
        <div className="bg-white p-4 rounded shadow mb-6">
          <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索题目内容..."
                  className="w-full p-2 border rounded pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="w-48">
              <select
                className="w-full p-2 border rounded"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">所有类别</option>
                <option value="项目整合管理">项目整合管理</option>
                <option value="项目范围管理">项目范围管理</option>
                <option value="项目进度管理">项目进度管理</option>
                <option value="项目成本管理">项目成本管理</option>
                <option value="项目质量管理">项目质量管理</option>
                <option value="项目资源管理">项目资源管理</option>
                <option value="项目沟通管理">项目沟通管理</option>
                <option value="项目风险管理">项目风险管理</option>
                <option value="项目采购管理">项目采购管理</option>
                <option value="项目相关方管理">项目相关方管理</option>
              </select>
            </div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              搜索
            </button>
          </form>
        </div>

        {/* 错题列表 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        ) : mistakes.length === 0 ? (
          <div className="bg-white shadow rounded p-8 text-center">
            <BookMarked className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">暂无错题记录</h2>
            <p className="text-gray-500 mb-4">完成更多练习题后，你做错的题目将会显示在这里</p>
            <button
              onClick={() => router.push('/practice')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              去做题
            </button>
          </div>
        ) : (
          <>
            {mistakes.map((mistake) => (
              <div key={mistake.id} className="bg-white shadow rounded mb-6 overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                        {mistake.question.category}
                      </span>
                      <span className="text-yellow-500">
                        {'★'.repeat(mistake.question.difficulty)}
                      </span>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {new Date(mistake.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">{mistake.question.content}</h3>
                    
                    <div className="space-y-2 ml-2">
                      {mistake.question.options.map((option, index) => {
                        const isCorrect = mistake.question.answer.includes(String.fromCharCode(65 + index));
                        const isUserSelected = mistake.userAnswer.includes(String.fromCharCode(65 + index));
                        
                        return (
                          <div 
                            key={index} 
                            className={`flex items-start p-2 rounded ${
                              isCorrect ? 'bg-green-50' : 
                              (isUserSelected && !isCorrect) ? 'bg-red-50' : ''
                            }`}
                          >
                            <div className="mr-2 mt-0.5">
                              {isCorrect ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (isUserSelected ? (
                                <X className="h-4 w-4 text-red-500" />
                              ) : (
                                <span className="h-4 w-4 inline-block"></span>
                              ))}
                            </div>
                            <div>
                              <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                              <span>{option}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium text-gray-700 mb-2">解析</h4>
                    <p className="text-gray-600">{mistake.question.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  )
} 