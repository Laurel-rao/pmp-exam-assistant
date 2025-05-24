import { PrismaClient } from '../src/generated/prisma'
import { prisma } from '../src/lib/prisma'

// 使用已导入的prisma实例，不需要再创建新的
// const prisma = new PrismaClient()

async function main() {
  console.log('开始添加菜单...')

  try {
    // 检查是否已存在错题本菜单
    let mistakesMenu = await prisma.menu.findFirst({
      where: {
        path: '/mistakes'
      }
    })

    if (!mistakesMenu) {
      mistakesMenu = await prisma.menu.create({
        data: {
          name: '错题本',
          path: '/mistakes',
          icon: 'BookMarked',
          component: 'MistakesPage',
          sort: 5,  // 排在收藏夹前面
          type: 1,
          permission: 'mistakes:view',
          status: 1
        }
      })
      console.log('✅ 错题本菜单创建成功:', mistakesMenu.id)
    } else {
      console.log('⚠️ 错题本菜单已存在, ID:', mistakesMenu.id)
    }

    // 检查并添加Admin菜单，替换原来的system菜单
    let adminMenu = await prisma.menu.findFirst({
      where: {
        path: '/admin'
      }
    })

    if (!adminMenu) {
      adminMenu = await prisma.menu.create({
        data: {
          name: '系统管理',
          path: '/admin',
          icon: 'Settings',
          sort: 100,
          type: 1,
          permission: 'admin:access',
          status: 1
        }
      })
      console.log('✅ 系统管理菜单创建成功:', adminMenu.id)
    } else {
      console.log('⚠️ 系统管理菜单已存在, ID:', adminMenu.id)
    }

    // 添加系统管理子菜单
    if (adminMenu) {
      const adminSubMenus = [
        {
          name: '数据统计',
          path: '/admin',
          icon: 'BarChart',
          component: 'AdminDashboard',
          parentId: adminMenu.id,
          sort: 1,
          type: 1,
          permission: 'admin:dashboard',
        },
        {
          name: '用户管理',
          path: '/admin/users',
          icon: 'Users',
          component: 'UserManagePage',
          parentId: adminMenu.id,
          sort: 2,
          type: 1,
          permission: 'admin:user:list',
        },
        {
          name: '角色管理',
          path: '/admin/roles',
          icon: 'Shield',
          component: 'RoleManagePage',
          parentId: adminMenu.id,
          sort: 3,
          type: 1,
          permission: 'admin:role:list',
        },
        {
          name: '菜单管理',
          path: '/admin/menus',
          icon: 'Menu',
          component: 'MenuManagePage',
          parentId: adminMenu.id,
          sort: 4,
          type: 1,
          permission: 'admin:menu:list',
        },
        {
          name: '题库管理',
          path: '/admin/questions',
          icon: 'FileQuestion',
          component: 'QuestionsManagePage',
          parentId: adminMenu.id,
          sort: 5,
          type: 1,
          permission: 'admin:question:list',
        },
      ]

      for (const subMenuData of adminSubMenus) {
        const existingSubMenu = await prisma.menu.findFirst({
          where: { 
            path: subMenuData.path
          }
        })

        if (!existingSubMenu) {
          const newSubMenu = await prisma.menu.create({
            data: subMenuData
          })
          console.log(`✅ 子菜单 "${subMenuData.name}" 创建成功:`, newSubMenu.id)
        } else {
          console.log(`⚠️ 子菜单 "${subMenuData.name}" 已存在, ID:`, existingSubMenu.id)
        }
      }
    }

    // 获取管理员角色
    const adminRole = await prisma.role.findFirst({
      where: {
        code: 'ADMIN'
      }
    })

    if (adminRole) {
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
          console.log(`✅ 为管理员角色分配菜单权限: ${menu.name}`)
        }
      }
    } else {
      console.log('❌ 未找到管理员角色，无法分配菜单权限')
    }

    console.log('✅ 菜单添加完成')
  } catch (error) {
    console.error('添加菜单时出错:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  }) 