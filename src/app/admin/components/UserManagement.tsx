import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash, Award } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth';

// 用户类型定义
interface User {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  status: number;
  lastLogin: string | null;
  createdAt: string;
  userRoles: {
    role: {
      id: string;
      name: string;
      code: string;
    };
  }[];
}

// 角色类型定义
interface Role {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'role'>('add');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    status: 1,
  });
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('正在请求用户列表...');
      const response = await authenticatedFetch('/api/admin/users');
      console.log('用户列表请求响应状态:', response.status);
      
      const data = await response.json();
      console.log('用户列表响应数据:', data.success ? '成功' : '失败', data.message || '');
      
      if (data.success) {
        setUsers(data.data.users);
        setError('');
      } else {
        setError(data.message || '获取用户列表失败');
        // 如果是权限问题，提供更友好的错误提示
        if (response.status === 403) {
          setError('您没有访问此功能的权限，请联系管理员');
        } else if (response.status === 401) {
          setError('会话已过期，请重新登录');
          // 可以在这里添加自动重定向到登录页面的逻辑
        }
      }
    } catch (err) {
      console.error('获取用户列表时发生错误:', err);
      setError('获取用户列表时发生错误，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取角色列表
  const fetchRoles = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/roles');
      const data = await response.json();
      if (data.success) {
        setAllRoles(data.data.roles);
      }
    } catch (err) {
      console.error('获取角色列表失败', err);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // 打开新增用户模态框
  const handleAddUser = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      password: '',
      status: 1,
    });
    setModalMode('add');
    setShowModal(true);
  };

  // 打开编辑用户模态框
  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setFormData({
      name: user.name || '',
      phone: user.phone,
      email: user.email || '',
      password: '', // 编辑时密码为空，如果不修改则不更新
      status: user.status,
    });
    setModalMode('edit');
    setShowModal(true);
  };

  // 打开角色分配模态框
  const handleManageRoles = (user: User) => {
    setCurrentUser(user);
    // 设置当前用户已分配的角色
    setSelectedRoles(user.userRoles.map(ur => ur.role.id));
    setModalMode('role');
    setShowModal(true);
  };

  // 删除用户
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除此用户吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        // 刷新用户列表
        fetchUsers();
      } else {
        setError(data.message || '删除用户失败');
      }
    } catch (err) {
      setError('删除用户时发生错误');
    }
  };

  // 表单数据变更处理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'status' ? parseInt(value) : value,
    }));
  };

  // 角色选择变更处理
  const handleRoleChange = (roleId: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 基本表单验证
    if (!formData.phone) {
      setError('手机号不能为空');
      return;
    }

    if (modalMode === 'add' && !formData.password) {
      setError('密码不能为空');
      return;
    }

    try {
      let response;
      
      if (modalMode === 'add') {
        // 新增用户
        response = await authenticatedFetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else if (modalMode === 'edit' && currentUser) {
        // 编辑用户
        response = await authenticatedFetch(`/api/admin/users/${currentUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else if (modalMode === 'role' && currentUser) {
        // 分配角色
        response = await authenticatedFetch(`/api/admin/users/${currentUser.id}/roles`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleIds: selectedRoles }),
        });
      }

      if (response) {
        const data = await response.json();
        if (data.success) {
          // 关闭模态框并刷新用户列表
          setShowModal(false);
          fetchUsers();
          setError('');
        } else {
          setError(data.message || '操作失败');
        }
      }
    } catch (err) {
      setError('提交表单时发生错误');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          onClick={handleAddUser}
        >
          <Plus className="w-4 h-4 mr-2" />
          新增用户
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : (
        <div className="bg-white rounded-md shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户名
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  手机号
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  邮箱
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注册时间
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.status === 1 ? '正常' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {user.userRoles.length > 0 
                        ? user.userRoles.map(ur => ur.role.name).join(', ') 
                        : '无角色'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => handleEditUser(user)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-yellow-600 hover:text-yellow-900"
                        onClick={() => handleManageRoles(user)}
                      >
                        <Award className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    暂无用户数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {modalMode === 'add' ? '新增用户' : modalMode === 'edit' ? '编辑用户' : '分配角色'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {modalMode !== 'role' ? (
                // 用户表单（新增/编辑）
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      用户名
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      手机号 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      邮箱
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      密码 {modalMode === 'add' && <span className="text-red-500">*</span>}
                      {modalMode === 'edit' && <span className="text-gray-500 text-xs font-normal">(留空表示不修改)</span>}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required={modalMode === 'add'}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      状态
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                      <option value={1}>正常</option>
                      <option value={0}>禁用</option>
                    </select>
                  </div>
                </>
              ) : (
                // 角色分配表单
                <div className="mb-4 max-h-60 overflow-y-auto">
                  <div className="text-gray-700 mb-2">选择角色：</div>
                  {allRoles.map(role => (
                    <div key={role.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`role-${role.id}`}
                        checked={selectedRoles.includes(role.id)}
                        onChange={() => handleRoleChange(role.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`role-${role.id}`} className="text-gray-700">
                        {role.name} <span className="text-gray-500 text-xs">({role.code})</span>
                      </label>
                    </div>
                  ))}
                  {allRoles.length === 0 && <div className="text-gray-500">暂无可分配角色</div>}
                </div>
              )}
              
              <div className="flex items-center justify-end mt-6 space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                  onClick={() => setShowModal(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  确认
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 