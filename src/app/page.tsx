'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation'
import { 
  BookOpen, 
  Brain,
  FileText,
  History,
  Star,
  User,
  Trophy,
  LogIn,
  LogOut
} from "lucide-react";

interface UserInfo {
  id: string
  name?: string
  phone: string
  roles: string[]
}

// 功能导航项配置
const features = [
  {
    title: '题库浏览',
    icon: BookOpen,
    href: '/questions',
    description: '浏览完整题库',
    color: 'text-blue-600'
  },
  {
    title: '练习模式',
    icon: FileText,
    href: '/practice',
    description: '针对性练习',
    color: 'text-green-600'
  },
  {
    title: '考试模式',
    icon: Brain,
    href: '/exam',
    description: '模拟真实考试',
    color: 'text-purple-600'
  },
  {
    title: '错题本',
    icon: History,
    href: '/mistakes',
    description: '查看错题记录',
    color: 'text-red-600'
  },
  {
    title: '收藏夹',
    icon: Star,
    href: '/favorites',
    description: '收藏的题目',
    color: 'text-yellow-600'
  },
  {
    title: '个人中心',
    icon: User,
    href: '/profile',
    description: '个人信息管理',
    color: 'text-gray-600'
  }
];

export default function Home() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [showAdmin, setShowAdmin] = useState(false);
  const adminMenu = [
    { key: 'user', label: '用户管理' },
    { key: 'role', label: '权限管理' },
    { key: 'question', label: '题库管理' },
    { key: 'system', label: '系统管理' },
  ];
  const [adminTab, setAdminTab] = useState('question');
  const adminPanelRef = useRef<HTMLDivElement>(null);

  // 检查用户登录状态
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (showAdmin && adminPanelRef.current && !adminPanelRef.current.contains(e.target as Node)) {
        setShowAdmin(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showAdmin]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      
      if (data.success) {
        setUser(data.data.user)
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.refresh()
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  // 系统管理跳转
  const handleAdminClick = () => {
    setShowAdmin(false);
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
              <span className="text-xl font-bold text-gray-900">PMP考试助手</span>
            </div>
            
            {user ? (
              <div className="flex items-center space-x-4 relative">
                <span className="text-gray-700">
                  欢迎，{user.name || user.phone}
                  {/* 仅管理员显示系统管理入口 */}
                  {user.roles?.includes('ADMIN') && (
                    <span
                      className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded cursor-pointer hover:bg-blue-200"
                      onClick={handleAdminClick}
                    >
                      系统管理
                    </span>
                  )}
                </span>
                <button 
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  登出
                </button>
                {/* 管理后台悬浮面板 */}
                {showAdmin && (
                  <div ref={adminPanelRef} className="fixed top-20 left-0 w-full h-[80vh] flex z-50 shadow-2xl">
                    <div className="w-60 bg-white border-r h-full flex flex-col">
                      {adminMenu.map(item => (
                        <button
                          key={item.key}
                          className={`px-6 py-4 text-left hover:bg-blue-50 border-b ${adminTab===item.key?'bg-blue-100 font-bold':''}`}
                          onClick={() => setAdminTab(item.key)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 bg-gray-50 p-8 overflow-auto">
                      {adminTab === 'question' && (
                        <iframe src="/admin" className="w-full h-full min-h-[500px] bg-white rounded shadow" />
                      )}
                      {adminTab === 'user' && (
                        <div>用户管理（待实现）</div>
                      )}
                      {adminTab === 'role' && (
                        <div>权限管理（待实现）</div>
                      )}
                      {adminTab === 'system' && (
                        <div>系统管理（考试记录、错题汇总分析，待实现）</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/login" 
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                <LogIn className="w-4 h-4 mr-2" />
                登录
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">PMP考试助手</h1>
            <p className="text-xl mb-8">专业的PMP考试练习与模拟测试平台</p>
            {user ? (
              <div className="flex justify-center space-x-4">
                <Link 
                  href="/practice" 
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition duration-200 font-semibold"
                >
                  开始练习
                </Link>
                <Link 
                  href="/exam"
                  className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition duration-200 font-semibold"
                >
                  模拟考试
                </Link>
              </div>
            ) : (
              <div className="flex justify-center space-x-4">
                <Link 
                  href="/login" 
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition duration-200 font-semibold"
                >
                  立即登录
                </Link>
                <Link 
                  href="/register"
                  className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition duration-200 font-semibold"
                >
                  免费注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">1000+</div>
            <div className="text-gray-600">练习题目</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">5</div>
            <div className="text-gray-600">知识领域</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">180</div>
            <div className="text-gray-600">模拟题数</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">实时</div>
            <div className="text-gray-600">答题反馈</div>
          </div>
        </div>

        {/* 功能特色 */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">核心功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <Brain className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">智能练习</h3>
              <p className="text-gray-600">根据你的学习进度和薄弱环节，智能推荐练习题目，提高学习效率。</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <Trophy className="w-12 h-12 text-yellow-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">模拟考试</h3>
              <p className="text-gray-600">完全模拟真实考试环境，帮助你熟悉考试流程，提升应试能力。</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <History className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">错题管理</h3>
              <p className="text-gray-600">自动收集错题，提供详细解析，让你从错误中快速成长。</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <Star className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">学习追踪</h3>
              <p className="text-gray-600">全面追踪学习进度，可视化展示知识掌握程度，科学备考。</p>
            </div>
          </div>
        </div>

        {/* 功能导航 */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-8">开始学习</h2>
          {user ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Link key={feature.title} href={feature.href}>
                  <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition duration-200 cursor-pointer border-2 border-transparent hover:border-blue-200">
                    <div className="flex items-center mb-4">
                      <feature.icon className={`w-8 h-8 ${feature.color} mr-3`} />
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                    </div>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-white rounded-lg shadow p-8 max-w-md mx-auto">
                <LogIn className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">请先登录</h3>
                <p className="text-gray-600 mb-6">登录后即可使用完整的学习功能</p>
                <Link 
                  href="/login"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 font-semibold"
                >
                  立即登录
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 底部信息 */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
                <span className="text-lg font-semibold">PMP考试助手</span>
              </div>
              <p className="text-gray-400">专业的PMP考试备考平台，助您顺利通过考试</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">快速链接</h4>
              <div className="space-y-2">
                <Link href="/practice" className="block text-gray-400 hover:text-white">练习模式</Link>
                <Link href="/exam" className="block text-gray-400 hover:text-white">模拟考试</Link>
                <Link href="/questions" className="block text-gray-400 hover:text-white">题库浏览</Link>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">联系我们</h4>
              <p className="text-gray-400">邮箱：support@pmp-helper.com</p>
              <p className="text-gray-400">电话：400-123-4567</p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">© 2024 PMP考试助手 - 专注于PMP考试备考</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
