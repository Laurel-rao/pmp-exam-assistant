import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, checkAdminPermission } from '@/lib/auth'

// 菜单数据接口
interface MenuData {
  name: string;
  path: string | null;
  icon: string | null;
  component: string | null;
  sort: number;
  type: number;
  permission: string;
  children: MenuData[];
}

// 预定义的菜单数据
const predefinedMenus: MenuData[] = [
  {
    name: '个人中心',
    path: '/profile',
    icon: 'User',
    component: 'ProfilePage',
    sort: 7,
    type: 1,
    permission: 'profile:view',
    children: []
  },
  {
    name: '系统管理',
    path: '/admin',
    icon: 'Settings',
    component: null,
    sort: 100,
    type: 1,
    permission: 'system:access',
    children: [
      {
        name: '用户管理',
        path: '/admin/users',
        icon: 'Users',
        component: 'UserManagePage',
        sort: 1,
        type: 1,
        permission: 'system:user:list',
        children: []
      },
      {
        name: '角色管理',
        path: '/admin/roles',
        icon: 'Shield',
        component: 'RoleManagePage',
        sort: 2,
        type: 1,
        permission: 'system:role:list',
        children: []
      },
      {
        name: '菜单管理',
        path: '/admin/menus',
        icon: 'Menu',
        component: 'MenuManagePage',
        sort: 3,
        type: 1,
        permission: 'system:menu:list',
        children: []
      }
    ]
  }
]

// 同步菜单到数据库
export async function POST(request: NextRequest) {
  try {
    console.log('API: /api/admin/menus/sync 被访问')
    
    // 验证管理员权限
    const user = await getCurrentUser(request)
    console.log('获取到的用户信息:', user ? JSON.stringify(user) : '未获取到用户')
    
    if (!user) {
      console.log('API权限验证: 未获取到用户信息')
      return NextResponse.json(
        { success: false, message: '未登录或令牌已过期' },
        { status: 401 }
      )
    }
    
    // 检查管理员权限
    if (!checkAdminPermission(user)) {
      console.log('API权限验证: 用户无管理员权限, 角色:', user.roles)
      return NextResponse.json(
        { success: false, message: '无权访问，需要管理员权限' },
        { status: 403 }
      )
    }

    console.log('API权限验证通过，用户ID:', user.id, '角色:', user.roles)

    // 开始同步菜单数据
    const results: any[] = []
    
    // 处理一个菜单及其子菜单
    async function processMenu(menuData: MenuData, parentId: string | null = null) {
      try {
        // 检查菜单是否已存在
        let menu = await prisma.menu.findFirst({
          where: { 
            permission: menuData.permission 
          }
        })
        
        if (!menu) {
          // 如果不存在，创建新菜单
          menu = await prisma.menu.create({
            data: {
              name: menuData.name,
              path: menuData.path,
              icon: menuData.icon,
              component: menuData.component,
              parentId: parentId,
              sort: menuData.sort,
              type: menuData.type,
              permission: menuData.permission,
              status: 1
            }
          })
          results.push({ action: 'created', menu: menu.name, id: menu.id })
        } else {
          // 如果存在，更新菜单
          menu = await prisma.menu.update({
            where: { id: menu.id },
            data: {
              name: menuData.name,
              path: menuData.path,
              icon: menuData.icon,
              component: menuData.component,
              parentId: parentId,
              sort: menuData.sort,
              type: menuData.type,
              status: 1
            }
          })
          results.push({ action: 'updated', menu: menu.name, id: menu.id })
        }
        
        // 处理子菜单
        if (menuData.children && menuData.children.length > 0) {
          for (const childMenu of menuData.children) {
            await processMenu(childMenu, menu.id)
          }
        }
        
        return menu
      } catch (error) {
        console.error('处理菜单失败:', menuData.name, error)
        results.push({ action: 'error', menu: menuData.name, error: error.message })
        return null
      }
    }
    
    // 处理所有预定义菜单
    for (const menuData of predefinedMenus) {
      await processMenu(menuData)
    }
    
    // 检查是否有ADMIN角色
    let adminRole = null
    try {
      adminRole = await prisma.role.findFirst({
        where: { code: 'ADMIN' }
      })
    } catch (error) {
      console.error('获取ADMIN角色失败:', error)
      results.push({ action: 'error', message: '获取ADMIN角色失败' })
    }
    
    if (adminRole) {
      try {
        // 获取所有菜单
        const allMenus = await prisma.menu.findMany()
        
        // 为ADMIN角色分配所有菜单权限
        for (const menu of allMenus) {
          try {
            // 检查关联是否已存在
            const existingRoleMenu = await prisma.roleMenu.findFirst({
              where: {
                roleId: adminRole.id,
                menuId: menu.id
              }
            })
            
            if (!existingRoleMenu) {
              // 创建角色与菜单的关联
              await prisma.roleMenu.create({
                data: {
                  roleId: adminRole.id,
                  menuId: menu.id
                }
              })
              results.push({ action: 'assigned', menu: menu.id, role: 'ADMIN' })
            }
          } catch (error) {
            console.error('分配菜单权限失败:', menu.id, error)
            results.push({ action: 'error', message: `分配菜单权限失败: ${menu.id}`, error: error.message })
          }
        }
      } catch (error) {
        console.error('获取菜单列表失败:', error)
        results.push({ action: 'error', message: '获取菜单列表失败' })
      }
    }

    return NextResponse.json({
      success: true,
      message: '菜单同步完成',
      data: { results }
    })
  } catch (error) {
    console.error('同步菜单失败:', error)
    return NextResponse.json(
      { success: false, message: '同步菜单失败: ' + error.message },
      { status: 500 }
    )
  }
} 