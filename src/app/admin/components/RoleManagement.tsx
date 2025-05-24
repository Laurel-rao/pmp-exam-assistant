import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash, Lock } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth';

// 角色类型定义
interface Role {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  roleMenus: {
    menu: {
      id: string;
      name: string;
      path: string | null;
      permission: string | null;
    };
  }[];
}

// 菜单类型定义
interface Menu {
  id: string;
  name: string;
  path: string | null;
  icon: string | null;
  component: string | null;
  parentId: string | null;
  sort: number;
  type: number;
  permission: string | null;
  status: number;
  children?: Menu[];
}

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'permission'>('add');
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 1,
  });
  const [allMenus, setAllMenus] = useState<Menu[]>([]);
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);

  // 获取角色列表
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/admin/roles');
      const data = await response.json();
      if (data.success) {
        setRoles(data.data.roles);
      } else {
        setError(data.message || '获取角色列表失败');
      }
    } catch (err) {
      setError('获取角色列表时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 获取菜单列表
  const fetchMenus = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/menus');
      const data = await response.json();
      if (data.success) {
        setAllMenus(data.data.menus);
      }
    } catch (err) {
      console.error('获取菜单列表失败', err);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchRoles();
    fetchMenus();
  }, []);

  // 打开新增角色模态框
  const handleAddRole = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      status: 1,
    });
    setModalMode('add');
    setShowModal(true);
  };

  // 打开编辑角色模态框
  const handleEditRole = (role: Role) => {
    setCurrentRole(role);
    setFormData({
      name: role.name,
      code: role.code,
      description: role.description || '',
      status: role.status,
    });
    setModalMode('edit');
    setShowModal(true);
  };

  // 打开权限分配模态框
  const handleManagePermissions = (role: Role) => {
    setCurrentRole(role);
    // 设置当前角色已分配的菜单权限
    setSelectedMenus(role.roleMenus.map(rm => rm.menu.id));
    setModalMode('permission');
    setShowModal(true);
  };

  // 删除角色
  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('确定要删除此角色吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        // 刷新角色列表
        fetchRoles();
      } else {
        setError(data.message || '删除角色失败');
      }
    } catch (err) {
      setError('删除角色时发生错误');
    }
  };

  // 表单数据变更处理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'status' ? parseInt(value) : value,
    }));
  };

  // 菜单选择变更处理
  const handleMenuChange = (menuId: string) => {
    setSelectedMenus(prev => {
      if (prev.includes(menuId)) {
        return prev.filter(id => id !== menuId);
      } else {
        return [...prev, menuId];
      }
    });
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 基本表单验证
    if (!formData.name || !formData.code) {
      setError('角色名称和角色代码不能为空');
      return;
    }

    try {
      let response;
      
      if (modalMode === 'add') {
        // 新增角色
        response = await authenticatedFetch('/api/admin/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else if (modalMode === 'edit' && currentRole) {
        // 编辑角色
        response = await authenticatedFetch(`/api/admin/roles/${currentRole.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else if (modalMode === 'permission' && currentRole) {
        // 分配权限
        response = await authenticatedFetch(`/api/admin/roles/${currentRole.id}/menus`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ menuIds: selectedMenus }),
        });
      }

      if (response) {
        const data = await response.json();
        if (data.success) {
          // 关闭模态框并刷新角色列表
          setShowModal(false);
          fetchRoles();
          setError('');
        } else {
          setError(data.message || '操作失败');
        }
      }
    } catch (err) {
      setError('提交表单时发生错误');
    }
  };

  // 将菜单列表转换为树形结构
  const buildMenuTree = (menus: Menu[]): Menu[] => {
    const menuMap = new Map<string, Menu>();
    const result: Menu[] = [];

    // 首先创建一个以ID为键的菜单映射
    menus.forEach(menu => {
      menuMap.set(menu.id, { ...menu, children: [] });
    });

    // 然后将每个菜单放到其父菜单的children数组中
    menus.forEach(menu => {
      const currentMenu = menuMap.get(menu.id);
      if (!currentMenu) return;

      if (menu.parentId && menuMap.has(menu.parentId)) {
        const parentMenu = menuMap.get(menu.parentId);
        parentMenu?.children?.push(currentMenu);
      } else {
        result.push(currentMenu);
      }
    });

    return result;
  };

  // 递归渲染菜单树
  const renderMenuTree = (menus: Menu[], level = 0) => {
    return menus.map(menu => (
      <div key={menu.id} className="mb-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id={`menu-${menu.id}`}
            checked={selectedMenus.includes(menu.id)}
            onChange={() => handleMenuChange(menu.id)}
            className="mr-2"
          />
          <label htmlFor={`menu-${menu.id}`} className="text-gray-700" style={{ marginLeft: `${level * 20}px` }}>
            {menu.name}
            {menu.permission && <span className="text-gray-500 text-xs ml-2">({menu.permission})</span>}
          </label>
        </div>
        {menu.children && menu.children.length > 0 && (
          <div className="ml-4">
            {renderMenuTree(menu.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">角色管理</h1>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          onClick={handleAddRole}
        >
          <Plus className="w-4 h-4 mr-2" />
          新增角色
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
                  角色名称
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色代码
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  描述
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map(role => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{role.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{role.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{role.description || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${role.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {role.status === 1 ? '正常' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(role.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => handleEditRole(role)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteRole(role.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-purple-600 hover:text-purple-900"
                        onClick={() => handleManagePermissions(role)}
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    暂无角色数据
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
              {modalMode === 'add' ? '新增角色' : modalMode === 'edit' ? '编辑角色' : '分配权限'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {modalMode !== 'permission' ? (
                // 角色表单（新增/编辑）
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      角色名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      角色代码 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">角色代码仅允许使用字母、数字和下划线</p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      角色描述
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      rows={3}
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
                // 权限分配表单
                <div className="mb-4 max-h-60 overflow-y-auto">
                  <div className="text-gray-700 mb-2">选择菜单权限：</div>
                  {renderMenuTree(buildMenuTree(allMenus))}
                  {allMenus.length === 0 && <div className="text-gray-500">暂无菜单数据</div>}
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