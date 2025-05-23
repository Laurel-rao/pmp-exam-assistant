import { PrismaClient } from '../src/generated/prisma'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据库...')

  try {
    // 创建默认角色
    const adminRole = await prisma.role.upsert({
      where: { code: 'ADMIN' },
      update: {},
      create: {
        name: '系统管理员',
        code: 'ADMIN',
        description: '系统管理员，拥有所有权限',
      },
    })

    const userRole = await prisma.role.upsert({
      where: { code: 'USER' },
      update: {},
      create: {
        name: '普通用户',
        code: 'USER',
        description: '系统普通用户',
      },
    })

    console.log('✅ 角色创建完成')

    // 创建默认菜单
    const menus = [
      // 主菜单
      {
        name: '首页',
        path: '/',
        icon: 'Home',
        component: 'HomePage',
        sort: 1,
        type: 1,
        permission: 'dashboard:view',
      },
      {
        name: '题库管理',
        path: '/questions',
        icon: 'BookOpen',
        component: 'QuestionsPage',
        sort: 2,
        type: 1,
        permission: 'question:list',
      },
      {
        name: '练习模式',
        path: '/practice',
        icon: 'FileText',
        component: 'PracticePage',
        sort: 3,
        type: 1,
        permission: 'practice:access',
      },
      {
        name: '考试模式',
        path: '/exam',
        icon: 'Brain',
        component: 'ExamPage',
        sort: 4,
        type: 1,
        permission: 'exam:access',
      },
      {
        name: '错题本',
        path: '/mistakes',
        icon: 'History',
        component: 'MistakesPage',
        sort: 5,
        type: 1,
        permission: 'mistake:view',
      },
      {
        name: '收藏夹',
        path: '/favorites',
        icon: 'Star',
        component: 'FavoritesPage',
        sort: 6,
        type: 1,
        permission: 'favorite:view',
      },
      {
        name: '个人中心',
        path: '/profile',
        icon: 'User',
        component: 'ProfilePage',
        sort: 7,
        type: 1,
        permission: 'profile:view',
      },
      // 系统管理菜单
      {
        name: '系统管理',
        path: '/system',
        icon: 'Settings',
        sort: 100,
        type: 1,
        permission: 'system:access',
      },
    ]

    // 创建菜单
    const createdMenus = []
    for (const menuData of menus) {
      // 先检查是否已存在
      let menu = await prisma.menu.findFirst({
        where: { 
          name: menuData.name,
          path: menuData.path
        }
      })

      if (!menu) {
        menu = await prisma.menu.create({
          data: menuData
        })
      }
      createdMenus.push(menu)
    }

    // 创建系统管理子菜单
    const systemMenu = createdMenus.find(m => m.name === '系统管理')
    if (systemMenu) {
      const systemSubMenus = [
        {
          name: '用户管理',
          path: '/system/users',
          icon: 'Users',
          component: 'UserManagePage',
          parentId: systemMenu.id,
          sort: 1,
          type: 1,
          permission: 'system:user:list',
        },
        {
          name: '角色管理',
          path: '/system/roles',
          icon: 'Shield',
          component: 'RoleManagePage',
          parentId: systemMenu.id,
          sort: 2,
          type: 1,
          permission: 'system:role:list',
        },
        {
          name: '菜单管理',
          path: '/system/menus',
          icon: 'Menu',
          component: 'MenuManagePage',
          parentId: systemMenu.id,
          sort: 3,
          type: 1,
          permission: 'system:menu:list',
        },
      ]

      for (const subMenuData of systemSubMenus) {
        const existingSubMenu = await prisma.menu.findFirst({
          where: { 
            name: subMenuData.name,
            path: subMenuData.path
          }
        })

        if (!existingSubMenu) {
          await prisma.menu.create({
            data: subMenuData
          })
        }
      }
    }

    console.log('✅ 菜单创建完成')

    // 为管理员角色分配所有菜单权限
    const allMenus = await prisma.menu.findMany()
    for (const menu of allMenus) {
      const existing = await prisma.roleMenu.findFirst({
        where: {
          roleId: adminRole.id,
          menuId: menu.id,
        }
      })

      if (!existing) {
        await prisma.roleMenu.create({
          data: {
            roleId: adminRole.id,
            menuId: menu.id,
          }
        })
      }
    }

    // 为普通用户分配基础菜单权限
    const userMenus = allMenus.filter(menu => 
      !menu.permission?.startsWith('system:') && menu.parentId === null
    )
    for (const menu of userMenus) {
      const existing = await prisma.roleMenu.findFirst({
        where: {
          roleId: userRole.id,
          menuId: menu.id,
        }
      })

      if (!existing) {
        await prisma.roleMenu.create({
          data: {
            roleId: userRole.id,
            menuId: menu.id,
          }
        })
      }
    }

    console.log('✅ 角色菜单权限分配完成')

    // 创建默认管理员用户
    const adminPassword = await hashPassword('admin123')
    await prisma.user.upsert({
      where: { phone: '13800138000' },
      update: {},
      create: {
        name: '系统管理员',
        phone: '13800138000',
        password: adminPassword,
        userRoles: {
          create: {
            roleId: adminRole.id,
          }
        }
      },
    })

    // 创建默认普通用户
    const userPassword = await hashPassword('A123456')
    await prisma.user.upsert({
      where: { phone: '13800138001' },
      update: {},
      create: {
        name: '测试用户',
        phone: '13800138001',
        password: userPassword,
        userRoles: {
          create: {
            roleId: userRole.id,
          }
        }
      },
    })

    console.log('✅ 默认用户创建完成')
    console.log('📱 管理员账号: 13800138000 / admin123')
    console.log('📱 测试账号: 13800138001 / A123456')

    console.log('🎉 数据库初始化完成!')

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 