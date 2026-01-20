"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'users'>('products')
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'spec' | 'desc' | 'sales' | 'ship'>('basic')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  const [orders, setOrders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [productBrands, setProductBrands] = useState<any[]>([]) 
  const [vehicleMasterList, setVehicleMasterList] = useState<any[]>([])

  const [hasVariations, setHasVariations] = useState(false)
  const [variationLevels, setVariationLevels] = useState<{name: string, options: string[]}[]>([{ name: 'SPEC', options: ['STANDARD'] }])
  const [variantGrid, setVariantGrid] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name_en: '', name_bm: '', category_id: '', product_brand_id: '',
    description_en: '', description_bm: '', price_b2c: 0, price_b2b: 0,
    weight_kg: 0, length_cm: 0, width_cm: 0, height_cm: 0,
    image_url: '', gallery_input: '',
    spec_origin: 'MALAYSIA', spec_warranty: '12 MONTHS', spec_material: 'STEEL',
    fit_car_brand: '', fit_vehicle_id: ''
  })

  useEffect(() => {
    async function init() {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
          if (profile?.role === 'ADMIN') {
            setIsAdmin(true)
            await Promise.all([fetchProducts(), fetchOrders(), fetchUsers(), fetchMetadata()])
          }
        }
        setLoading(false)
    }
    init()
  }, [])

  const fetchMetadata = async () => {
    const { data: c } = await supabase.from('categories').select('*').order('name');
    const { data: pb } = await supabase.from('product_brands').select('*').order('name');
    const { data: vl } = await supabase.from('vehicle_list').select('*').order('brand');
    setCategories(c || []); setProductBrands(pb || []); setVehicleMasterList(vl || [])
  }

  const fetchOrders = async () => { const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }); setOrders(data || []) }
  const fetchUsers = async () => { const { data } = await supabase.from('profiles').select('*'); setUsers(data || []) }
  const fetchProducts = async () => { const { data } = await supabase.from('products').select('*, product_variants(*)').order('id', { ascending: false }); setProducts(data || []) }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isTabComplete = (tab: string) => {
    if (tab === 'basic') return formData.name_en !== '' && formData.category_id !== '' && formData.image_url !== '';
    if (tab === 'spec') return formData.product_brand_id !== '' && formData.fit_vehicle_id !== '';
    if (tab === 'desc') return formData.description_en !== '';
    if (tab === 'sales') return hasVariations ? variantGrid.length > 0 : formData.price_b2c > 0;
    if (tab === 'ship') return formData.weight_kg > 0;
    return false;
  }

  const handleSaveProduct = async () => {
    setLoading(true);
    const firstV = variantGrid.find(v => v.is_active) || variantGrid[0];
    const payload = {
        name_en: formData.name_en.toUpperCase(), name_bm: (formData.name_bm || formData.name_en).toUpperCase(),
        category_id: formData.category_id || null, product_brand_id: formData.product_brand_id || null,
        description_en: formData.description_en, description_bm: formData.description_bm || formData.description_en,
        image_url: formData.image_url, gallery_urls: formData.gallery_input.split('\n').filter(url => url.trim() !== ''),
        weight_kg: formData.weight_kg, length_cm: formData.length_cm, width_cm: formData.width_cm, height_cm: formData.height_cm,
        has_variants: hasVariations, 
        price_b2c: hasVariations ? (firstV?.price_b2c || 0) : formData.price_b2c, 
        price_b2b: hasVariations ? (firstV?.price_b2b || 0) : formData.price_b2b,
        specs: { origin: formData.spec_origin, warranty: formData.spec_warranty, material: formData.spec_material }
    }
    const { data: p, error: pErr } = isEditing 
        ? await supabase.from('products').update(payload).eq('id', editId as number).select().single() 
        : await supabase.from('products').insert([payload]).select().single();
    
    if (p) {
        if (formData.fit_vehicle_id) await supabase.from('product_fitment').upsert({ product_id: p.id, vehicle_id: formData.fit_vehicle_id });
        if (hasVariations) {
            await supabase.from('product_variants').delete().eq('product_id', p.id);
            await supabase.from('product_variants').insert(variantGrid.map(v => ({ product_id: p.id, name: v.name, price_b2c: v.price_b2c, price_b2b: v.price_b2b, sku: v.sku, stock_quantity: v.stock, is_active: v.is_active, attributes: v.attributes })));
        }
        alert("SYNCED."); setShowAddForm(false); setIsEditing(false); fetchProducts();
    } else { alert(pErr?.message || "Error"); }
    setLoading(false);
  }

  const labelStyle = "text-[11px] font-black text-slate-400 tracking-widest mb-3 block italic uppercase"
  const inputStyle = "w-full bg-white border border-slate-200 p-5 text-sm font-bold text-slate-900 outline-none focus:border-[#f97316] transition-all uppercase rounded-sm"

  if (loading && !isAdmin) return <div className="min-h-screen bg-white flex items-center justify-center text-slate-900 font-black italic animate-pulse">AUTHORIZING...</div>

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans uppercase italic">
      {showAddForm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 flex items-start justify-center p-4 md:p-10 overflow-y-auto backdrop-blur-md">
            <div className="max-w-6xl mx-auto w-full bg-white shadow-2xl rounded-xl pb-10 relative mb-20 flex flex-col min-h-[90vh] not-italic">
                <div className="p-6 md:p-10 border-b flex justify-between items-center">
                    <h2 className="text-2xl font-black italic text-slate-900">{isEditing ? 'Edit Listing' : 'New Listing'}</h2>
                    <button onClick={() => setShowAddForm(false)} className="text-slate-400 font-black text-xl">✕</button>
                </div>

                <div className="flex gap-4 md:gap-10 overflow-x-auto px-10 py-4 border-b bg-slate-50">
                    {['basic', 'spec', 'desc', 'sales', 'ship'].map(t => (
                        <button key={t} onClick={() => setActiveSubTab(t as any)} className={`text-[10px] font-black pb-2 border-b-2 transition-all whitespace-nowrap ${activeSubTab === t ? 'border-[#f97316] text-[#f97316]' : 'border-transparent text-slate-400'}`}>{t.toUpperCase()}</button>
                    ))}
                </div>

                <div className="p-6 md:p-12 flex-1">
                    {activeSubTab === 'basic' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div><label className={labelStyle}>Part Name (EN)</label><input className={inputStyle} value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} /></div>
                                <div><label className={labelStyle}>Part Name (BM)</label><input className={inputStyle} value={formData.name_bm} onChange={e => setFormData({...formData, name_bm: e.target.value})} /></div>
                                <div><label className={labelStyle}>Category</label><select className={inputStyle} value={formData.category_id || ''} onChange={e => setFormData({...formData, category_id: e.target.value})}><option value="">-- Choose --</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            </div>
                            <div className="space-y-6">
                                <div><label className={labelStyle}>Main Image URL</label><input className={inputStyle} value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} /></div>
                                <div><label className={labelStyle}>Gallery Links</label><textarea className={`${inputStyle} h-32`} value={formData.gallery_input} onChange={e => setFormData({...formData, gallery_input: e.target.value})} /></div>
                            </div>
                        </div>
                    )}
                    {activeSubTab === 'spec' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6 bg-slate-50 p-8 border rounded-lg">
                                <div><label className={labelStyle}>Car Brand</label><select className={inputStyle} value={formData.fit_car_brand} onChange={e => setFormData({...formData, fit_car_brand: e.target.value})}><option value="">-- SELECT --</option>{Array.from(new Set(vehicleMasterList.map(v => v.brand))).map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                                <div><label className={labelStyle}>Car Model</label><select className={inputStyle} value={formData.fit_vehicle_id} onChange={e => setFormData({...formData, fit_vehicle_id: e.target.value})} disabled={!formData.fit_car_brand}><option value="">-- SELECT --</option>{vehicleMasterList.filter(v => v.brand === formData.fit_car_brand).map(v => <option key={v.id} value={v.id}>{v.model}</option>)}</select></div>
                            </div>
                            <div className="space-y-6">
                                <div><label className={labelStyle}>Manufacturer</label><select className={inputStyle} value={formData.product_brand_id || ''} onChange={e => setFormData({...formData, product_brand_id: e.target.value})}><option value="">-- SELECT --</option>{productBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                                <div><label className={labelStyle}>Warranty</label><input className={inputStyle} value={formData.spec_warranty} onChange={e => setFormData({...formData, spec_warranty: e.target.value})} /></div>
                            </div>
                        </div>
                    )}
                    {activeSubTab === 'desc' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                             <div><label className={labelStyle}>Long Description (EN)</label><textarea className={`${inputStyle} h-80`} value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} /></div>
                             <div><label className={labelStyle}>Long Description (BM)</label><textarea className={`${inputStyle} h-80`} value={formData.description_bm} onChange={e => setFormData({...formData, description_bm: e.target.value})} /></div>
                        </div>
                    )}
                    {activeSubTab === 'sales' && (
                        <div className="space-y-10">
                            <button type="button" onClick={() => setHasVariations(!hasVariations)} className={`px-12 py-4 font-black text-xs transition-all ${hasVariations ? 'bg-[#f97316] text-white shadow-lg' : 'bg-slate-300 text-slate-500'}`}>{hasVariations ? 'ON' : 'OFF'}</button>
                            {hasVariations ? (
                                <div className="overflow-x-auto border rounded-xl">
                                    <table className="w-full min-w-[1000px] text-left">
                                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400">
                                            <tr><th className="p-5">VARIANT</th><th className="p-5">RETAIL RM</th><th className="p-5">DEALER RM</th><th className="p-5">STOCK</th></tr>
                                        </thead>
                                        <tbody>
                                            {variantGrid.map((v, i) => (
                                                <tr key={i} className="border-b">
                                                    <td className="p-5 text-xs font-bold">{v.name}</td>
                                                    <td className="p-2"><input type="number" step="0.01" className="bg-slate-100 p-3 w-full text-xs font-black" value={variantGrid[i].price_b2c} onChange={e => { const g = [...variantGrid]; g[i].price_b2c = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                    <td className="p-2"><input type="number" step="0.01" className="bg-slate-100 p-3 w-full text-xs font-black" value={variantGrid[i].price_b2b} onChange={e => { const g = [...variantGrid]; g[i].price_b2b = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                    <td className="p-2"><input type="number" className="bg-slate-100 p-3 w-24 text-xs font-black" value={variantGrid[i].stock} onChange={e => { const g = [...variantGrid]; g[i].stock = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-10">
                                    <div><label className={labelStyle}>Retail RM</label><input type="number" className={inputStyle} value={formData.price_b2c} onChange={e => setFormData({...formData, price_b2c: Number(e.target.value)})} /></div>
                                    <div><label className={labelStyle}>Dealer RM</label><input type="number" className={inputStyle} value={formData.price_b2b} onChange={e => setFormData({...formData, price_b2b: Number(e.target.value)})} /></div>
                                </div>
                            )}
                        </div>
                    )}
                    {activeSubTab === 'ship' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div><label className={labelStyle}>Weight (KG)</label><input type="number" step="0.1" className={inputStyle} value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: Number(e.target.value)})} /></div>
                            <div className="grid grid-cols-3 gap-6">
                                <div><label className={labelStyle}>L (CM)</label><input type="number" className={inputStyle} value={formData.length_cm} onChange={e => setFormData({...formData, length_cm: Number(e.target.value)})} /></div>
                                <div><label className={labelStyle}>W (CM)</label><input type="number" className={inputStyle} value={formData.width_cm} onChange={e => setFormData({...formData, width_cm: Number(e.target.value)})} /></div>
                                <div><label className={labelStyle}>H (CM)</label><input type="number" className={inputStyle} value={formData.height_cm} onChange={e => setFormData({...formData, height_cm: Number(e.target.value)})} /></div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-10 border-t bg-slate-50 flex justify-end gap-6 mt-auto">
                    <button onClick={handleSaveProduct} className="px-24 py-6 bg-[#0f172a] text-white font-black uppercase text-sm hover:bg-[#f97316] transition-all rounded shadow-xl">{isEditing ? 'UPDATE' : 'PUBLISH'}</button>
                </div>
            </div>
        </div>
      )}

      {/* DASHBOARD VIEW */}
      <div className="max-w-7xl mx-auto p-4 md:p-12">
        <div className="flex justify-between items-center mb-12 border-b-2 pb-8 gap-6">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-slate-900 uppercase">ADMIN <span className="text-[#e11d48]">HUB</span></h1>
            <button onClick={handleLogout} className="bg-[#0f172a] text-white px-10 py-3 text-[11px] font-black rounded uppercase">Logout</button>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl mb-12">
            <button onClick={() => setActiveTab('orders')} className={`flex-1 py-5 text-[11px] font-black transition-all ${activeTab === 'orders' ? 'bg-white text-[#f97316] shadow-lg rounded-lg' : 'text-slate-400'}`}>ORDERS</button>
            <button onClick={() => setActiveTab('products')} className={`flex-1 py-5 text-[11px] font-black transition-all ${activeTab === 'products' ? 'bg-white text-[#f97316] shadow-lg rounded-lg' : 'text-slate-400'}`}>INVENTORY</button>
            <button onClick={() => setActiveTab('users')} className={`flex-1 py-5 text-[11px] font-black transition-all ${activeTab === 'users' ? 'bg-white text-[#f97316] shadow-lg rounded-lg' : 'text-slate-400'}`}>USERS</button>
        </div>
        {activeTab === 'products' && (
          <div className="space-y-10 not-italic">
            <div className="flex justify-between items-center bg-white p-12 border rounded-2xl shadow-sm">
                <div><h2 className="text-3xl font-black italic text-slate-900">Stock Hub</h2><p className="text-sm text-slate-400 font-bold uppercase">{products.length} Records Active</p></div>
                <button onClick={() => { setShowAddForm(true); setIsEditing(false); setActiveSubTab('basic'); }} className="bg-[#f97316] text-white px-12 py-6 font-black text-sm rounded shadow-xl tracking-widest">+ ADD NEW</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 italic uppercase">
                {products.map(p => (
                    <div key={p.id} className="bg-white border p-8 hover:border-[#f97316] transition-all group flex flex-col justify-between shadow-sm relative rounded-xl">
                        <div className="flex gap-6 items-start mb-8 italic"><img src={p.image_url} className="w-24 h-24 bg-slate-50 p-3 object-contain rounded-lg" /><div className="overflow-hidden"><h3 className="font-black text-base text-slate-900 truncate">{p.name_en}</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.category}</p></div></div>
                        <div className="flex justify-between items-end border-t pt-6"><div><p className="text-[10px] text-slate-400 font-black mb-1">Master Price</p><span className="text-slate-900 font-black text-xl tracking-tighter uppercase leading-none">RM{p.price_b2c?.toFixed(2)}</span></div><button onClick={async () => { if(confirm("Confirm removal?")){ await supabase.from('products').delete().eq('id', p.id); fetchProducts() }}} className="text-[10px] text-slate-300 hover:text-[#e11d48] font-black transition-all uppercase">Delete</button></div>
                    </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}