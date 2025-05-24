import Link from 'next/link'
import { Home, BookOpen } from 'lucide-react'

export default function QuestionNavBar() {
  return (
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
  )
} 