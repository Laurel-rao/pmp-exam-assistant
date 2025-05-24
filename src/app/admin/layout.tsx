"use client"

import AdminLayout from "@/components/AdminLayout"

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
} 