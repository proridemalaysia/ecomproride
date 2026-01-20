"use client"
import { useEffect, useState, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

function ProductsList() {
  const searchParams = useSearchParams()
  const vId = searchParams.get('vId') 
  const { cart, addToCart } = useCart()
  
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('RETAIL')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    
    // 1. Get User Role
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (profile) setUserRole(profile.role)
    }

    // 2. Fetch Data
    let data;
    if (vId) {
      const { data: filteredData } = await supabase
        .from('products')
        .select(`*, product_fitment!inner(vehicle_id), product_variants(*)`)
        .eq('product_fitment.vehicle_id', vId)
        .order('id', { ascending: false });
      data = filteredData;
    } else {
      const { data: allData } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .order('id', { ascending: false });
      data = allData;
    }

    setProducts(data || [])
    setLoading(false)
  }, [vId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans">
      {/* NAVIGATION */}
      <nav className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/90 sticky top-0 z-50 backdrop-blur-md">
        <Link href="/" className="text-xl font-black tracking-tight text-slate-800">
          CHASSIS<span className="text-[#e11d48]">PRO</span>
        </Link>
        <Link href="/checkout" className="bg-slate-900 text-white px-5 py-2 rounded-lg font-bold text-xs flex items-center gap-3 hover:bg-brand-orange transition-all shadow-lg shadow-slate-200">
            Order Cart <span className="bg-[#e11d48] text-white px-2 py-0.5 rounded text-[10px]">{cart.length}</span>
        </Link>
      </nav>

      <main className="p-6 md:p-12 max-w-7xl mx-auto">
        <header className="mb-16 border-l-4 border-brand-orange pl-6">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-800 tracking-tight">
            {vId ? 'Compatible Parts' : 'Product Catalog'}
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            {userRole === 'DEALER' ? "Wholesale Dealer Pricing Active" : "Authorized Performance Inventory"}
          </p>
        </header>

        {loading ? (
          <div className="h-64 flex items-center justify-center font-medium text-slate-300 animate-pulse tracking-widest uppercase text-xs">
            Loading Catalog...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.length === 0 ? (
                <div className="col-span-full py-32 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
                    <p className="text-slate-300 font-bold text-lg">No parts found for this vehicle</p>
                    <Link href="/" className="text-brand-orange font-bold text-sm underline mt-4 block">Search Another Model</Link>
                </div>
            ) : products.map((p) => {
              // Calculate Display Price
              const price = userRole === 'DEALER' ? p.price_b2b : p.price_b2c;
              const hasMinPrice = p.has_variants && p.product_variants?.length > 0;
              const minPrice = hasMinPrice 
                ? Math.min(...p.product_variants.map((v: any) => userRole === 'DEALER' ? v.price_b2b : v.price_b2c)) 
                : price;

              return (
                <div key={p.id} className="bg-white border border-slate-100 p-6 hover:shadow-2xl hover:shadow-slate-200 transition-all group rounded-3xl flex flex-col">
                  <Link href={`/products/${p.id}`} className="flex-1">
                    <div className="aspect-square bg-slate-50 mb-6 flex items-center justify-center p-6 overflow-hidden rounded-2xl relative">
                      <img src={p.image_url} alt={p.name_en} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 mix-blend-multiply" />
                      {p.has_variants && (
                        <span className="absolute top-3 right-3 bg-white/90 border border-slate-100 px-2 py-1 rounded-md text-[8px] font-bold text-slate-400 tracking-tighter uppercase">Multiple Options</span>
                      )}
                    </div>
                    <p className="text-brand-orange text-[10px] font-bold tracking-widest mb-1">{p.brand_name || 'GENUINE'}</p>
                    <h2 className="text-slate-800 font-bold text-lg leading-tight tracking-tight group-hover:text-brand-orange transition-colors">
                      {p.name_en}
                    </h2>
                  </Link>
                  
                  <div className="pt-6 mt-6 border-t border-slate-50 flex justify-between items-end">
                      <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter mb-1">
                            {hasMinPrice ? 'Starting From' : 'Retail Price'}
                        </p>
                        <p className="text-slate-900 font-black text-2xl tracking-tighter">
                          RM {minPrice.toFixed(2)}
                        </p>
                      </div>
                  </div>

                  <Link href={`/products/${p.id}`} className="w-full mt-6 bg-slate-900 text-white text-center py-4 font-bold text-xs tracking-wider hover:bg-brand-orange transition-all rounded-xl shadow-lg shadow-slate-200">
                    View Details
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="bg-[#fcfcfd] min-h-screen"></div>}>
            <ProductsList />
        </Suspense>
    )
}