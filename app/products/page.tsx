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
  
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('RETAIL')
  const [user, setUser] = useState<any>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    
    // 1. Check Auth & Role
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUser(session.user)
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (profile) setUserRole(profile.role)
    }

    // 2. Fetch Inventory
    let data;
    if (vId) {
      // Filter by Vehicle Fitment
      const { data: filteredData } = await supabase
        .from('products')
        .select(`*, product_fitment!inner(vehicle_id), product_variants(*)`)
        .eq('product_fitment.vehicle_id', vId)
        .order('id', { ascending: false });
      data = filteredData;
    } else {
      // Show All
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans">
      {/* NAVIGATION BAR */}
      <nav className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/90 sticky top-0 z-50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3 group">
            <img 
                src="https://vaqlsjjkcctuwrskssga.supabase.co/storage/v1/object/public/logo/KEsq.png" 
                className="h-8 w-auto group-hover:rotate-12 transition-transform duration-300" 
                alt="KE" 
            />
            <span className="text-xl font-black tracking-tight text-slate-800 uppercase italic">
                CHASSIS <span className="text-[#e11d48]">PRO</span>
            </span>
        </Link>
        
        <div className="flex items-center gap-4">
            <Link href="/checkout" className="bg-slate-900 text-white px-5 py-2 rounded-lg font-bold text-xs flex items-center gap-3 hover:bg-[#f97316] transition-all shadow-lg">
                View Order <span className="bg-[#e11d48] text-white px-2 py-0.5 rounded text-[10px]">{cart.length}</span>
            </Link>
            {user ? (
                <button onClick={handleLogout} className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase">Logout</button>
            ) : (
                <Link href="/login" className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase">Login</Link>
            )}
        </div>
      </nav>

      <main className="p-6 md:p-12 max-w-7xl mx-auto">
        <header className="mb-16 border-l-4 border-[#f97316] pl-6">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight italic">
            {vId ? 'Compatible Inventory' : 'Authorized Catalog'}
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium italic">
            {userRole === 'DEALER' ? "✓ Accessing Wholesale Dealer Portal" : "Professional Grade Performance Parts"}
          </p>
        </header>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4">
             <div className="animate-spin h-8 w-8 border-t-2 border-brand-orange rounded-full"></div>
             <p className="font-bold text-slate-300 text-xs tracking-widest uppercase">Fetching Specialist Stock...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.length === 0 ? (
                <div className="col-span-full py-32 text-center bg-white border border-dashed border-slate-200 rounded-[2.5rem]">
                    <p className="text-slate-300 font-bold text-lg italic">No items matched your vehicle search</p>
                    <Link href="/" className="text-[#f97316] font-bold text-xs underline mt-4 block uppercase tracking-widest">Change Vehicle</Link>
                </div>
            ) : products.map((p) => {
              const basePrice = userRole === 'DEALER' ? p.price_b2b : p.price_b2c;
              const isMultiVariant = p.has_variants && p.product_variants?.length > 0;
              
              return (
                <div key={p.id} className="bg-white border border-slate-100 p-8 hover:shadow-2xl hover:shadow-slate-200 transition-all group rounded-[2.5rem] flex flex-col relative overflow-hidden">
                  <Link href={`/products/${p.id}`} className="flex-1">
                    <div className="aspect-square bg-slate-50 mb-8 flex items-center justify-center p-8 overflow-hidden rounded-2xl relative">
                      <img src={p.image_url} alt={p.name_en} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 mix-blend-multiply" />
                      {isMultiVariant && (
                        <span className="absolute top-4 right-4 bg-white/90 border border-slate-100 px-3 py-1 rounded-full text-[8px] font-black text-slate-400 tracking-widest uppercase">Multi-Option</span>
                      )}
                    </div>
                    <p className="text-[#f97316] text-[10px] font-bold tracking-widest mb-2 italic uppercase">{p.brand_name || 'GENUINE'}</p>
                    <h2 className="text-slate-800 font-extrabold text-xl leading-tight tracking-tight mb-4 lowercase first-letter:uppercase">
                      {p.name_en}
                    </h2>
                  </Link>
                  
                  <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                      <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter mb-1 italic">
                            {isMultiVariant ? 'Starting From' : 'Retail Price'}
                        </p>
                        <p className="text-slate-900 font-black text-3xl tracking-tighter italic leading-none">
                          RM {basePrice?.toFixed(2)}
                        </p>
                      </div>
                  </div>

                  <Link href={`/products/${p.id}`} className="w-full mt-8 bg-slate-900 text-white text-center py-5 font-black text-xs tracking-[0.2em] hover:bg-[#e11d48] transition-all rounded-2xl shadow-xl uppercase italic active:scale-95">
                    View Product Details
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

// THE WRAPPER THAT FIXES THE VERCEL BUILD ERROR
export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="bg-[#fcfcfd] min-h-screen"></div>}>
            <ProductsList />
        </Suspense>
    )
}