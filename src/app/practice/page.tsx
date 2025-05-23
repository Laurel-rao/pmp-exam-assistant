'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Brain, 
  Home, 
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  RefreshCw,
  Target,
  Clock,
  Trophy,
  BarChart3,
  BookOpen,
  History
} from 'lucide-react'
import { authenticatedFetch } from '@/lib/auth'

interface Question {
  id: string
  type: string
  content: string
  options: string[]
  answer: string
  explanation: string
  category: string
  difficulty: number
}

interface AnswerRecord {
  questionId: string
  userAnswer: string
  isCorrect: boolean
  timeSpent: number
}

export default function PracticePage() {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(false)
  const [answerRecord, setAnswerRecord] = useState<AnswerRecord[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [practiceStats, setPracticeStats] = useState({
    total: 0,
    correct: 0,
    totalTime: 0
  })

  useEffect(() => {
    loadRandomQuestion()
  }, [])

  const loadRandomQuestion = async () => {
    setLoading(true)
    setShowResult(false)
    setSelectedAnswer('')
    setStartTime(new Date())

    try {
      const response = await authenticatedFetch('/api/practice/random')
      const data = await response.json()
      
      if (data.success) {
        setCurrentQuestion(data.data.question)
      } else {
        console.error('获取题目失败:', data.message)
      }
    } catch (error) {
      console.error('获取题目失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!currentQuestion || !selectedAnswer || !startTime) return

    const endTime = new Date()
    const timeSpent = Math.round((endTime.getTime() - startTime.getTime()) / 1000)
    const isCorrect = selectedAnswer === currentQuestion.answer

    const record: AnswerRecord = {
      questionId: currentQuestion.id,
      userAnswer: selectedAnswer,
      isCorrect,
      timeSpent
    }

    try {
      // 提交答题记录到服务器
      const response = await authenticatedFetch('/api/practice/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          userAnswer: selectedAnswer,
          isCorrect,
          timeSpent
        })
      })

      if (response.ok) {
        setAnswerRecord(prev => [...prev, record])
        setQuestionCount(prev => prev + 1)
        setPracticeStats(prev => ({
          total: prev.total + 1,
          correct: prev.correct + (isCorrect ? 1 : 0),
          totalTime: prev.totalTime + timeSpent
        }))
      }
    } catch (error) {
      console.error('提交答题记录失败:', error)
    }

    setShowResult(true)
  }

  const getOptionLabel = (index: number) => {
    return String.fromCharCode(65 + index) // A, B, C, D
  }

  const getDifficultyLabel = (difficulty: number) => {
    const labels = ['', '简单', '较易', '中等', '较难', '困难']
    return labels[difficulty] || '未知'
  }

  const getDifficultyColor = (difficulty: number) => {
    const colors = ['', 'text-green-600', 'text-blue-600', 'text-yellow-600', 'text-orange-600', 'text-red-600']
    return colors[difficulty] || 'text-gray-600'
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getAccuracyRate = () => {
    if (practiceStats.total === 0) return 0
    return Math.round((practiceStats.correct / practiceStats.total) * 100)
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
                <Brain className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-900">练习模式</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 主内容区域 */}
          <div className="lg:col-span-3">
            {/* 页面标题 */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">练习模式</h1>
              <p className="text-gray-600">随机练习PMP考试题目，提升答题能力</p>
            </div>

            {/* 题目卡片 */}
            <div className="bg-white rounded-lg shadow p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">加载题目中...</p>
                </div>
              ) : currentQuestion ? (
                <div>
                  {/* 题目信息 */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                        第 {questionCount + 1} 题
                      </span>
                      <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                        {currentQuestion.type === 'single' ? '单选题' : '多选题'}
                      </span>
                      <span className={`text-sm font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
                        {getDifficultyLabel(currentQuestion.difficulty)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {currentQuestion.category}
                      </span>
                    </div>
                    {startTime && (
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          {formatTime(Math.round((new Date().getTime() - startTime.getTime()) / 1000))}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 题目内容 */}
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900 leading-relaxed mb-4">
                      {currentQuestion.content}
                    </h2>

                    {/* 选项 */}
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => {
                        const optionLabel = getOptionLabel(index)
                        const isSelected = selectedAnswer === optionLabel
                        const isCorrect = currentQuestion.answer === optionLabel
                        
                        let optionStyle = 'border-gray-200 hover:border-green-300'
                        if (showResult) {
                          if (isCorrect) {
                            optionStyle = 'border-green-500 bg-green-50'
                          } else if (isSelected && !isCorrect) {
                            optionStyle = 'border-red-500 bg-red-50'
                          }
                        } else if (isSelected) {
                          optionStyle = 'border-green-500 bg-green-50'
                        }

                        return (
                          <div
                            key={index}
                            onClick={() => !showResult && setSelectedAnswer(optionLabel)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition duration-200 ${optionStyle} ${
                              showResult ? 'cursor-default' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                showResult && isCorrect
                                  ? 'bg-green-500 text-white'
                                  : showResult && isSelected && !isCorrect
                                  ? 'bg-red-500 text-white'
                                  : isSelected
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {optionLabel}
                              </div>
                              <span className="text-gray-800">{option}</span>
                              {showResult && isCorrect && (
                                <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                              )}
                              {showResult && isSelected && !isCorrect && (
                                <XCircle className="w-5 h-5 text-red-500 ml-auto" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 解析 */}
                  {showResult && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h3 className="font-medium text-blue-900 mb-2">题目解析</h3>
                      <p className="text-blue-800 leading-relaxed">{currentQuestion.explanation}</p>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex justify-between">
                    <div className="flex space-x-3">
                      {!showResult ? (
                        <button
                          onClick={submitAnswer}
                          disabled={!selectedAnswer}
                          className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                        >
                          <Target className="w-4 h-4 mr-2" />
                          确认答案
                        </button>
                      ) : (
                        <button
                          onClick={loadRandomQuestion}
                          className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          下一题
                        </button>
                      )}
                    </div>
                    
                    <button
                      onClick={loadRandomQuestion}
                      className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      换一题
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无题目</h3>
                  <p className="text-gray-500 mb-4">请稍后再试或联系管理员</p>
                  <button
                    onClick={loadRandomQuestion}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                  >
                    重新加载
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 侧边栏统计 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                练习统计
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">已练习</span>
                  <span className="font-medium">{practiceStats.total} 题</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">正确率</span>
                  <span className={`font-medium ${
                    getAccuracyRate() >= 80 ? 'text-green-600' :
                    getAccuracyRate() >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {getAccuracyRate()}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">总用时</span>
                  <span className="font-medium">{formatTime(practiceStats.totalTime)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">平均用时</span>
                  <span className="font-medium">
                    {practiceStats.total > 0 ? formatTime(Math.round(practiceStats.totalTime / practiceStats.total)) : '--'}
                  </span>
                </div>
              </div>

              {/* 正确率进度条 */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>正确率</span>
                  <span>{getAccuracyRate()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      getAccuracyRate() >= 80 ? 'bg-green-500' :
                      getAccuracyRate() >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${getAccuracyRate()}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">快速操作</h3>
              <div className="space-y-3">
                <Link
                  href="/exam"
                  className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  模拟考试
                </Link>
                <Link
                  href="/questions"
                  className="block w-full px-4 py-2 bg-gray-100 text-gray-700 text-center rounded-lg hover:bg-gray-200 transition duration-200"
                >
                  题库浏览
                </Link>
                <Link
                  href="/mistakes"
                  className="block w-full px-4 py-2 bg-red-100 text-red-700 text-center rounded-lg hover:bg-red-200 transition duration-200"
                >
                  错题本
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 