import axios from "axios"
import { getSession, signOut } from "next-auth/react"

let raw_api_url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1"

if (!raw_api_url || raw_api_url.trim() === "") {
  raw_api_url = "http://localhost:9000/api/v1"
} else if (!raw_api_url.startsWith('http')) {
  raw_api_url = `https://${raw_api_url}`
}

const API_URL = raw_api_url.replace(/\/+$/, "") + "/"

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
})

api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    // Priority: Next-Auth Session (most reliable)
    const session = await getSession()
    let token = (session as any)?.accessToken || (session?.user as any)?.accessToken

    // Fallback: localStorage (only if session isn't available)
    if (!token) {
      token = localStorage.getItem("accessToken")
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      console.warn("Session expired or unauthorized, clearing state & signing out...")
      localStorage.removeItem("accessToken")
      
      // Clear NextAuth session and redirect
      if (!window.location.pathname.startsWith("/auth")) {
        await signOut({ redirect: true, callbackUrl: "/auth/login" })
      }
    }
    return Promise.reject(error)
  }
)

// ─── Admin API ───────────────────────────────────────────────────────────────
export const adminApi = {
  // Dashboard / analytics
  analytics: () => api.get("admin/analytics"),
  settings: () => api.get("admin/settings"),
  updateSettings: (data: any) => api.patch("admin/settings", data),

  // Vendors
  vendors: (params?: any) => api.get("admin/vendors", { params }),
  getVendor: (id: string) => api.get(`admin/vendors/${id}`),
  approveVendor: (id: string) => api.patch(`admin/vendors/${id}/approve`),
  suspendVendor: (id: string) => api.patch(`admin/vendors/${id}/suspend`),
  resetVendorPassword: (id: string, newPassword: string) => api.patch(`admin/vendors/${id}/reset-password`, { newPassword }),

  // Products
  products: (params?: any) => api.get("admin/products", { params }),
  createProduct: (data: any) => api.post("admin/products", data),
  updateProduct: (id: string, data: any) => api.patch(`admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`admin/products/${id}`),
  getProduct: (id: string) => api.get(`admin/products/${id}`),

  // Product Variants & Options
  addProductOption: (productId: string, data: any) => api.post(`admin/products/${productId}/options`, data),
  updateProductOption: (productId: string, optId: string, data: any) => api.patch(`admin/products/${productId}/options/${optId}`, data),
  deleteProductOption: (productId: string, optId: string) => api.delete(`admin/products/${productId}/options/${optId}`),
  addProductVariant: (productId: string, data: any) => api.post(`admin/products/${productId}/variants`, data),
  updateProductVariant: (productId: string, variantId: string, data: any) => api.patch(`admin/products/${productId}/variants/${variantId}`, data),
  deleteProductVariant: (productId: string, variantId: string) => api.delete(`admin/products/${productId}/variants/${variantId}`),
  getVariantImages: (productId: string, variantId: string) => api.get(`admin/products/${productId}/variants/${variantId}/images`),
  linkVariantImages: (productId: string, variantId: string, imageIds: string[]) => 
    api.post(`admin/products/${productId}/variants/${variantId}/images`, { image_ids: imageIds }),
  unlinkVariantImage: (productId: string, variantId: string, imageId: string) => 
    api.delete(`admin/products/${productId}/variants/${variantId}/images/${imageId}`),

  // Collections
  collections: () => api.get("admin/collections"),
  createCollection: (data: any) => api.post("admin/collections", data),
  deleteCollection: (id: string) => api.delete(`admin/collections/${id}`),

  // Categories
  categories: () => api.get("admin/categories"),
  createCategory: (data: any) => api.post("admin/categories", data),
  updateCategory: (id: string, data: any) => api.patch(`admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`admin/categories/${id}`),

  // Orders
  orders: (params?: any) => api.get("admin/orders", { params }),
  getOrder: (id: string) => api.get(`admin/orders/${id}`),
  updateOrderStatus: (id: string, status: string) => api.patch(`admin/orders/${id}/status`, { status }),
  refundOrder: (id: string) => api.post(`admin/orders/${id}/refund`),

  // Draft Orders
  draftOrders: () => api.get("admin/draft-orders"),
  createDraftOrder: (data: any) => api.post("admin/draft-orders", data),
  completeDraftOrder: (id: string) => api.post(`admin/draft-orders/${id}/complete`),
  deleteDraftOrder: (id: string) => api.delete(`admin/draft-orders/${id}`),

  // Returns & Refunds
  returns: (params?: any) => api.get("admin/returns", { params }),
  updateReturn: (id: string, status: string) => api.patch(`admin/returns/${id}`, { status }),
  refundReturn: (id: string) => api.post(`admin/returns/${id}/refund`),

  // Customers
  customers: (params?: any) => api.get("admin/customers", { params }),
  getCustomer: (id: string) => api.get(`admin/customers/${id}`),
  updateCustomer: (id: string, data: any) => api.patch(`admin/customers/${id}`, data),

  // Users (admin accounts)
  users: (params?: any) => api.get("admin/users", { params }),
  updateUserRole: (id: string, role: string) => api.patch(`admin/users/${id}/role`, { role }),

  // Payouts
  payouts: () => api.get("admin/payouts"),
  completePayout: (id: string, razorpayPayoutId?: string) =>
    api.patch(`admin/payouts/${id}/complete`, { razorpayPayoutId }),

  // Discounts
  discounts: () => api.get("admin/discounts"),
  createDiscount: (data: any) => api.post("admin/discounts", data),
  deleteDiscount: (id: string) => api.delete(`admin/discounts/${id}`),
  toggleDiscount: (id: string, state: boolean) => api.patch(`admin/discounts/${id}/toggle`, { is_active: state }),

  // Gift Cards
  giftCards: () => api.get("admin/gift-cards"),
  createGiftCard: (data: any) => api.post("admin/gift-cards", data),
  deleteGiftCard: (id: string) => api.delete(`admin/gift-cards/${id}`),

  // Inventory
  inventory: () => api.get("admin/inventory"),
  updateStock: (productId: string, qty: number) => api.patch(`admin/inventory/${productId}`, { stock_quantity: qty }),

  // Price Lists
  priceLists: () => api.get("admin/price-lists"),
  createPriceList: (data: any) => api.post("admin/price-lists", data),
  deletePriceList: (id: string) => api.delete(`admin/price-lists/${id}`),
  addPriceListPrice: (listId: string, data: any) => api.post(`admin/price-lists/${listId}/prices`, data),
  deletePriceListPrice: (listId: string, priceId: string) => api.delete(`admin/price-lists/${listId}/prices/${priceId}`),

  // Sales Channels
  salesChannels: () => api.get("admin/sales-channels"),
  createSalesChannel: (data: any) => api.post("admin/sales-channels", data),
  deleteSalesChannel: (id: string) => api.delete(`admin/sales-channels/${id}`),
  toggleSalesChannel: (id: string, active: boolean) => api.patch(`admin/sales-channels/${id}`, { is_active: active }),

  // Regions
  regions: () => api.get("admin/regions"),
  createRegion: (data: any) => api.post("admin/regions", data),
  updateRegion: (id: string, data: any) => api.patch(`admin/regions/${id}`, data),
  deleteRegion: (id: string) => api.delete(`admin/regions/${id}`),

  // Shipping
  shippingOptions: () => api.get("admin/shipping-options"),
  createShippingOption: (data: any) => api.post("admin/shipping-options", data),
  deleteShippingOption: (id: string) => api.delete(`admin/shipping-options/${id}`),

  // Tax Rates (detailed, per-region)
  taxRates: () => api.get("admin/tax-rates"),
  createTaxRate: (data: any) => api.post("admin/tax-rates", data),
  updateTaxRate: (id: string, data: any) => api.patch(`admin/tax-rates/${id}`, data),
  deleteTaxRate: (id: string) => api.delete(`admin/tax-rates/${id}`),

  // Swaps / Exchanges
  swaps: (params?: any) => api.get("admin/swaps", { params }),
  updateSwap: (id: string, status: string) => api.patch(`admin/swaps/${id}`, { status }),

  // Customer Groups
  customerGroups: () => api.get("admin/customer-groups"),
  createCustomerGroup: (data: any) => api.post("admin/customer-groups", data),
  updateCustomerGroup: (id: string, data: any) => api.patch(`admin/customer-groups/${id}`, data),
  deleteCustomerGroup: (id: string) => api.delete(`admin/customer-groups/${id}`),

  // API Keys (Publishable)
  apiKeys: () => api.get("admin/api-keys"),
  createApiKey: (data: any) => api.post("admin/api-keys", data),
  revokeApiKey: (id: string) => api.post(`admin/api-keys/${id}/revoke`),
  deleteApiKey: (id: string) => api.delete(`admin/api-keys/${id}`),

  // Notifications
  notifications: (params?: any) => api.get("admin/notifications", { params }),
  markNotificationRead: (id: string) => api.patch(`admin/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch("admin/notifications/read-all"),
  deleteNotification: (id: string) => api.delete(`admin/notifications/${id}`),

  // Claims (Warranty / Damage)
  claims: (params?: any) => api.get("admin/claims", { params }),
  updateClaim: (id: string, status: string) => api.patch(`admin/claims/${id}`, { status }),

  // Product Tags
  tags: () => api.get("admin/tags"),
  createTag: (data: any) => api.post("admin/tags", data),
  updateTag: (id: string, data: any) => api.patch(`admin/tags/${id}`, data),
  deleteTag: (id: string) => api.delete(`admin/tags/${id}`),

  // Fulfillment Providers
  fulfillmentProviders: () => api.get("admin/fulfillment-providers"),
  createFulfillmentProvider: (data: any) => api.post("admin/fulfillment-providers", data),
  deleteFulfillmentProvider: (id: string) => api.delete(`admin/fulfillment-providers/${id}`),

  // Payment Providers
  paymentProviders: () => api.get("admin/payment-providers"),
  togglePaymentProvider: (id: string, active: boolean) => api.patch(`admin/payment-providers/${id}`, { is_active: active }),

  // Image Uploads
  uploadProductImages: (productId: string, formData: FormData) => 
    api.post(`uploads/product-images/${productId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  deleteProductImage: (imageId: string) => api.delete(`uploads/product-image/${imageId}`),
}
