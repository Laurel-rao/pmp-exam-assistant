"use client"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, LogOut } from "lucide-react";

const menu = [
  { key: 'user', label: '用户管理' },
  { key: 'role', label: '角色管理' },
  { key: 'menu', label: '菜单管理' },
  { key: 'question', label: '题库管理', children: [
    { key: 'import', label: '导入题库' },
    { key: 'crud', label: '题库增删改查' },
  ]},
  { key: 'analysis', label: '系统分析', children: [
    { key: 'records', label: '用户考试记录' },
    { key: 'mistakes', label: '用户错题分析' },
    { key: 'loginlog', label: '用户登录日志' },
    { key: 'oplog', label: '用户操作日志' },
  ]},
];

export default function AdminPage() {
  const [selected, setSelected] = useState('question-import');
  const router = useRouter();

  // 顶部导航栏（与首页一致，可根据需要提取为组件）
  const TopNav = (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
            <span className="text-xl font-bold text-gray-900">PMP考试助手</span>
            <span className="ml-4 text-blue-700 font-semibold">管理后台</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200">返回首页</Link>
            <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200" onClick={() => router.push('/login')}>
              <LogOut className="w-4 h-4 mr-2" />登出
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  // 左侧菜单渲染
  const renderMenu = (menuList, parentKey = '') => (
    <ul>
      {menuList.map(item => (
        <li key={item.key}>
          <button
            className={`w-full text-left px-6 py-3 hover:bg-blue-50 border-l-4 ${selected === `${parentKey}${item.key}` ? 'border-blue-600 bg-blue-100 font-bold' : 'border-transparent'}`}
            onClick={() => !item.children && setSelected(`${parentKey}${item.key}`)}
            disabled={!!item.children}
          >
            {item.label}
          </button>
          {item.children && (
            <ul className="ml-2">
              {item.children.map(child => (
                <li key={child.key}>
                  <button
                    className={`w-full text-left px-8 py-2 hover:bg-blue-50 border-l-4 ${selected === `${item.key}-${child.key}` ? 'border-blue-600 bg-blue-100 font-bold' : 'border-transparent'}`}
                    onClick={() => setSelected(`${item.key}-${child.key}`)}
                  >
                    {child.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );

  // 右侧内容区渲染
  const renderContent = () => {
    if (selected === 'question-import') {
      // 题库导入
      return (
        <div className="max-w-xl mx-auto mt-12 p-8 bg-white rounded shadow">
          <h1 className="text-2xl font-bold mb-6">题库导入</h1>
          <ImportQuestions />
        </div>
      );
    }
    // 其他菜单内容占位
    return <div className="p-12 text-gray-500">功能开发中：{selected}</div>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {TopNav}
      <div className="flex min-h-[calc(100vh-64px)]">
        <aside className="w-64 bg-white border-r pt-8">
          {renderMenu(menu)}
        </aside>
        <main className="flex-1 p-8">{renderContent()}</main>
      </div>
    </div>
  );
}

// 题库导入组件，复用原有逻辑
function ImportQuestions() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setMessage("请先选择 pmp_questions.json 文件");
      return;
    }
    setLoading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/questions/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setMessage("题库导入成功，共导入 " + data.successCount + " 道题目" + "导入失败" + data.failCount + " 道题目");
      } else {
        setMessage("导入失败：" + (data.message || "未知错误"));
      }
    } catch (err) {
      setMessage("导入请求失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <label className="block mb-2 font-medium">导入题库（pmp_questions.json）</label>
        <input type="file" accept="application/json" onChange={handleFileChange} />
      </div>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        onClick={handleImport}
        disabled={loading}
      >
        {loading ? "导入中..." : "导入题库"}
      </button>
      {message && <div className="mt-4 text-blue-700">{message}</div>}
    </div>
  );
} 