"use client"

import { useState, useEffect } from "react";
import { authenticatedFetch } from "@/lib/auth";
import UserManagement from "./components/UserManagement";
import RoleManagement from "./components/RoleManagement";
import MenuManagement from "./components/MenuManagement";

export default function AdminPage() {
  // 统计数据
  const [stats, setStats] = useState({
    userCount: 0,
    roleCount: 0,
    menuCount: 0,
    questionCount: 0,
    examCount: 0,
    systemInfo: {
      version: '1.0.0',
      launchDate: '2023-10-01',
      lastUpdate: '2023-10-15',
      dbStatus: 'normal',
      serverStatus: 'normal',
      apiVersion: 'v1'
    }
  });
  const [loading, setLoading] = useState(true);

  // 获取统计数据
  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const response = await authenticatedFetch('/api/admin/stats');
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.data);
          }
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">管理后台</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 快捷访问卡片 */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold mb-2">用户管理</h2>
          <p className="text-gray-600 mb-4">管理系统用户、分配角色和权限</p>
          <div className="text-sm text-blue-600">
            总用户数: <span>{loading ? '加载中...' : stats.userCount}</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold mb-2">角色管理</h2>
          <p className="text-gray-600 mb-4">管理系统角色、设置权限</p>
          <div className="text-sm text-blue-600">
            总角色数: <span>{loading ? '加载中...' : stats.roleCount}</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold mb-2">菜单管理</h2>
          <p className="text-gray-600 mb-4">管理系统菜单、配置权限</p>
          <div className="text-sm text-blue-600">
            总菜单数: <span>{loading ? '加载中...' : stats.menuCount}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">系统信息</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">系统版本: <span className="text-black">{stats.systemInfo.version}</span></p>
            <p className="text-gray-600">上线时间: <span className="text-black">{stats.systemInfo.launchDate}</span></p>
            <p className="text-gray-600">最后更新: <span className="text-black">{stats.systemInfo.lastUpdate}</span></p>
          </div>
          <div>
            <p className="text-gray-600">数据库状态: <span className="text-green-600">{stats.systemInfo.dbStatus === 'normal' ? '正常' : '异常'}</span></p>
            <p className="text-gray-600">服务器状态: <span className="text-green-600">{stats.systemInfo.serverStatus === 'normal' ? '正常' : '异常'}</span></p>
            <p className="text-gray-600">API版本: <span className="text-black">{stats.systemInfo.apiVersion}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}