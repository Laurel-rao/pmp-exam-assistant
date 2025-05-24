"use client"

import { useState } from 'react'
import { authenticatedFetch } from '@/lib/auth'

// 同步结果项接口
interface SyncResultItem {
  action: string;
  menu?: string;
  id?: string;
  role?: string;
  error?: string;
  message?: string;
}

export default function MenuSyncPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{results: SyncResultItem[]} | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 同步菜单数据
  const handleSync = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)
      
      const response = await authenticatedFetch('/api/admin/menus/sync', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setResult(data.data)
      } else {
        setError(data.message || '同步失败')
      }
    } catch (err) {
      console.error('菜单同步错误:', err)
      setError('同步请求失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 计算同步结果统计
  const getResultStats = () => {
    if (!result?.results) return { created: 0, updated: 0, assigned: 0, errors: 0 }
    
    return result.results.reduce((stats, item) => {
      if (item.action === 'created') stats.created++
      else if (item.action === 'updated') stats.updated++
      else if (item.action === 'assigned') stats.assigned++
      else if (item.action === 'error') stats.errors++
      return stats
    }, { created: 0, updated: 0, assigned: 0, errors: 0 })
  }
  
  const stats = getResultStats()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">菜单同步</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="mb-4 text-gray-700">
          此功能将系统预定义的菜单数据与数据库同步，确保系统菜单的完整性。点击下方按钮开始同步。
        </p>
        
        <button
          onClick={handleSync}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? '同步中...' : '同步菜单数据'}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {result && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">同步结果:</h3>
            
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-green-50 p-3 rounded text-center">
                <div className="text-lg font-semibold text-green-700">{stats.created}</div>
                <div className="text-sm text-green-600">已创建</div>
              </div>
              <div className="bg-blue-50 p-3 rounded text-center">
                <div className="text-lg font-semibold text-blue-700">{stats.updated}</div>
                <div className="text-sm text-blue-600">已更新</div>
              </div>
              <div className="bg-purple-50 p-3 rounded text-center">
                <div className="text-lg font-semibold text-purple-700">{stats.assigned}</div>
                <div className="text-sm text-purple-600">已分配</div>
              </div>
              <div className="bg-red-50 p-3 rounded text-center">
                <div className="text-lg font-semibold text-red-700">{stats.errors}</div>
                <div className="text-sm text-red-600">错误</div>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-md max-h-64 overflow-y-auto">
              <p className="mb-2">操作详情:</p>
              <div className="space-y-1 text-sm">
                {result.results.map((item, index) => (
                  <div key={index} className={`${item.action === 'error' ? 'text-red-600' : 'text-gray-700'}`}>
                    {item.action === 'created' && `✅ 创建菜单: ${item.menu}`}
                    {item.action === 'updated' && `🔄 更新菜单: ${item.menu}`}
                    {item.action === 'assigned' && `🔗 分配权限: ${item.menu} 到角色 ${item.role}`}
                    {item.action === 'error' && `❌ 错误: ${item.message || item.menu} - ${item.error}`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">同步说明</h2>
        <div className="space-y-2 text-gray-700">
          <p>此功能将执行以下操作:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>检查系统预定义菜单是否存在于数据库中</li>
            <li>如不存在，则创建相应菜单记录</li>
            <li>如已存在，则更新菜单信息</li>
            <li>为管理员角色分配所有菜单权限</li>
          </ul>
          <p className="mt-3 text-yellow-600">
            注意：此操作不会删除现有菜单，只会创建或更新。
          </p>
        </div>
      </div>
    </div>
  )
} 