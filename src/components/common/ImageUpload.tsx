"use client"

import { useState, useRef } from "react"
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"

interface ImageUploadProps {
  productId?: string
  onUploadSuccess: (url: string) => void
  label?: string
  initialPreview?: string
}

export function ImageUpload({ productId, onUploadSuccess, label = "Upload Image", initialPreview }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(initialPreview || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    // Actually upload if productId is provided
    if (productId) {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("images", file)

      try {
        // We use a custom axios instance or raw axios if adminApi doesn't support multipart easily
        // But our adminApi uses 'api' which is an axios instance.
        // We can use it directly.
        const res = await adminApi.uploadProductImages(productId, formData)
        const newUrl = res.data.data[0].url
        onUploadSuccess(newUrl)
        toast.success("Image uploaded successfully!")
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Upload failed")
      } finally {
        setIsUploading(false)
      }
    } else {
        // If no productId, just pass back the file data (for new product creation etc)
        // However, for simplicity, we usually upload to a product first.
        // Let's assume for now we always have a product ID for variant images.
        toast.error("Product ID required for server upload")
    }
  }

  return (
    <div className="space-y-2">
      <label className="label">{label}</label>
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="relative aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-brand-300 transition-all group overflow-hidden"
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="w-8 h-8 text-white" />
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center text-slate-400 group-hover:text-brand-500">
            <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Click to Upload</span>
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />
    </div>
  )
}

// Add upload method to adminApi if not already there
// Checking apps/admin/src/lib/api.ts for existing upload method...
