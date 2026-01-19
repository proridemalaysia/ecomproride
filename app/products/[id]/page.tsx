"use client"
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

export default function ProductDetailPage() {
  const params = useParams()
  const id = params?.id
  const { cart, addToCart } = useCart()
  
  const [product, setProduct] = useState<any>(null)
  const [activeVariants, setActiveVariants] = useState<any[]>([])
  const [selection, setSelection] = useState<string[]>([])
  const [activeVariant, setActiveVariant] = useState<any>(null)
  const [userRole, setUserRole] = useState('RETAIL')
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState('')
  const [showLightbox, setShowLightbox] = useState(false)

  const formatMoney = (amount: number) => {
    const value = typeof amount === 'number' ? amount : 0;
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  useEffect(() => {
    async function getDetails() {
      if (!id) return
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
        if (profile) setUserRole(profile.role)
      }

      const { data } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .eq('id', id)
        .single()

      if (data) {
        setProduct(data)
        setActiveImage(data.image_url)
        const filtered = data.product_variants.filter((v: any) => v.is_active && v.stock_quantity > 0)
        setActiveVariants(filtered)
        if (filtered.length > 0) setSelection(filtered[0].attributes)
      }
      setLoading(false)
    }
    getDetails()
  }, [id])

  useEffect(() => {
    if (product?.has_variants) {
        const match = activeVariants.find((v: any) => 
            JSON.stringify(v.attributes) === JSON.stringify(selection)
        );
        setActiveVariant(match);
    }
  }, [selection, activeVariants, product]);

  const variationLevels = product?.has_variants && activeVariants.length > 0 
    ? activeVariants[0].attributes.map((_: any, i: number) => ({
        name: i === 0 ? "SPECIFICATION" : i === 1 ? "POSITION" : `OPTION ${i + 1}`,
        options: Array.from(new Set(activeVariants.map(v => v.attributes[i])))
      }))
    : [];

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-900 italic animate-pulse font-black uppercase tracking-widest">Syncing Hub...</div>
  if (!product) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-black uppercase text-slate-300">Not Found</div>

  // CALCULATE PRICE SAFELY
  const displayPrice = product?.has_variants 
    ? (userRole === 'DEALER' ? activeVariant?.price_b2b : activeVariant?.price_b2c)
    : (userRole === 'DEALER' ? product?.price_b2b : product?.price_b2c);

  const handleAddToCart = () => {
    if (product.has_variants && !activeVariant) return alert("Sila lengkapkan pilihan.");

    // FORCE PRICE TO BE A NUMBER
    const finalPrice = Number(displayPrice);
    if (isNaN(finalPrice) || finalPrice <= 0) {
        return alert("Ralat: Harga tidak sah ditemukan. Sila semak variasi.");
    }

    const cartItem = product.has_variants ? {
        id: activeVariant.id, 
        name_en: `${product.name_en} (${activeVariant.name})`,
        brand_name: product.brand_name,
        image_url: product.image_url,
        weight_kg: product.weight_kg,
        length_cm: product.length_cm,
        width_cm: product.width_cm,
        height_cm: product.height_cm,
        category: product.category
    } : {
        id: product.id,
        name_en: product.name_en,
        brand_name: product.brand_name,
        image_url: product.image_url,
        weight_kg: product.weight_kg,
        length_cm: product.length_cm,
        width_cm: product.width_cm,
        height_cm: product.height_cm,
        category: product.category
    };

    addToCart(cartItem, finalPrice);
    alert(`SUCCESS: Item added to cart.`);
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans uppercase italic">
      {showLightbox && (
        <div className="fixed inset-0 z-[200] bg-slate-900/98 flex items-center justify-center p-6 backdrop-blur-md" onClick={() => setShowLightbox(false)}>
            <div className="absolute top-10 right-10 text-white font-black cursor-pointer uppercase">Close [X]</div>
            <img src={activeImage} className="max-w-full max-h-full object-contain" />
        </div>
      )}

      <nav className="p-6 border-b border-slate-200 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/products" className="text-slate-400 font-black italic hover:text-[#e11d48] text-[10px] tracking-widest">← BACK TO SHOP</Link>
        <Link href="/checkout" className="bg-[#0f172a] text-white px-6 py-2 font-black italic text-[10px] tracking-widest rounded-sm">CART ({cart.length})</Link>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12 lg:p-20 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32">
        <div className="space-y-8">
          <div className="bg-white border border-slate-200 aspect-square flex items-center justify-center p-12 overflow-hidden cursor-zoom-in relative rounded-2xl shadow-sm" onClick={() => setShowLightbox(true)}>
            <img src={activeImage} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 mix-blend-multiply" />
          </div>
          {product.gallery_urls?.length > 0 && (
            <div className="grid grid-cols-5 gap-4">
                {product.gallery_urls.map((url: string, i: number) => (
                    <button key={i} onClick={() => setActiveImage(url)} className={`aspect-square bg-white border-2 p-2 rounded-xl transition-all ${activeImage === url ? 'border-[#f97316] shadow-lg' : 'border-slate-100 opacity-40'}`}><img src={url} className="w-full h-full object-contain mix-blend-multiply" /></button>
                ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="space-y-2 mb-8">
              <span className="bg-[#f97316]/10 text-[#f97316] text-[10px] font-black px-4 py-1.5 rounded-full border border-[#f97316]/20 tracking-widest">{product.brand_name} PROFESSIONAL</span>
              <h1 className="text-4xl md:text-7xl font-black italic uppercase leading-[0.95] tracking-tighter text-slate-900">{product.name_en}</h1>
          </div>
          
          <div className="bg-white border border-slate-200 p-10 mb-12 rounded-2xl relative shadow-2xl shadow-slate-200/60 overflow-hidden">
             <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#e11d48] to-[#f97316]"></div>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">PRICE TIER: {userRole}</p>
             <p className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter italic leading-none">
                {displayPrice ? formatMoney(Number(displayPrice)) : '---'}
             </p>
          </div>

          {product.has_variants && activeVariants.length > 0 && (
            <div className="space-y-12 mb-16 not-italic">
                {variationLevels.map((level: any, levelIdx: number) => (
                    <div key={level.name} className="space-y-4">
                        <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase italic border-b border-slate-100 pb-2">Select {level.name}</p>
                        <div className="flex flex-wrap gap-3">
                            {level.options.map((val: string) => (
                                <button 
                                    key={val} 
                                    onClick={() => {
                                        const newSelection = [...selection];
                                        newSelection[levelIdx] = val;
                                        setSelection(newSelection);
                                    }}
                                    className={`px-8 py-4 text-xs font-black border-2 transition-all tracking-wider rounded-xl uppercase ${selection[levelIdx] === val ? 'border-[#f97316] bg-[#f97316] text-white shadow-xl' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300'}`}
                                >{val}</button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          )}

          <div className="flex gap-4 mb-8">
              <div className="flex-1 bg-slate-100/50 border border-slate-200 p-4 rounded-xl text-center uppercase">
                  <p className="text-[9px] font-black text-slate-400 tracking-widest mb-1 leading-none">Weight</p>
                  <p className="text-sm font-black text-slate-900">{product.weight_kg} KG</p>
              </div>
              <div className="flex-1 bg-slate-100/50 border border-slate-200 p-4 rounded-xl text-center uppercase">
                  <p className="text-[9px] font-black text-slate-400 tracking-widest mb-1 leading-none">Dimensions</p>
                  <p className="text-sm font-black text-slate-900">{product.length_cm}x{product.width_cm}x{product.height_cm} CM</p>
              </div>
          </div>

          <button onClick={handleAddToCart} disabled={product.has_variants && !activeVariant} className="w-full bg-[#0f172a] text-white py-8 font-black uppercase italic tracking-[0.3em] hover:bg-[#e11d48] transition-all shadow-2xl rounded-2xl text-sm disabled:opacity-20 active:scale-95 mb-16">
            {product.has_variants && !activeVariant ? 'OUT OF STOCK' : 'CONFIRM & ADD TO ORDER'}
          </button>
        </div>
      </main>
    </div>
  )
}