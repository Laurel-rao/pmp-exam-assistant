import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
          PMP考试题库系统
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-gray-500 md:text-xl">
          专业的PMP考试备考系统，助你一臂之力
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>练习模式</CardTitle>
            <CardDescription>按照知识领域练习，掌握重点难点</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end">
              <Button asChild>
                <Link href="/practice">开始练习</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>考试模式</CardTitle>
            <CardDescription>模拟真实考试环境，提前适应考试节奏</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end">
              <Button asChild>
                <Link href="/exam">开始考试</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>错题本</CardTitle>
            <CardDescription>记录错题，查漏补缺</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end">
              <Button asChild variant="secondary">
                <Link href="/wrong">查看错题</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold tracking-tight">学习数据</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>总题数</CardTitle>
              <CardDescription>180</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>已练习</CardTitle>
              <CardDescription>0</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>正确率</CardTitle>
              <CardDescription>0%</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>收藏题目</CardTitle>
              <CardDescription>0</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
} 