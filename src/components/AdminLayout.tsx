import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { authenticatedFetch } from '@/lib/auth'
import { 
  User, 
  Settings, 
  Shield, 
  Menu as MenuIcon, 
  Users,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

// 菜单项类型定义
interface MenuItem {
  id: string
  name: string
  path: string | null
  icon: string | null
  permission: string | null
  children: MenuItem[]
}

// 图标映射
const IconMap = {
  'User': User,
  'Settings': Settings,
  'Shield': Shield,
  'Menu': MenuIcon,
  'Users': Users,
}

// 渲染图标
const renderIcon = (iconName: string | null) => {
  if (!iconName || !IconMap[iconName]) return null
  const Icon = IconMap[iconName]
  return <Icon className="w-5 h-5" />
}

// 菜单项组件
const MenuItemComponent = ({ item, isActive, isExpanded, toggleExpand }: {
  item: MenuItem
  isActive: boolean
  isExpanded: boolean
  toggleExpand: () => void
}) => {
  const hasChildren = item.children && item.children.length > 0
  
  return (
    <div className="menu-item">
      {item.path ? (
        <Link 
          href={item.path} 
          className={`flex items-center py-2 px-4 ${isActive ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
        >
          {item.icon && <span className="mr-2">{renderIcon(item.icon)}</span>}
          <span>{item.name}</span>
          {hasChildren && (
            <span className="ml-auto" onClick={(e) => { e.preventDefault(); toggleExpand(); }}>
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
          )}
        </Link>
      ) : (
        <div 
          className={`flex items-center py-2 px-4 cursor-pointer ${isActive ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
          onClick={toggleExpand}
        >
          {item.icon && <span className="mr-2">{renderIcon(item.icon)}</span>}
          <span>{item.name}</span>
          {hasChildren && (
            <span className="ml-auto">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
          )}
        </div>
      )}
      
      {hasChildren && isExpanded && (
        <div className="pl-4">
          {item.children.map(child => (
            <MenuItemWithState key={child.id} item={child} />
          ))}
        </div>
      )}
    </div>
  )
}

// 带状态的菜单项组件
const MenuItemWithState = ({ item }: { item: MenuItem }) => {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  const isActive = item.path ? pathname === item.path || pathname?.startsWith(item.path) : false
  
  useEffect(() => {
    // 如果当前路径匹配到了子菜单，自动展开父菜单
    if (item.children && item.children.some(child => child.path && pathname?.startsWith(child.path))) {
      setIsExpanded(true)
    }
  }, [pathname, item.children])
  
  return (
    <MenuItemComponent 
      item={item} 
      isActive={isActive} 
      isExpanded={isExpanded} 
      toggleExpand={() => setIsExpanded(prev => !prev)} 
    />
  )
}

// 管理后台布局组件
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // 获取用户菜单
    async function fetchUserMenus() {
      try {
        setLoading(true)
        const response = await authenticatedFetch('/api/menu/user')
        
        if (!response.ok) {
          throw new Error('获取菜单失败')
        }
        
        const data = await response.json()
        if (data.success) {
          setMenus(data.data.menus)
        } else {
          setError(data.message || '获取菜单失败')
        }
      } catch (err) {
        console.error('获取菜单出错:', err)
        setError('获取菜单失败，请刷新页面重试')
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserMenus()
  }, [])
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 侧边栏 */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold">PMP考试助手</h1>
          <p className="text-sm text-gray-500">管理后台</p>
        </div>
        
        <div className="py-4">
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4 text-center">{error}</div>
          ) : (
            <div className="menu-container">
              {menus.map(item => (
                <MenuItemWithState key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
        
        <div className="absolute bottom-0 w-64 border-t p-4">
          <Link href="/api/auth/logout" className="flex items-center text-red-500 hover:text-red-700">
            <LogOut className="w-5 h-5 mr-2" />
            <span>退出登录</span>
          </Link>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  )
} 