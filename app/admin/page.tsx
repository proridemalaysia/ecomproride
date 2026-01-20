"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AdminDashboard() {
  // --- UI STATES ---
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'users'>('products')
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'spec' | 'desc' | 'sales' | 'ship'>('basic')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  // --- DATA LISTS ---
  const [orders, setOrders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([]) 
  const [vehicleMasterList, setVehicleMasterList] = useState<any[]>([])
  const [carModels, setCarModels] = useState<any[]>([])

  // --- DYNAMIC VARIATION STATE ---
  const [hasVariations, setHasVariations] = useState(false)
  const [variationLevels, setVariationLevels] = useState<{name: string, options: string[]}[]>([{ name: 'SPEC', options: ['STANDARD'] }])
  const [variantGrid, setVariantGrid] = useState<any[]>([])

  // --- MASTER FORM STATE ---
  const [formData, setFormData] = useState({
    name_en: '', name_bm: '', category_id: '', product_brand_id: '', description_en: '', description_bm: '',
    price_b2c: 0, price_b2b: 0, weight_kg: 0, length_cm: 0, width_cm: 0, height_cm: 0,
    image_url: '', gallery_input: '', spec_origin: 'MALAYSIA', spec_warranty: '12 MONTHS', spec_material: 'STEEL',
    fit_car_brand: '', fit_vehicle_id: ''
  })

  // --- WIZARD VALIDATION ---
  const isTabComplete = (tab: string) => {
    switch(tab) {
        case 'basic': return formData.name_en !== '' && formData.category_id !== '' && formData.image_url !== '';
        case 'spec': return formData.product_brand_id !== '' && formData.fit_vehicle_id !== '';
        case 'desc': return formData.description_en !== '';
        case 'sales': return hasVariations ? variantGrid.length > 0 && variantGrid.every(v => v.price_b2c > 0) : formData.price_b2c > 0;
        case 'ship': return formData.weight_kg > 0;
        default: return false;
    }
  }

  const subTabOrder: ('basic' | 'spec' | 'desc' | 'sales' | 'ship')[] = ['basic', 'spec', 'desc', 'sales', 'ship'];
  
  const handleNext = () => {
    const currentIndex = subTabOrder.indexOf(activeSubTab);
    if (currentIndex < subTabOrder.length - 1) setActiveSubTab(subTabOrder[currentIndex + 1]);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

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
    setCategories(c || []); setBrands(pb || []); setVehicleMasterList(vl || [])
  }

  const fetchOrders = async () => { const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }); setOrders(data || []) }
  const fetchUsers = async () => { const { data } = await supabase.from('profiles').select('*'); setUsers(data || []) }
  const fetchProducts = async () => { const { data } = await supabase.from('products').select('*, product_variants(*)').order('id', { ascending: false }); setProducts(data || []) }

  useEffect(() => {
    if (hasVariations && !isEditing) {
        const combinations = (arrays: string[][]): string[][] => arrays.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())), [[]] as string[][]);
        const opts = variationLevels.map(v => v.options.filter(o => o.trim() !== ''));
        if (opts.length > 0 && opts[0].length > 0) {
            const combos = combinations(opts);
            setVariantGrid(prevGrid => combos.map((combo) => {
                const comboName = combo.join(' - ');
                const existing = prevGrid.find(g => g.name === comboName);
                return { name: comboName, attributes: combo, price_b2c: existing?.price_b2c || 0, price_b2b: existing?.price_b2b || 0, sku: existing?.sku || '', stock: existing?.stock || 0, is_active: existing?.is_active ?? true };
            }));
        }
    }
  }, [hasVariations, variationLevels, isEditing]);

  const handleSaveProduct = async () => {
    setLoading(true);
    const selectedCat = categories.find(c => c.id.toString() === formData.category_id);
    const selectedPBrand = brands.find(b => b.id.toString() === formData.product_brand_id);
    const firstV = variantGrid.find(v => v.is_active) || variantGrid[0];

    const payload = {
        name_en: formData.name_en.toUpperCase(), name_bm: (formData.name_bm || formData.name_en).toUpperCase(),
        category: selectedCat?.name || 'PART', category_id: formData.category_id || null,
        brand_name: selectedPBrand?.name || 'GENUINE', product_brand_id: formData.product_brand_id || null,
        description_en: formData.description_en, description_bm: formData.description_bm || formData.description_en,
        image_url: formData.image_url, gallery_urls: formData.gallery_input.split('\n').filter(url => url.trim() !== ''),
        weight_kg: formData.weight_kg, length_cm: formData.length_cm, width_cm: formData.width_cm, height_cm: formData.height_cm,
        has_variants: hasVariations, price_b2c: hasVariations ? (firstV?.price_b2c || 0) : formData.price_b2c, price_b2b: hasVariations ? (firstV?.price_b2b || 0) : formData.price_b2b,
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
        alert("INVENTORY SYNCED."); setShowAddForm(false); setIsEditing(false); fetchProducts();
    } else { alert(pErr?.message || "Error saving product."); }
    setLoading(false);
  }

  const labelStyle = "text-[11px] font-black text-slate-400 tracking-widest mb-3 block italic uppercase"
  const inputStyle = "w-full bg-white border border-slate-200 p-5 text-sm font-bold text-slate-900 outline-none focus:border-[#f97316] transition-all uppercase rounded-sm"

  if (loading && !isAdmin) return <div className="min-h-screen bg-white flex items-center justify-center text-slate-900 font-black italic animate-pulse">AUTHORIZING ADMIN...</div>

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans uppercase italic">
      {showAddForm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 flex items-start justify-center p-4 md:p-10 overflow-y-auto backdrop-blur-md">
            <div className="max-w-6xl mx-auto w-full bg-white shadow-2xl rounded-xl pb-10 relative mb-20 overflow-hidden flex flex-col min-h-[90vh]">
                
                <div className="sticky top-0 z-30 bg-white border-b border-slate-100 p-6 md:p-10 flex justify-between items-center">
                    <h2 className="text-2xl font-black italic tracking-tighter text-slate-900">{isEditing ? 'Update Listing' : 'New Listing'}</h2>
                    <button onClick={() => {setShowAddForm(false); setIsEditing(false);}} className="text-slate-400 hover:text-[#e11d48] font-black not-italic text-xl transition-all">✕</button>
                </div>

                <div className="sticky top-[88px] z-20 bg-slate-50 flex gap-4 md:gap-10 overflow-x-auto px-6 md:px-10 py-4 border-b border-slate-100 no-scrollbar">
                    {subTabOrder.map((t, idx) => (
                        <button key={t} onClick={() => setActiveSubTab(t)} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all whitespace-nowrap ${activeSubTab === t ? 'border-[#f97316] text-[#f97316]' : isTabComplete(t) ? 'border-green-500 text-green-500' : 'border-transparent text-slate-400'}`}>
                            {idx + 1}. {t.toUpperCase()} {isTabComplete(t) && '✓'}
                        </button>
                    ))}
                </div>

                <div className="p-6 md:p-12 not-italic flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {activeSubTab === 'basic' && (
                            <>
                                <div className="space-y-6">
                                    <div><label className={labelStyle}>Product Name (EN)</label><input className={inputStyle} value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} /></div>
                                    <div><label className={labelStyle}>Product Name (BM)</label><input className={inputStyle} value={formData.name_bm} onChange={e => setFormData({...formData, name_bm: e.target.value})} /></div>
                                    <div><label className={labelStyle}>Category</label><select className={inputStyle} value={formData.category_id || ''} onChange={e => setFormData({...formData, category_id: e.target.value})}><option value="">-- SELECT --</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                                </div>
                                <div className="space-y-6">
                                    <div><label className={labelStyle}>Main Image Link</label><input className={inputStyle} value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} /></div>
                                    <div><label className={labelStyle}>Gallery Links</label><textarea className={`${inputStyle} h-32 resize-none font-sans`} value={formData.gallery_input} onChange={e => setFormData({...formData, gallery_input: e.target.value})} /></div>
                                </div>
                            </>
                        )}
                        {activeSubTab === 'spec' && (
                            <>
                                <div className="space-y-6 bg-slate-50 p-8 border border-slate-200 rounded-lg">
                                    <label className="text-[#f97316] font-black text-[10px] tracking-widest uppercase mb-4 block leading-none italic">Vehicle Fitment Linkage</label>
                                    <div><label className={labelStyle}>Brand</label><select className={inputStyle} value={formData.fit_car_brand} onChange={e => setFormData({...formData, fit_car_brand: e.target.value})}><option value="">-- SELECT --</option>{Array.from(new Set(vehicleMasterList.map(v => v.brand))).map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                                    <div><label className={labelStyle}>Model</label><select className={inputStyle} value={formData.fit_vehicle_id} onChange={e => setFormData({...formData, fit_vehicle_id: e.target.value})} disabled={!formData.fit_car_brand}><option value="">-- SELECT --</option>{vehicleMasterList.filter(v => v.brand === formData.fit_car_brand).map(v => <option key={v.id} value={v.id}>{v.model}</option>)}</select></div>
                                </div>
                                <div className="space-y-6">
                                    <div><label className={labelStyle}>Manufacturer</label><select className={inputStyle} value={formData.product_brand_id || ''} onChange={e => setFormData({...formData, product_brand_id: e.target.value})}><option value="">-- SELECT --</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                                    <div><label className={labelStyle}>Warranty Duration</label><input className={inputStyle} value={formData.spec_warranty} onChange={e => setFormData({...formData, spec_warranty: e.target.value})} /></div>
                                    <div><label className={labelStyle}>Material construction</label><input className={inputStyle} value={formData.spec_material} onChange={e => setFormData({...formData, spec_material: e.target.value})} /></div>
                                </div>
                            </>
                        )}
                        {activeSubTab === 'desc' && (
                            <>
                                <div className="md:col-span-1"><label className={labelStyle}>Long Description (EN)</label><textarea className={`${inputStyle} h-80 resize-none font-sans`} value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} /></div>
                                <div className="md:col-span-1"><label className={labelStyle}>Long Description (BM)</label><textarea className={`${inputStyle} h-80 resize-none font-sans`} value={formData.description_bm} onChange={e => setFormData({...formData, description_bm: e.target.value})} /></div>
                            </>
                        )}
                        {activeSubTab === 'sales' && (
                            <div className="md:col-span-2 space-y-10">
                                <button type="button" onClick={() => setHasVariations(!hasVariations)} className={`px-12 py-4 font-black text-xs italic transition-all ${hasVariations ? 'bg-[#f97316] text-white shadow-lg' : 'bg-slate-300 text-slate-500'}`}>{hasVariations ? 'VARIATIONS ENABLED' : 'ENABLE VARIATIONS'}</button>
                                {hasVariations ? (
                                    <div className="space-y-8 animate-in fade-in">
                                        {variationLevels.map((level, lIdx) => (
                                            <div key={lIdx} className="bg-slate-50 border border-slate-200 p-8 relative rounded-lg">
                                                <button onClick={() => setVariationLevels(variationLevels.filter((_, i) => i !== lIdx))} className="absolute top-4 right-4 text-[#e11d48] font-black text-[9px]">REMOVE [X]</button>
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div><label className={labelStyle}>Level Name</label><input className={inputStyle} value={level.name} onChange={e => {const n = [...variationLevels]; n[lIdx].name = e.target.value.toUpperCase(); setVariationLevels(n);}} /></div>
                                                    <div><label className={labelStyle}>Options</label><input className={inputStyle} value={level.options.join(',')} onChange={e => {const n = [...variationLevels]; n[lIdx].options = e.target.value.split(',').map(s => s.toUpperCase()); setVariationLevels(n);}} /></div>
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => setVariationLevels([...variationLevels, { name: 'NEW', options: ['OPT'] }])} className="w-full border-2 border-dashed border-slate-200 p-4 text-[10px] font-black text-slate-400 hover:text-slate-900 transition-all uppercase italic">+ ADD LEVEL</button>
                                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                            <table className="w-full min-w-[1000px] text-left">
                                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 border-b border-slate-200 italic">
                                                    <tr><th className="p-5">VARIANT</th><th className="p-5 text-[#f97316]">RETAIL RM</th><th className="p-5 text-[#e11d48]">DEALER RM</th><th className="p-5">SKU</th><th className="p-5">STOCK</th><th className="p-5">STATUS</th></tr>
                                                </thead>
                                                <tbody>
                                                    {variantGrid.map((v, i) => (
                                                        <tr key={i} className={`border-b border-slate-100 ${!v.is_active ? 'opacity-30' : 'hover:bg-slate-50'}`}>
                                                            <td className="p-5 font-black text-xs italic">{v.name}</td>
                                                            <td className="p-2"><input type="number" step="0.01" className="bg-white border border-slate-200 p-3 w-full text-xs font-black rounded-sm" value={variantGrid[i].price_b2c} onChange={e => { const g = [...variantGrid]; g[i].price_b2c = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                            <td className="p-2"><input type="number" step="0.01" className="bg-white border border-slate-200 p-3 w-full text-xs font-black rounded-sm" value={variantGrid[i].price_b2b} onChange={e => { const g = [...variantGrid]; g[i].price_b2b = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                            <td className="p-2"><input className="bg-white border border-slate-200 p-3 w-full text-xs font-black rounded uppercase" value={variantGrid[i].sku} onChange={e => { const g = [...variantGrid]; g[i].sku = e.target.value; setVariantGrid(g); }} /></td>
                                                            <td className="p-2"><input type="number" className="bg-white border border-slate-200 p-3 w-24 text-xs font-black text-center mx-auto block rounded" value={variantGrid[i].stock} onChange={e => { const g = [...variantGrid]; g[i].stock = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                            <td className="p-3 text-center"><button type="button" onClick={() => {const g = [...variantGrid]; g[i].is_active = !g[i].is_active; setVariantGrid(g);}} className={`px-4 py-2 text-[8px] font-black rounded-full transition-all ${v.is_active ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>{v.is_active ? 'ON' : 'OFF'}</button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeSubTab === 'ship' && (
                            <>
                                <div className="space-y-6">
                                    <div><label className={labelStyle}>Actual Weight (KG)</label><input type="number" step="0.1" className={`${inputStyle} max-w-xs`} value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: Number(e.target.value)})} /></div>
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div><label className={labelStyle}>L (CM)</label><input type="number" className={inputStyle} value={formData.length_cm} onChange={e => setFormData({...formData, length_cm: Number(e.target.value)})} /></div>
                                    <div><label className={labelStyle}>W (CM)</label><input type="number" className={inputStyle} value={formData.width_cm} onChange={e => setFormData({...formData, width_cm: Number(e.target.value)})} /></div>
                                    <div><label className={labelStyle}>H (CM)</label><input type="number" className={inputStyle} value={formData.height_cm} onChange={e => setFormData({...formData, height_cm: Number(e.target.value)})} /></div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="p-10 border-t border-slate-100 flex flex-col md:flex-row justify-end gap-6 bg-slate-50 mt-auto">
                    <button onClick={() => {setShowAddForm(false); setIsEditing(false);}} className="px-10 py-5 font-black uppercase text-xs text-slate-400 italic">Exit Wizard</button>
                    {activeSubTab !== 'ship' ? (
                        <button onClick={handleNext} disabled={!isTabComplete(activeSubTab)} className={`px-24 py-6 font-black uppercase italic text-sm tracking-widest transition-all rounded-md shadow-xl ${isTabComplete(activeSubTab) ? 'bg-[#f97316] text-white hover:bg-[#0f172a]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Next Step →</button>
                    ) : (
                        <button onClick={handleSaveProduct} disabled={!isTabComplete('ship')} className={`px-24 py-6 font-black uppercase italic text-sm tracking-widest transition-all rounded-md shadow-xl ${isTabComplete('ship') ? 'bg-[#0f172a] text-white hover:bg-green-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>{isEditing ? 'COMMIT UPDATES' : 'PUBLISH LISTING'}</button>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* DASHBOARD HUB VIEW */}
      <div className="max-w-7xl mx-auto p-4 md:p-12 uppercase italic">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 border-b-2 border-slate-100 pb-8 gap-6">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-slate-900 leading-none">ADMIN <span className="text-[#e11d48]">HUB</span></h1>
            <button onClick={handleLogout} className="bg-[#0f172a] text-white px-10 py-3 text-[11px] font-black hover:bg-[#e11d48] transition-all rounded-md uppercase tracking-widest leading-none">Logout Session</button>
        </div>
        <div className="flex flex-col md:flex-row bg-slate-100 p-1 rounded-xl mb-12 shadow-inner">
            <button onClick={() => setActiveTab('orders')} className={`flex-1 py-5 text-[11px] font-black transition-all ${activeTab === 'orders' ? 'bg-white text-[#f97316] shadow-lg rounded-lg' : 'text-slate-400'}`}>01. ORDERS</button>
            <button onClick={() => setActiveTab('products')} className={`flex-1 py-5 text-[11px] font-black transition-all ${activeTab === 'products' ? 'bg-white text-[#f97316] shadow-lg rounded-lg' : 'text-slate-400'}`}>02. INVENTORY</button>
            <button onClick={() => setActiveTab('users')} className={`flex-1 py-5 text-[11px] font-black transition-all ${activeTab === 'users' ? 'bg-white text-[#f97316] shadow-lg rounded-lg' : 'text-slate-400'}`}>03. USERS</button>
        </div>
        {activeTab === 'products' && (
          <div className="space-y-10 not-italic">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-12 border border-slate-200 rounded-2xl gap-8 shadow-sm">
                <div className="text-center md:text-left"><h2 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase italic leading-none">Warehouse Hub</h2><p className="text-sm text-slate-400 font-bold mt-2 uppercase italic">{products.length} Records Synchronized</p></div>
                <button onClick={() => { setShowAddForm(true); setIsEditing(false); setFormData({name_en: '', name_bm: '', category_id: '', product_brand_id: '', description_en: '', description_bm: '', price_b2c: 0, price_b2b: 0, weight_kg: 0, length_cm: 0, width_cm: 0, height_cm: 0, image_url: '', gallery_input: '', spec_origin: 'MALAYSIA', spec_warranty: '12 MONTHS', spec_material: 'STEEL', fit_car_brand: '', fit_vehicle_id: ''}); setActiveSubTab('basic'); }} className="bg-[#f97316] text-white px-12 py-6 font-black text-sm hover:bg-[#0f172a] transition-all shadow-xl rounded-sm tracking-[0.2em] italic">+ ADD NEW LISTING</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 italic uppercase">
                {products.map(p => (
                    <div key={p.id} className="bg-white border border-slate-200 p-8 hover:border-[#f97316] transition-all group flex flex-col justify-between shadow-sm relative overflow-hidden rounded-xl">
                        <div className="flex gap-6 items-start mb-8 italic"><img src={p.image_url} className="w-24 h-24 bg-slate-50 p-3 object-contain rounded-lg" alt={p.name_en} />
                            <div className="overflow-hidden">
                                <h3 className="font-black text-base text-slate-900 leading-tight truncate tracking-tight">{p.name_en}</h3>
                                <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-widest leading-none">{p.brand_name || 'BRAND'} SPECIALIST</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-end border-t border-slate-100 pt-6">
                            <div><p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-1 italic">Price</p><span className="text-slate-900 font-black text-xl tracking-tighter leading-none italic uppercase">RM{p.price_b2c?.toFixed(2)}</span></div>
                            <div className="flex gap-4">
                                <button onClick={() => { setEditId(p.id); setFormData({...p, gallery_input: p.gallery_urls?.join('\n') || '', fit_car_brand: '', fit_vehicle_id: ''}); setIsEditing(true); setShowAddForm(true); }} className="text-[10px] text-[#f97316] font-black italic uppercase">Edit</button>
                                <button onClick={async () => { if(confirm("Permanently remove?")){ await supabase.from('products').delete().eq('id', p.id); fetchProducts() }}} className="text-[10px] text-slate-300 hover:text-[#e11d48] font-black italic transition-all uppercase leading-none">Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}