"use client"

import { useForm } from "react-hook-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { 
  Save, Loader2, ArrowLeft, Settings2, Package, 
  Truck, Globe2 
} from "lucide-react"
import Link from "next/link"

export default function AdminCreateProductPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    defaultValues: { status: 'draft', is_featured: false, is_digital: false }
  })
  
  const { data: catData = [] } = useQuery({ 
    queryKey: ["admin-cats"], 
    queryFn: () => adminApi.categories().then(r => r.data.data) 
  })

  const { data: collections = [] } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: () => adminApi.collections().then(r => r.data.data)
  })

  const { data: vendors = [] } = useQuery({
    queryKey: ["admin-vendors-approved"],
    queryFn: () => adminApi.vendors({ status: 'approved' }).then(r => r.data.data)
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => adminApi.createProduct({
      ...d,
      price: Number(d.price),
      compare_at_price: d.compare_at_price ? Number(d.compare_at_price) : null,
      cost_price: d.cost_price ? Number(d.cost_price) : null,
      stock_quantity: Number(d.stock_quantity),
      weight_grams: d.weight_grams ? Number(d.weight_grams) : null,
      length_mm: d.length_mm ? Number(d.length_mm) : null,
      height_mm: d.height_mm ? Number(d.height_mm) : null,
      width_mm: d.width_mm ? Number(d.width_mm) : null,
    }),
    onSuccess: () => { 
      toast.success("Product created successfully!")
      router.push("/dashboard/products") 
    },
    onError: () => toast.error("Failed to create product"),
  })

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/products" className="btn-secondary w-10 h-10 !p-0 shrink-0 no-underline">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title text-2xl font-bold">New Product</h1>
          <p className="page-subtitle text-slate-500">Add a formal product listing to your catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="card-padded shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-brand-500" />
                General Details
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Product Name *</label>
                    <input {...register("name", { required: true })} className={`input ${errors.name ? 'border-red-400' : ''}`} placeholder="Summer T-Shirt" />
                  </div>
                  <div>
                    <label className="label">Subtitle</label>
                    <input {...register("subtitle")} className="input" placeholder="Breathable cotton blend" />
                  </div>
                  <div>
                    <label className="label">Handle (URL)</label>
                    <input {...register("handle")} className="input font-mono text-xs" placeholder="summer-t-shirt" />
                  </div>
                </div>
                <div>
                   <label className="label">Description</label>
                   <textarea {...register("description")} rows={5} className="input resize-y" />
                </div>
              </div>
            </div>

            <div className="card-padded shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-500" />
                Pricing & Stock
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="label font-bold">Price (₹) *</label>
                  <input type="number" step="0.01" {...register("price", { required: true })} className="input font-bold" />
                </div>
                <div>
                  <label className="label">Compare At</label>
                  <input type="number" step="0.01" {...register("compare_at_price")} className="input" />
                </div>
                <div>
                  <label className="label text-emerald-600">Cost Price</label>
                  <input type="number" step="0.01" {...register("cost_price")} className="input" />
                </div>
                <div>
                  <label className="label">Stock Qty *</label>
                  <input type="number" {...register("stock_quantity", { required: true })} className="input" />
                </div>
                <div>
                  <label className="label">SKU</label>
                   <input {...register("sku")} className="input font-mono text-xs" />
                </div>
              </div>
            </div>

            <div className="card-padded shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand-500" />
                Shipping Dimensions
              </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="label">Weight (g)</label>
                      <input type="number" {...register("weight_grams")} className="input" />
                    </div>
                    <div>
                      <label className="label">Len (mm)</label>
                      <input type="number" {...register("length_mm")} className="input" />
                    </div>
                    <div>
                      <label className="label">Wid (mm)</label>
                      <input type="number" {...register("width_mm")} className="input" />
                    </div>
                    <div>
                      <label className="label">Hei (mm)</label>
                      <input type="number" {...register("height_mm")} className="input" />
                    </div>
                  </div>
                </div>

                {/* Hardware Specification */}
                <div className="card-padded shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-blue-500" />
                    Hardware Specifications
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="label">Brand</label>
                      <input {...register("brand")} className="input" placeholder="e.g. Dell, Intel" />
                    </div>
                    <div>
                      <label className="label">Model</label>
                      <input {...register("model")} className="input" placeholder="e.g. Latitude 5420" />
                    </div>
                    <div>
                      <label className="label">Condition</label>
                      <select {...register("condition")} className="input">
                        <option value="new">New</option>
                        <option value="refurbished">Refurbished</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Processor</label>
                      <input {...register("processor")} className="input" placeholder="e.g. Core i7" />
                    </div>
                    <div>
                      <label className="label">CPU Gen</label>
                      <input {...register("cpu_generation")} className="input" placeholder="e.g. 12th Gen" />
                    </div>
                    <div>
                      <label className="label">GPU</label>
                      <input {...register("gpu")} className="input" placeholder="e.g. RTX 3060" />
                    </div>
                    <div>
                      <label className="label">RAM</label>
                      <input {...register("ram")} className="input" placeholder="e.g. 16GB DDR4" />
                    </div>
                    <div>
                      <label className="label">Storage</label>
                      <input {...register("storage")} className="input" placeholder="e.g. 512GB" />
                    </div>
                    <div>
                      <label className="label">Storage Type</label>
                      <select {...register("storage_type")} className="input">
                        <option value="SSD">SSD</option>
                        <option value="HDD">HDD</option>
                        <option value="NVMe">NVMe</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Display Size</label>
                      <input {...register("display_size")} className="input" placeholder="e.g. 15.6 inch" />
                    </div>
                    <div>
                      <label className="label">OS</label>
                      <input {...register("operating_system")} className="input" placeholder="e.g. Windows 11" />
                    </div>
                    <div>
                      <label className="label">Warranty</label>
                      <input {...register("warranty")} className="input" placeholder="e.g. 1 Year" />
                    </div>
                  </div>
                </div>

                {/* Bulk Pricing */}
                <div className="card-padded shadow-sm border-2 border-emerald-50 bg-emerald-50/10">
                  <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Package className="w-5 h-5 text-emerald-500" />
                    Bulk & Business Pricing
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label">Bulk Price (₹)</label>
                      <input type="number" step="0.01" {...register("bulk_price")} className="input border-emerald-200" placeholder="Price for bulk orders" />
                    </div>
                    <div>
                      <label className="label">Min Bulk Qty</label>
                      <input type="number" {...register("minimum_bulk_quantity")} className="input border-emerald-200" placeholder="10" />
                    </div>
                    <div>
                      <label className="label">Wholesale Price (₹)</label>
                      <input type="number" step="0.01" {...register("wholesale_price")} className="input" />
                    </div>
                  </div>
                </div>

            <div className="card-padded shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-brand-500" />
                Customs
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Origin Country</label>
                  <input {...register("origin_country")} className="input" />
                </div>
                <div>
                  <label className="label">Material</label>
                  <input {...register("material")} className="input" />
                </div>
                <div>
                  <label className="label">HS Code</label>
                  <input {...register("hs_code")} className="input font-mono text-xs" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="card-padded bg-slate-50 border-slate-200">
               <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">Defaults</h3>
               <div className="space-y-4">
                  <div>
                    <label className="label">Status</label>
                    <select {...register("status")} className="input font-bold">
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                    </select>
                  </div>
                   <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" {...register("is_featured")} id="cf" className="w-4 h-4 text-brand-600 focus:ring-brand-500 rounded" />
                    <label htmlFor="cf" className="text-sm font-bold text-slate-700 cursor-pointer">Featured</label>
                  </div>
                   <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" {...register("is_digital")} id="cd" className="w-4 h-4 text-brand-600 focus:ring-brand-500 rounded" />
                    <label htmlFor="cd" className="text-sm font-bold text-slate-700 cursor-pointer">Digital Product</label>
                  </div>
               </div>
            </div>

            <div className="card-padded">
               <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">Organization</h3>
               <div className="space-y-4">
                  <div>
                    <label className="label font-outfit">Vendor *</label>
                    <select {...register("vendor_id", { required: true })} className={`input cursor-pointer ${errors.vendor_id ? 'border-red-400' : ''}`}>
                      <option value="">Select Vendor</option>
                      {(vendors ?? []).map((v: any) => <option key={v.id} value={v.id}>{v.store_name}</option>)}
                    </select>
                    {errors.vendor_id && <p className="text-[10px] text-red-500 mt-1 font-bold italic">Please assign this product to a vendor</p>}
                  </div>
                  <div>
                    <label className="label font-outfit">Category</label>
                    <select {...register("category_id")} className="input cursor-pointer">
                      <option value="">Select Category</option>
                      {(catData ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label font-outfit">Collection</label>
                    <select {...register("collection_id")} className="input cursor-pointer">
                      <option value="">Select Collection</option>
                      {(collections ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
               </div>
            </div>

            <div className="pt-4">
               <button type="submit" disabled={createMutation.isPending} 
                className="btn-primary w-full h-14 justify-center text-lg shadow-xl shadow-brand-100">
                {createMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                Publish Product
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
