'use client'

import { useState, useEffect } from 'react'
import { authenticatedFetch } from '@/lib/auth'
import { FileQuestion, Plus, Edit, Trash, Search } from 'lucide-react'

interface Question {
  id: string
  type: string
  content: string
  options: string[]
  answer: string
  explanation: string
  category: string
  difficulty: number
  status: number
  createdAt: string
  updatedAt: string
}

export default function QuestionsManagementPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const pageSize = 10

  // 获取题目列表
  const fetchQuestions = async (page = 1, searchTerm = '', categoryFilter = '') => {
    setLoading(true)
    try {
      let url = `/api/admin/questions?page=${page}&limit=${pageSize}`
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`
      if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`

      const response = await authenticatedFetch(url)
      const data = await response.json()

      if (data.success) {
        setQuestions(data.data.questions)
        setTotalPages(Math.ceil(data.data.total / pageSize))
      } else {
        setError(data.message || '获取题目列表失败')
      }
    } catch (err) {
      setError('获取题目列表时发生错误')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    fetchQuestions(currentPage, search, category)
  }, [currentPage, search, category])

  // 翻页处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 搜索处理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // 重置为第一页
    fetchQuestions(1, search, category)
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
          上一页
        </button>
        {pages}
        <button
          className="px-3 py-1 mx-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          下一页
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <FileQuestion className="mr-2" />
          题库管理
        </h1>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center">
          <Plus className="mr-1 h-5 w-5" />
          新增题目
        </button>
      </div>

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

      {/* 题目列表 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
          {error}
        </div>
      ) : (
        <>
          <div className="bg-white shadow rounded overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    题目内容
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    难度
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  questions.map((question) => (
                    <tr key={question.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 line-clamp-2">{question.content}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          question.type === 'single' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {question.type === 'single' ? '单选题' : '多选题'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{question.category}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {'★'.repeat(question.difficulty)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          question.status === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {question.status === 1 ? '启用' : '禁用'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  )
} 