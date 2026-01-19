"use client"
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

function ProductsList() {
  const searchParams = useSearchParams()
  const vId = searchParams.get('vId') // Get Vehicle ID from URL
  const { cart, addToCart } = useCart()
  
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('RETAIL')

  useEffect(() => {
    async function init() {
      setLoading(true)
      
      // 1. Get User Role
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
        if (profile) setUserRole(profile.role)
      }

      // 2. FETCH PRODUCTS
      let data;
      if (vId) {
        // If searching for a car, join with product_fitment
        const { data: filteredData, error } = await supabase
          .from('products')
          .select(`*, product_fitment!inner(vehicle_id), product_variants(*)`)
          .eq('product_fitment.vehicle_id', vId)
          .order('id', { ascending: false });
        data = filteredData;
        if (error) console.error("Filter Error:", error);
      } else {
        // If just browsing, fetch all
        const { data: allData } = await supabase
          .from('products')
          .select('*, product_variants(*)')
          .order('id', { ascending: false });
        data = allData;
      }

      setProducts(data || [])
      setLoading(false)
    }
    init()
  }, [vId])

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans uppercase">
      {/* NAVIGATION */}
      <nav className="p-6 border-b border-slate-200 flex justify-between items-center bg-white/80 sticky top-0 z-50 backdrop-blur-md">
        <Link href="/" className="text-2xl font-black italic tracking-tighter text-slate-900 leading-none">
          CHASSIS <span className="text-[#e11d48]">PRO</span>
        </Link>
        <Link href="/checkout" className="bg-[#0f172a] text-white px-6 py-2 font-black italic text-xs rounded-sm hover:bg-[#f97316] transition-all">
            CART ({cart.length})
        </Link>
      </nav>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="mb-12 border-l-8 border-[#e11d48] pl-6 py-2">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-slate-900">
            {vId ? 'COMPATIBLE' : 'ALL'} <span className="text-[#f97316] opacity-80">PARTS</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-bold tracking-[0.4em] mt-2 uppercase">
            {userRole === 'DEALER' ? "✓ Dealer Wholesale Net Active" : "Authorized Specialist Inventory"}
          </p>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center italic animate-pulse font-black text-slate-300 tracking-widest">SYNCHRONIZING HUB...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.length === 0 ? (
                <div className="col-span-full py-32 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-slate-300 font-black italic text-xl">NO COMPATIBLE PARTS FOUND</p>
                    <Link href="/" className="text-[#f97316] text-xs font-bold underline mt-4 block">TRY ANOTHER CAR MODEL</Link>
                </div>
            ) : products.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 p-8 hover:border-[#f97316] transition-all group relative overflow-hidden rounded-xl shadow-sm flex flex-col">
                <Link href={`/products/${p.id}`} className="flex-1 flex flex-col">
                  <div className="aspect-square bg-slate-50 mb-8 flex items-center justify-center p-8 overflow-hidden rounded-lg">
                    <img src={p.image_url} alt={p.name_en} className="w-full h-full object-contain group-hover:scale-110 transition-all duration-700 mix-blend-multiply" />
                  </div>
                  <p className="text-[#f97316] text-[10px] font-black tracking-[0.2em] mb-2 italic">{p.brand_name}</p>
                  <h2 className="text-slate-900 font-black text-lg h-14 leading-tight truncate tracking-tight">{p.name_en}</h2>
                </Link>
                
                <div className="border-t border-slate-100 pt-6 mt-6">
                    <p className="text-slate-400 text-[10px] font-black uppercase italic mb-1">Total</p>
                    <p className="text-slate-900 font-black text-3xl tracking-tighter italic leading-none">
                      RM {userRole === 'DEALER' ? p.price_b2b.toFixed(2) : p.price_b2c.toFixed(2)}
                    </p>
                </div>
                <button onClick={() => addToCart(p, userRole === 'DEALER' ? p.price_b2b : p.price_b2c)} className="w-full mt-6 bg-[#0f172a] text-white font-black py-4 uppercase text-[10px] tracking-[0.2em] hover:bg-[#f97316] transition-all italic rounded-sm">Quick Add</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="bg-[#f8fafc] min-h-screen"></div>}>
            <ProductsList />
        </Suspense>
    )
}