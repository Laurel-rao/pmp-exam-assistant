import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash, ChevronRight, ChevronDown } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth';

// 菜单类型定义
interface Menu {
  id: string;
  name: string;
  path: string | null;
  icon: string | null;
  component: string | null;
  parentId: string | null;
  sort: number;
  type: number; // 1-菜单 2-按钮
  permission: string | null;
  status: number; // 1-显示 0-隐藏
  createdAt: string;
  updatedAt: string;
  children?: Menu[];
  // 用于UI展示
  isExpanded?: boolean;
  level?: number;
}

export default function MenuManagement() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [menuTree, setMenuTree] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentMenu, setCurrentMenu] = useState<Menu | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    icon: '',
    component: '',
    parentId: '',
    sort: 0,
    type: 1,
    permission: '',
    status: 1,
  });

  // 获取菜单列表
  const fetchMenus = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/admin/menus');
      const data = await response.json();
      if (data.success) {
        setMenus(data.data.menus);
        // 构建树形结构
        const tree = buildMenuTree(data.data.menus);
        setMenuTree(tree);
      } else {
        setError(data.message || '获取菜单列表失败');
      }
    } catch (err) {
      setError('获取菜单列表时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchMenus();
  }, []);

  // 将菜单列表转换为树形结构
  const buildMenuTree = (menus: Menu[]): Menu[] => {
    const menuMap = new Map<string, Menu>();
    const result: Menu[] = [];

    // 首先创建一个以ID为键的菜单映射
    menus.forEach(menu => {
      menuMap.set(menu.id, { ...menu, children: [], isExpanded: true, level: 0 });
    });

    // 然后将每个菜单放到其父菜单的children数组中
    menus.forEach(menu => {
      const currentMenu = menuMap.get(menu.id);
      if (!currentMenu) return;

      if (menu.parentId && menuMap.has(menu.parentId)) {
        const parentMenu = menuMap.get(menu.parentId);
        if (parentMenu) {
          currentMenu.level = (parentMenu.level || 0) + 1;
          parentMenu.children?.push(currentMenu);
          // 按排序字段排序
          parentMenu.children?.sort((a, b) => a.sort - b.sort);
        }
      } else {
        result.push(currentMenu);
      }
    });

    // 顶级菜单按排序字段排序
    result.sort((a, b) => a.sort - b.sort);
    return result;
  };

  // 切换展开/折叠状态
  const toggleExpand = (menuId: string) => {
    setMenuTree(prev => {
      const updateMenuExpanded = (menus: Menu[]): Menu[] => {
        return menus.map(menu => {
          if (menu.id === menuId) {
            return { ...menu, isExpanded: !menu.isExpanded };
          }
          if (menu.children && menu.children.length > 0) {
            return { ...menu, children: updateMenuExpanded(menu.children) };
          }
          return menu;
        });
      };
      return updateMenuExpanded(prev);
    });
  };

  // 打开新增菜单模态框
  const handleAddMenu = (parentMenu: Menu | null = null) => {
    setFormData({
      name: '',
      path: '',
      icon: '',
      component: '',
      parentId: parentMenu ? parentMenu.id : '',
      sort: 0,
      type: 1,
      permission: '',
      status: 1,
    });
    setModalMode('add');
    setShowModal(true);
  };

  // 打开编辑菜单模态框
  const handleEditMenu = (menu: Menu) => {
    setCurrentMenu(menu);
    setFormData({
      name: menu.name,
      path: menu.path || '',
      icon: menu.icon || '',
      component: menu.component || '',
      parentId: menu.parentId || '',
      sort: menu.sort,
      type: menu.type,
      permission: menu.permission || '',
      status: menu.status,
    });
    setModalMode('edit');
    setShowModal(true);
  };

  // 删除菜单
  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm('确定要删除此菜单吗？此操作不可恢复，且会同时删除其子菜单。')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/admin/menus/${menuId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        // 刷新菜单列表
        fetchMenus();
      } else {
        setError(data.message || '删除菜单失败');
      }
    } catch (err) {
      setError('删除菜单时发生错误');
    }
  };

  // 表单数据变更处理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['sort', 'type', 'status'].includes(name) ? parseInt(value) : value,
    }));
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 基本表单验证
    if (!formData.name) {
      setError('菜单名称不能为空');
      return;
    }

    try {
      let response;
      
      if (modalMode === 'add') {
        // 新增菜单
        response = await authenticatedFetch('/api/admin/menus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else if (modalMode === 'edit' && currentMenu) {
        // 编辑菜单
        response = await authenticatedFetch(`/api/admin/menus/${currentMenu.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (response) {
        const data = await response.json();
        if (data.success) {
          // 关闭模态框并刷新菜单列表
          setShowModal(false);
          fetchMenus();
          setError('');
        } else {
          setError(data.message || '操作失败');
        }
      }
    } catch (err) {
      setError('提交表单时发生错误');
    }
  };

  // 递归渲染菜单树
  const renderMenuTree = (menus: Menu[]) => {
    return menus.map(menu => (
      <div key={menu.id}>
        <div
          className="flex items-center py-3 px-4 hover:bg-gray-50 border-b border-gray-100"
          style={{ paddingLeft: `${(menu.level || 0) * 20 + 16}px` }}
        >
          {menu.children && menu.children.length > 0 ? (
            <button 
              className="mr-2 focus:outline-none"
              onClick={() => toggleExpand(menu.id)}
            >
              {menu.isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <span className="w-4 h-4 mr-2"></span>
          )}
          
          <div className="flex-1 flex items-center">
            <span className={`text-sm ${menu.status === 1 ? 'text-gray-800' : 'text-gray-400'}`}>
              {menu.name}
            </span>
            <span className="ml-2 text-xs text-gray-500">
              {menu.type === 1 ? '[菜单]' : '[按钮]'}
            </span>
            {menu.path && (
              <span className="ml-2 text-xs text-blue-500">
                {menu.path}
              </span>
            )}
            {menu.permission && (
              <span className="ml-2 text-xs text-green-500">
                {menu.permission}
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button 
              className="text-gray-600 hover:text-blue-600"
              onClick={() => handleAddMenu(menu)}
              title="添加子菜单"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              className="text-gray-600 hover:text-blue-600"
              onClick={() => handleEditMenu(menu)}
              title="编辑菜单"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button 
              className="text-gray-600 hover:text-red-600"
              onClick={() => handleDeleteMenu(menu.id)}
              title="删除菜单"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {menu.children && menu.children.length > 0 && menu.isExpanded && (
          <div>
            {renderMenuTree(menu.children)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">菜单管理</h1>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          onClick={() => handleAddMenu()}
        >
          <Plus className="w-4 h-4 mr-2" />
          新增顶级菜单
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
        <div className="bg-white rounded-md shadow">
          <div className="py-3 px-4 bg-gray-50 border-b border-gray-200 flex font-medium text-sm text-gray-600">
            <div className="flex-1">菜单名称</div>
            <div className="w-24 text-right">操作</div>
          </div>
          <div className="divide-y divide-gray-100">
            {menuTree.length > 0 ? (
              renderMenuTree(menuTree)
            ) : (
              <div className="py-4 text-center text-gray-500">暂无菜单数据</div>
            )}
          </div>
        </div>
      )}

      {/* 模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {modalMode === 'add' ? '新增菜单' : '编辑菜单'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  菜单名称 <span className="text-red-500">*</span>
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
                  上级菜单
                </label>
                <select
                  name="parentId"
                  value={formData.parentId}
                  onChange={handleInputChange}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">无上级菜单</option>
                  {menus.map(menu => (
                    <option key={menu.id} value={menu.id}>
                      {menu.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  菜单类型
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value={1}>菜单</option>
                  <option value={2}>按钮</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  菜单路径
                </label>
                <input
                  type="text"
                  name="path"
                  value={formData.path}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <p className="text-xs text-gray-500 mt-1">前端路由路径，如 /admin/user</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  组件路径
                </label>
                <input
                  type="text"
                  name="component"
                  value={formData.component}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <p className="text-xs text-gray-500 mt-1">前端组件路径，如 @/views/admin/user</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  权限标识
                </label>
                <input
                  type="text"
                  name="permission"
                  value={formData.permission}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <p className="text-xs text-gray-500 mt-1">权限标识，如 user:list、user:create</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  图标
                </label>
                <input
                  type="text"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <p className="text-xs text-gray-500 mt-1">菜单图标名称，如 UserIcon</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  排序
                </label>
                <input
                  type="number"
                  name="sort"
                  value={formData.sort}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <p className="text-xs text-gray-500 mt-1">数字越小越靠前</p>
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
                  <option value={1}>显示</option>
                  <option value={0}>隐藏</option>
                </select>
              </div>
              
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