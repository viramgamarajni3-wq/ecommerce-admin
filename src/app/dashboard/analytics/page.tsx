"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { adminApi } from "@/lib/api"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts"
import { TrendingUp, ShoppingBag, Users, Wallet, Store } from "lucide-react"

const TOOLTIP_STYLE = { background: "#1e293b", border: "none", borderRadius: 10, color: "#f8fafc", fontSize: 12 }
const PIE_COLORS = ["#f97316","#3b82f6","#10b981","#8b5cf6","#f59e0b"]

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => adminApi.analytics().then(r => r.data.data),
  })

  const kpis = [
    { label: "Total Revenue",    value: `₹${Number(data?.revenue?.total ?? 0).toLocaleString("en-IN")}`, change: "+18%",  grad: "from-brand-500 to-brand-600",   icon: TrendingUp },
    { label: "Total Orders",     value: String(data?.orders?.total ?? 0),                                 change: "+12%",  grad: "from-blue-500 to-indigo-600",   icon: ShoppingBag },
    { label: "Users",            value: String(data?.users?.total ?? 0),                                  change: "+23%",  grad: "from-emerald-500 to-teal-600",  icon: Users },
    { label: "Active Vendors",   value: String(data?.vendors?.active ?? 0),                               change: "+9%",   grad: "from-violet-500 to-purple-600", icon: Store },
    { label: "Pending Payouts",  value: `₹${Number(data?.payouts?.pending_amount ?? 0).toLocaleString("en-IN")}`, change: "", grad: "from-amber-500 to-orange-500",  icon: Wallet },
  ]

  const revenueChart = data?.revenueByMonth ?? [
    { month:"Oct",revenue:38000 },{ month:"Nov",revenue:55000 },{ month:"Dec",revenue:92000 },
    { month:"Jan",revenue:73000 },{ month:"Feb",revenue:85000 },{ month:"Mar",revenue:120000 },
  ]

  const orderStatusChart = data?.ordersByStatus ?? [
    { name:"Pending",value:24 },{ name:"Confirmed",value:18 },{ name:"Shipped",value:30 },
    { name:"Delivered",value:45 },{ name:"Cancelled",value:8 },
  ]

  const topVendorsChart = data?.topVendors ?? [
    { name:"TechHub",revenue:82000 },{ name:"FashionKing",revenue:61000 },{ name:"ElectroZone",revenue:49000 },
    { name:"StyleCo",revenue:37000 },{ name:"GadgetPro",revenue:28000 },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Platform performance overview</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {kpis.map(({ label, value, change, grad, icon: Icon }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`stat-card bg-gradient-to-br ${grad}`}>
            <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="stat-card-value text-2xl">{value}</div>
            <div className="stat-card-label">{label}</div>
            {change && (
              <div className="absolute top-4 right-4 bg-white/20 px-2 py-0.5 rounded-lg text-xs font-bold">
                {change}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="card-padded lg:col-span-2">
          <h3 className="font-bold text-slate-800 mb-1">Revenue Trend</h3>
          <p className="text-xs text-slate-400 mb-5">Monthly revenue (₹)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-padded">
          <h3 className="font-bold text-slate-800 mb-1">Orders by Status</h3>
          <p className="text-xs text-slate-400 mb-5">Distribution</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderStatusChart} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {orderStatusChart.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="card-padded">
        <h3 className="font-bold text-slate-800 mb-1">Top Vendors by Revenue</h3>
        <p className="text-xs text-slate-400 mb-5">Platform top performers</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topVendorsChart} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#f97316" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
