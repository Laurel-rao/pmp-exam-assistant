'use client'

import { useState, useEffect, useRef } from 'react'
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
  History,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Save,
  List,
  PieChart,
  Award,
  ExternalLink
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

interface UserAnswer {
  questionId: string
  answer: string
  isMarked: boolean
}

interface ExamResult {
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  unansweredQuestions: number
  score: number
  duration: number
  categoryScores: Record<string, { total: number, correct: number }>
}

const TOTAL_EXAM_QUESTIONS = 50;
const EXAM_TIME_MINUTES = 60;

export default function ExamPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [examState, setExamState] = useState<'not-started' | 'in-progress' | 'reviewing' | 'completed'>('not-started')
  const [loading, setLoading] = useState(false)
  const [remainingTime, setRemainingTime] = useState(EXAM_TIME_MINUTES * 60)
  const [examResult, setExamResult] = useState<ExamResult | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<Date | null>(null)

  const currentQuestion = questions[currentIndex] || null

  useEffect(() => {
    // 清理计时器
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startExam = async () => {
    setLoading(true)
    try {
      // 从服务器获取考试题目
      const response = await authenticatedFetch('/api/exam/questions')
      const data = await response.json()
      
      if (data.success && data.data.questions.length > 0) {
        setQuestions(data.data.questions)
        // 初始化用户答案数组
        setUserAnswers(data.data.questions.map(q => ({ 
          questionId: q.id, 
          answer: '', 
          isMarked: false 
        })))
        setCurrentIndex(0)
        setExamState('in-progress')
        startTimeRef.current = new Date()
        
        // 开始计时
        timerRef.current = setInterval(() => {
          setRemainingTime(prev => {
            if (prev <= 1) {
              submitExam()
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        console.error('获取考试题目失败:', data.message)
      }
    } catch (error) {
      console.error('获取考试题目失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitExam = async () => {
    // 停止计时器
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // 计算考试用时
    const duration = startTimeRef.current 
      ? Math.round((new Date().getTime() - startTimeRef.current.getTime()) / 1000) 
      : remainingTime;

    // 计算结果
    const result = calculateExamResult(userAnswers, questions, duration);
    setExamResult(result);

    // 提交考试结果到服务器
    try {
      await authenticatedFetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers: userAnswers, 
          duration: duration,
          score: result.score
        })
      });
      setExamState('completed')
    } catch (error) {
      console.error('提交考试结果失败:', error)
      // 即使提交失败，也显示结果页面
      setExamState('completed')
    }
  }

  const calculateExamResult = (answers: UserAnswer[], questionList: Question[], duration: number): ExamResult => {
    let correctAnswers = 0;
    let unansweredQuestions = 0;
    const categoryScores: Record<string, { total: number, correct: number }> = {};
    
    // 初始化各知识领域的统计
    questionList.forEach(q => {
      if (!categoryScores[q.category]) {
        categoryScores[q.category] = { total: 0, correct: 0 };
      }
      categoryScores[q.category].total += 1;
    });
    
    // 计算正确答案和未答题数
    answers.forEach((answer, index) => {
      const question = questionList[index];
      if (!question) return;
      
      if (!answer.answer) {
        unansweredQuestions++;
      } else if (answer.answer === question.answer) {
        correctAnswers++;
        if (categoryScores[question.category]) {
          categoryScores[question.category].correct += 1;
        }
      }
    });
    
    // 计算得分（百分制）
    const score = Math.round((correctAnswers / questionList.length) * 100);
    
    return {
      totalQuestions: questionList.length,
      correctAnswers,
      incorrectAnswers: questionList.length - correctAnswers - unansweredQuestions,
      unansweredQuestions,
      score,
      duration,
      categoryScores
    };
  };

  const handleAnswerSelect = (answer: string) => {
    if (examState !== 'in-progress') return
    
    const updatedAnswers = [...userAnswers]
    updatedAnswers[currentIndex] = {
      ...updatedAnswers[currentIndex],
      answer
    }
    setUserAnswers(updatedAnswers)
  }

  const toggleMarkQuestion = () => {
    const updatedAnswers = [...userAnswers]
    updatedAnswers[currentIndex] = {
      ...updatedAnswers[currentIndex],
      isMarked: !updatedAnswers[currentIndex].isMarked
    }
    setUserAnswers(updatedAnswers)
  }

  const goToNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const goToPrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getOptionLabel = (index: number) => {
    return String.fromCharCode(65 + index) // A, B, C, D
  }

  const getQuestionStatusClass = (index: number) => {
    const answer = userAnswers[index]
    if (!answer) return 'bg-gray-200'
    
    if (examState === 'completed' || examState === 'reviewing') {
      const question = questions[index]
      if (!question) return 'bg-gray-200'
      
      if (answer.answer === '') {
        return 'bg-gray-200'
      } else if (answer.answer === question.answer) {
        return 'bg-green-500 text-white'
      } else {
        return 'bg-red-500 text-white'
      }
    }
    
    if (answer.isMarked) {
      return answer.answer ? 'bg-yellow-500 text-white' : 'bg-yellow-200'
    }
    
    return answer.answer ? 'bg-blue-500 text-white' : 'bg-gray-200'
  }

  // 用于解析选项JSON字符串的辅助函数
  const parseOptions = (options: any): string[] => {
    if (Array.isArray(options)) return options
    try {
      return JSON.parse(options)
    } catch (e) {
      console.error('解析选项失败:', e)
      return []
    }
  }

  const renderExamContent = () => {
    if (examState === 'not-started') {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">PMP模拟考试</h2>
          <div className="mb-8">
            <div className="flex justify-center items-center space-x-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{TOTAL_EXAM_QUESTIONS}</div>
                <div className="text-gray-600">考试题量</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{EXAM_TIME_MINUTES}</div>
                <div className="text-gray-600">分钟</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">60%</div>
                <div className="text-gray-600">及格分数线</div>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              本次模拟考试共 {TOTAL_EXAM_QUESTIONS} 道题，时间 {EXAM_TIME_MINUTES} 分钟，
              考试期间请勿刷新页面或离开，否则可能导致答案丢失。
            </p>
            <p className="text-gray-600">
              准备好后，点击下方按钮开始考试。
            </p>
          </div>
          <button
            onClick={startExam}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 text-lg font-medium"
          >
            {loading ? '准备中...' : '开始考试'}
          </button>
        </div>
      )
    }

    if (examState === 'completed') {
      return renderExamResult()
    }

    return (
      <div className="bg-white rounded-lg shadow">
        {/* 考试头部信息 */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center space-x-3">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              第 {currentIndex + 1}/{questions.length} 题
            </span>
            <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
              {currentQuestion?.type === 'single' ? '单选题' : '多选题'}
            </span>
            <span className="text-sm text-gray-500">
              {currentQuestion?.category}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 ${remainingTime < 300 ? 'text-red-600' : 'text-gray-600'}`}>
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{formatTime(remainingTime)}</span>
            </div>
            <button
              onClick={submitExam}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition duration-200"
            >
              交卷
            </button>
          </div>
        </div>

        {/* 考试内容 */}
        <div className="grid grid-cols-4 gap-0">
          {/* 左侧题目和选项 */}
          <div className="col-span-3 p-6 border-r">
            {currentQuestion && (
              <>
                {/* 题目内容 */}
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900 leading-relaxed mb-4">
                    {currentQuestion.content}
                  </h2>

                  {/* 选项 */}
                  <div className="space-y-3">
                    {parseOptions(currentQuestion.options).map((option, index) => {
                      const optionLabel = getOptionLabel(index)
                      const isSelected = userAnswers[currentIndex]?.answer === optionLabel
                      
                      return (
                        <div
                          key={index}
                          onClick={() => handleAnswerSelect(optionLabel)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition duration-200 ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {optionLabel}
                            </div>
                            <span className="text-gray-800">{option}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 导航按钮 */}
                <div className="flex justify-between">
                  <button
                    onClick={goToPrevQuestion}
                    disabled={currentIndex === 0}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    上一题
                  </button>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={toggleMarkQuestion}
                      className={`flex items-center px-4 py-2 rounded-lg transition duration-200 ${
                        userAnswers[currentIndex]?.isMarked
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Flag className="w-4 h-4 mr-1" />
                      {userAnswers[currentIndex]?.isMarked ? '取消标记' : '标记题目'}
                    </button>
                  </div>
                  
                  <button
                    onClick={goToNextQuestion}
                    disabled={currentIndex === questions.length - 1}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一题
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 右侧答题卡 */}
          <div className="col-span-1 p-4 bg-gray-50">
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">答题卡</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition duration-200 ${
                      index === currentIndex ? 'ring-2 ring-blue-500' : ''
                    } ${getQuestionStatusClass(index)}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <span className="text-sm text-gray-600">未答题</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">已答题</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm text-gray-600">已标记</span>
              </div>
              {(examState === 'reviewing' || examState === 'completed') && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-600">答对</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm text-gray-600">答错</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">已答题数</span>
                <span className="text-sm font-medium">
                  {userAnswers.filter(a => a.answer).length}/{questions.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${(userAnswers.filter(a => a.answer).length / questions.length) * 100}%` }}
                ></div>
              </div>
              
              <button
                onClick={submitExam}
                className="w-full mt-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
              >
                交卷
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderExamResult = () => {
    if (!examResult) return null
    
    const { totalQuestions, correctAnswers, incorrectAnswers, unansweredQuestions, score, duration, categoryScores } = examResult
    const isPassed = score >= 60
    
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-center mb-6">考试结果</h2>
          
          <div className="max-w-2xl mx-auto">
            {/* 总体得分 */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-36 h-36 rounded-full border-8 border-gray-200 mb-4">
                <div className={`text-4xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                  {score}分
                </div>
              </div>
              <div className="text-lg font-medium">
                {isPassed ? (
                  <div className="text-green-600 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    恭喜通过！
                  </div>
                ) : (
                  <div className="text-red-600 flex items-center justify-center">
                    <XCircle className="w-5 h-5 mr-2" />
                    未通过
                  </div>
                )}
              </div>
            </div>
            
            {/* 详细数据 */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-gray-700 font-medium mb-2">考试概况</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">总题数</span>
                    <span className="font-medium">{totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">答对题数</span>
                    <span className="font-medium text-green-600">{correctAnswers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">答错题数</span>
                    <span className="font-medium text-red-600">{incorrectAnswers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">未答题数</span>
                    <span className="font-medium text-yellow-600">{unansweredQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">用时</span>
                    <span className="font-medium">{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-gray-700 font-medium mb-2">知识领域得分</h3>
                <div className="space-y-2">
                  {Object.entries(categoryScores).map(([category, data]) => (
                    <div key={category} className="flex justify-between">
                      <span className="text-gray-600">{category}</span>
                      <span className="font-medium">
                        {data.correct}/{data.total} ({Math.round((data.correct / data.total) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex justify-center space-x-4">
              <Link href="/" className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200">
                返回首页
              </Link>
              <button
                onClick={() => setExamState('reviewing')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                查看详情
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
                <Award className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">模拟考试</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PMP模拟考试</h1>
          <p className="text-gray-600">完整模拟PMP考试环境和题目，检验实力</p>
        </div>
        
        {/* 考试内容 */}
        {renderExamContent()}
      </div>
    </div>
  )
} 