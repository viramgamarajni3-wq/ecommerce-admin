"use client"

import { ReactNode, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Store, Package, ShoppingBag, Tags, Tag,
  Wallet, Users, BarChart3, Settings, LogOut, Bell, Menu,
  ChevronRight, Shield, FolderOpen, Gift, Globe, Truck,
  Percent, BoxesIcon, ChevronDown, RefreshCw, FileText,
  Monitor, DollarSign, User2, Key, ArrowLeftRight, Percent as TaxIcon,
  AlertTriangle, CreditCard,
} from "lucide-react"
import { signOut, useSession } from "next-auth/react"

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",      href: "/dashboard",                color: "#f97316" },
      { icon: BarChart3,       label: "Analytics",      href: "/dashboard/analytics",      color: "#a78bfa" },
      { icon: Bell,            label: "Notifications",  href: "/dashboard/notifications",  color: "#ef4444" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { icon: Package,     label: "Products",     href: "/dashboard/products",     color: "#3b82f6" },
      { icon: FolderOpen,  label: "Collections",  href: "/dashboard/collections",  color: "#10b981" },
      { icon: Tags,        label: "Categories",   href: "/dashboard/categories",   color: "#f59e0b" },
      { icon: Tag,         label: "Product Tags", href: "/dashboard/tags",         color: "#d946ef" },
      { icon: Globe,       label: "Variant Images", href: "/dashboard/variant-images", color: "#10b981" },
      { icon: BoxesIcon,   label: "Inventory",    href: "/dashboard/inventory",    color: "#06b6d4" },
      { icon: DollarSign,  label: "Price Lists",  href: "/dashboard/price-lists",  color: "#8b5cf6" },
    ],
  },
  {
    label: "Sales",
    items: [
      { icon: ShoppingBag,    label: "Orders",          href: "/dashboard/orders",          color: "#8b5cf6" },
      { icon: FileText,       label: "Draft Orders",    href: "/dashboard/draft-orders",    color: "#64748b" },
      { icon: RefreshCw,      label: "Returns",         href: "/dashboard/returns",         color: "#ef4444" },
      { icon: ArrowLeftRight, label: "Swaps",           href: "/dashboard/swaps",           color: "#f59e0b" },
      { icon: AlertTriangle,  label: "Claims",          href: "/dashboard/claims",          color: "#dc2626" },
      { icon: Users,          label: "Customers",       href: "/dashboard/customers",       color: "#ec4899" },
      { icon: User2,          label: "Customer Groups", href: "/dashboard/customer-groups", color: "#d946ef" },
      { icon: Store,          label: "Vendors",         href: "/dashboard/vendors",         color: "#0ea5e9" },
      { icon: Monitor,        label: "Sales Channels",  href: "/dashboard/sales-channels",  color: "#14b8a6" },
    ],
  },
  {
    label: "Promotions",
    items: [
      { icon: Percent,  label: "Discounts",   href: "/dashboard/discounts",   color: "#f43f5e" },
      { icon: Gift,     label: "Gift Cards",  href: "/dashboard/gift-cards",  color: "#d946ef" },
    ],
  },
  {
    label: "Finance",
    items: [
      { icon: Wallet, label: "Payouts",  href: "/dashboard/payouts",  color: "#14b8a6" },
    ],
  },
  {
    label: "Configuration",
    items: [
      { icon: Globe,      label: "Regions",    href: "/dashboard/regions",    color: "#6366f1" },
      { icon: Truck,      label: "Shipping",   href: "/dashboard/shipping",   color: "#8b5cf6" },
      { icon: TaxIcon,    label: "Taxes",      href: "/dashboard/taxes",      color: "#f97316" },
      { icon: CreditCard, label: "Providers",  href: "/dashboard/providers",  color: "#10b981" },
      { icon: Key,        label: "API Keys",   href: "/dashboard/api-keys",   color: "#0ea5e9" },
      { icon: User2,      label: "Users",      href: "/dashboard/users",      color: "#94a3b8" },
      { icon: Settings,  label: "Settings",   href: "/dashboard/settings",   color: "#64748b" },
    ],
  },
]


const SIDEBAR_BG     = "#0b0f1a"
const SIDEBAR_BORDER = "rgba(255,255,255,0.07)"
const ACTIVE_BG      = "rgba(249,115,22,0.15)"
const ACTIVE_BORDER  = "rgba(249,115,22,0.4)"
const ACTIVE_TEXT    = "#fb923c"
const INACTIVE_TEXT  = "rgba(255,255,255,0.55)"
const HOVER_BG       = "rgba(255,255,255,0.06)"

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { status, data } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<string[]>([])
  const isAuthPage = pathname.startsWith("/auth")

  useEffect(() => {
    if (status === "loading") return
    const role = (data?.user as any)?.role
    if (!isAuthPage && status === "unauthenticated") router.replace("/auth/login")
    if (!isAuthPage && role && role !== "admin") router.replace("/auth/login")
    if (isAuthPage && status === "authenticated" && role === "admin") router.replace("/dashboard")
  }, [status, isAuthPage, router, data])

  if (isAuthPage) return <>{children}</>
  if (status === "loading") return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Loading...</div>

  const currentLabel = NAV_GROUPS.flatMap(g => g.items)
    .find(l => l.href === pathname || (l.href !== "/dashboard" && pathname.startsWith(l.href)))?.label ?? "Dashboard"

  const toggleGroup = (label: string) =>
    setCollapsed(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label])

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: "20px 16px 18px", borderBottom: `1px solid ${SIDEBAR_BORDER}`, display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #f97316, #dc2626)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(249,115,22,0.35)" }}>
          <Shield style={{ width: 18, height: 18, color: "white" }} />
        </div>
        <div>
          <div style={{ color: "white", fontWeight: 700, fontSize: 17, fontFamily: "var(--font-outfit,sans-serif)", lineHeight: 1.1 }}>Admin</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>ShopHub Control</div>
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
        {NAV_GROUPS.map(group => {
          const isCollapsed = collapsed.includes(group.label)
          return (
            <div key={group.label} style={{ marginBottom: 4 }}>
              <button
                onClick={() => toggleGroup(group.label)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "6px 10px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                {group.label}
                <ChevronDown style={{ width: 12, height: 12, transform: isCollapsed ? "rotate(-90deg)" : "none", transition: "transform 0.2s" }} />
              </button>

              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    {group.items.map(({ icon: Icon, label, href, color }) => {
                      const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                      return (
                        <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{ textDecoration: "none" }}>
                          <motion.div
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9, marginBottom: 2, cursor: "pointer", background: isActive ? ACTIVE_BG : "transparent", border: isActive ? `1px solid ${ACTIVE_BORDER}` : "1px solid transparent", transition: "all 0.15s" }}
                            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = HOVER_BG }}
                            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent" }}
                          >
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: isActive ? `${color}22` : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Icon style={{ width: 14, height: 14, color: isActive ? color : "rgba(255,255,255,0.45)" }} />
                            </div>
                            <span style={{ color: isActive ? ACTIVE_TEXT : INACTIVE_TEXT, fontSize: 13, fontWeight: isActive ? 700 : 500, flex: 1 }}>{label}</span>
                            {isActive && <ChevronRight style={{ width: 12, height: 12, color: ACTIVE_TEXT }} />}
                          </motion.div>
                        </Link>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "10px", borderTop: `1px solid ${SIDEBAR_BORDER}` }}>
        <div style={{ borderRadius: 10, padding: "12px 14px", marginBottom: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.18)" }}>
          <div style={{ color: "#fca5a5", fontWeight: 700, fontSize: 12, marginBottom: 2 }}>🛡️ Super Admin</div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>Full platform access</div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 10px", borderRadius: 9, border: "none", background: "transparent", cursor: "pointer", color: "#f87171", fontSize: 13, fontWeight: 500 }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
          <LogOut style={{ width: 14, height: 14 }} /> Sign Out
        </button>
      </div>
    </>
  )

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f8fafc" }}>

      {/* Desktop Sidebar */}
      <aside style={{ width: 240, background: SIDEBAR_BG, display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh", boxShadow: "4px 0 24px rgba(0,0,0,0.25)" }} className="hidden md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40, backdropFilter: "blur(4px)" }} />
            <motion.aside initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 240, background: SIDEBAR_BG, display: "flex", flexDirection: "column", zIndex: 50, boxShadow: "8px 0 32px rgba(0,0,0,0.4)" }}>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Topbar */}
        <header style={{ height: 60, background: "white", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setMobileOpen(true)} className="md:hidden"
              style={{ padding: 7, borderRadius: 8, border: "none", background: "#f8fafc", cursor: "pointer", display: "flex" }}>
              <Menu style={{ width: 18, height: 18, color: "#475569" }} />
            </button>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#0f172a", fontFamily: "var(--font-outfit,sans-serif)" }}>{currentLabel}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Platform Administrator</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button style={{ position: "relative", padding: 7, borderRadius: 9, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", display: "flex", color: "#64748b" }}>
              <Bell style={{ width: 17, height: 17 }} />
              <span style={{ position: "absolute", top: 5, right: 5, width: 7, height: 7, borderRadius: "50%", background: "#ef4444", border: "2px solid white" }} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 9, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #f97316, #dc2626)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 12 }}>A</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Super Admin</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>admin@shophub.in</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
