import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PMP考试题库",
  description: "专业的PMP考试备考系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={cn(inter.className, "min-h-screen bg-background")}>
        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <div className="mr-4 flex">
                <a className="mr-6 flex items-center space-x-2" href="/">
                  <span className="font-bold inline-block">PMP题库</span>
                </a>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                  <a className="transition-colors hover:text-foreground/80" href="/practice">练习模式</a>
                  <a className="transition-colors hover:text-foreground/80" href="/exam">考试模式</a>
                  <a className="transition-colors hover:text-foreground/80" href="/wrong">错题本</a>
                  <a className="transition-colors hover:text-foreground/80" href="/favorites">收藏夹</a>
                </nav>
              </div>
            </div>
          </header>
          <main className="flex-1">
            <div className="container py-6">
              {children}
            </div>
          </main>
          <footer className="border-t py-6 md:py-0">
            <div className="container flex h-14 items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Built with Next.js and Shadcn UI
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
} 