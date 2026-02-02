"use client"
import { useEffect, useState, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

function ProductsList() {
  const searchParams = useSearchParams()
  const vId = searchParams.get('vId') 
  const { cart } = useCart()
  const [products, setProducts] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [userRole, setUserRole] = useState('RETAIL')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (profile) setUserRole(profile.role)
    }
    const { data } = vId 
      ? await supabase.from('products').select(`*, product_fitment!inner(vehicle_id)`).eq('product_fitment.vehicle_id', vId)
      : await supabase.from('products').select('*');
    setProducts(data || []); setLoading(false)
  }, [vId])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <nav className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/80 sticky top-0 z-50 backdrop-blur-md px-10">
        <Link href="/" className="flex items-center gap-3">
          <img src="https://vaqlsjjkcctuwrskssga.supabase.co/storage/v1/object/public/logo/KEsq.png" className="h-8 w-auto" alt="KE" />
          <span className="text-xl font-bold tracking-tight text-slate-800">Chassis<span className="text-blue-600">Pro</span></span>
        </Link>
        <Link href="/checkout" className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold text-xs">Cart ({cart.length})</Link>
      </nav>

      <main className="p-10 max-w-7xl mx-auto">
        <header className="mb-12 border-l-4 border-blue-600 pl-6">
          <h1 className="text-4xl font-bold text-slate-800">{vId ? 'Compatible Parts' : 'Product Catalog'}</h1>
          <p className="text-slate-400 text-sm mt-1">{userRole === 'DEALER' ? "Wholesale Pricing Active" : "Professional Suspension Inventory"}</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {products.map((p) => (
            <div key={p.id} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] hover:shadow-2xl transition-all flex flex-col shadow-sm">
                <Link href={`/products/${p.id}`} className="flex-1">
                  <div className="aspect-square bg-slate-50 mb-6 flex items-center justify-center p-8 rounded-3xl">
                    <img src={p.image_url} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <p className="text-blue-600 text-[10px] font-bold tracking-widest uppercase mb-1">{p.brand_name}</p>
                  <h2 className="text-slate-800 font-bold text-lg leading-tight mb-4">{p.name_en}</h2>
                </Link>
                <div className="pt-6 border-t border-slate-50">
                    <p className="text-slate-900 font-black text-2xl tracking-tight">RM {(userRole === 'DEALER' ? p.price_b2b : p.price_b2c).toFixed(2)}</p>
                </div>
                <Link href={`/products/${p.id}`} className="w-full mt-6 bg-slate-900 text-white text-center py-4 rounded-xl font-bold text-xs hover:bg-blue-600 transition-all">View Details</Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default function ProductsPage() { return (<Suspense fallback={<div className="bg-white min-h-screen"></div>}><ProductsList /></Suspense>) }