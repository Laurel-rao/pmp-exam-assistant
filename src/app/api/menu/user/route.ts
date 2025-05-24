import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUserMenus } from '@/lib/auth'

// 菜单项接口
interface MenuItem {
  id: string;
  name: string;
  path: string | null;
  icon: string | null;
  component: string | null;
  permission: string | null;
  sort: number;
  type: number;
  parentId: string | null;
}

// 获取当前用户的菜单
export async function GET(request: NextRequest) {
  try {
    console.log('API: /api/menu/user 被访问')
    
    // 验证用户登录
    const user = await getCurrentUser(request)
    console.log('获取到的用户信息:', user ? JSON.stringify(user) : '未获取到用户')
    
    if (!user) {
      console.log('API权限验证: 未获取到用户信息')
      return NextResponse.json(
        { success: false, message: '未登录或令牌已过期' },
        { status: 401 }
      )
    }

    // 获取用户菜单
    let menus: MenuItem[] = [];
    try {
      menus = await getUserMenus(user.id) as MenuItem[];
      console.log(`获取到用户 ${user.id} 的菜单，共 ${menus.length} 项`);
    } catch (err) {
      console.error('获取用户菜单错误:', err);
      return NextResponse.json(
        { success: false, message: '获取菜单失败' },
        { status: 500 }
      );
    }

    // 构建树形菜单结构
    const buildMenuTree = (items: MenuItem[], parentId: string | null = null) => {
      return items
        .filter(item => item.parentId === parentId)
        .map(item => ({
          id: item.id,
          name: item.name,
          path: item.path,
          icon: item.icon,
          component: item.component,
          permission: item.permission,
          sort: item.sort,
          type: item.type,
          children: buildMenuTree(items, item.id)
        }))
        .sort((a, b) => a.sort - b.sort)
    }

    const menuTree = buildMenuTree(menus)

    return NextResponse.json({
      success: true,
      data: { menus: menuTree }
    })
  } catch (error) {
    console.error('获取用户菜单失败:', error)
    return NextResponse.json(
      { success: false, message: '获取用户菜单失败' },
      { status: 500 }
    )
  }
} 