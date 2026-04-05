"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Users, Store, Package, ShoppingBag, TrendingUp,
  DollarSign, AlertCircle, CheckCircle, Clock,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts"
import { adminApi } from "@/lib/api"
import { format } from "date-fns"

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#f43f5e"]

const revenueData = [
  { month: "Oct", revenue: 120000, orders: 85 },
  { month: "Nov", revenue: 180000, orders: 132 },
  { month: "Dec", revenue: 250000, orders: 198 },
  { month: "Jan", revenue: 160000, orders: 115 },
  { month: "Feb", revenue: 210000, orders: 156 },
  { month: "Mar", revenue: 290000, orders: 224 },
]

const categoryData = [
  { name: "Electronics", value: 35 },
  { name: "Fashion", value: 25 },
  { name: "Home", value: 20 },
  { name: "Books", value: 10 },
  { name: "Other", value: 10 },
]

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => adminApi.analytics().then(r => r.data.data),
  })

  const kpis = [
    {
      icon: DollarSign,
      label: "Total Revenue",
      value: `₹${Number(data?.revenue?.total_revenue || 0).toLocaleString("en-IN")}`,
      sub: `₹${Number(data?.revenue?.monthly_revenue || 0).toLocaleString("en-IN")} this month`,
      color: "from-brand-500 to-orange-600",
    },
    {
      icon: ShoppingBag,
      label: "Total Orders",
      value: data?.orders?.total_orders ?? "—",
      sub: `${data?.orders?.this_month ?? 0} this month`,
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: Users,
      label: "Customers",
      value: data?.users?.count ?? "—",
      sub: "Registered accounts",
      color: "from-emerald-500 to-teal-600",
    },
    {
      icon: Store,
      label: "Active Vendors",
      value: data?.vendors?.find((v: any) => v.status === "approved")?.count ?? "—",
      sub: `${data?.vendors?.find((v: any) => v.status === "pending")?.count ?? 0} pending`,
      color: "from-purple-500 to-violet-600",
    },
  ]

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative overflow-hidden rounded-2xl p-6 text-white"
            style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color}`} />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-xl bg-white/20">
                  <kpi.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-display font-bold">{kpi.value}</p>
              <p className="text-sm font-semibold mt-1 text-white/90">{kpi.label}</p>
              <p className="text-xs text-white/60 mt-0.5">{kpi.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue + Orders chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-900 mb-6">Revenue & Orders</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                formatter={(v: any) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5}
                fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-900 mb-6">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                paddingAngle={3} dataKey="value">
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: "10px", color: "#f8fafc", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {categoryData.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-slate-600">{cat.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <h3 className="font-display font-bold text-lg text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Clock, label: "Approve Vendors", href: "/dashboard/vendors?status=pending", color: "text-orange-600 bg-orange-50", badge: data?.vendors?.find((v: any) => v.status === "pending")?.count },
            { icon: CheckCircle, label: "Pending Payouts", href: "/dashboard/payouts", color: "text-blue-600 bg-blue-50" },
            { icon: Package, label: "Manage Products", href: "/dashboard/products", color: "text-emerald-600 bg-emerald-50" },
            { icon: AlertCircle, label: "Admin Settings", href: "/dashboard/settings", color: "text-purple-600 bg-purple-50" },
          ].map(({ icon: Icon, label, href, color, badge }) => (
            <a key={label} href={href}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-slate-100
                hover:border-brand-200 hover:shadow-md transition-all text-center group">
              <div className={`relative p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
                {badge && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-slate-700">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
