"use client"
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AdminDashboard() {
  // 1. --- UI & NAVIGATION STATES ---
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'users'>('products')
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'spec' | 'desc' | 'sales' | 'ship'>('basic')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  // 2. --- DATA LISTS ---
  const [orders, setOrders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [productBrands, setProductBrands] = useState<any[]>([]) 
  const [vehicleMasterList, setVehicleMasterList] = useState<any[]>([])

  // 3. --- DYNAMIC VARIATION STATE ---
  const [hasVariations, setHasVariations] = useState(false)
  const [variationLevels, setVariationLevels] = useState<{name: string, options: string[]}[]>([
    { name: 'Spec', options: ['Standard'] }
  ])
  const [variantGrid, setVariantGrid] = useState<any[]>([])

  // 4. --- MASTER FORM STATE ---
  const [formData, setFormData] = useState({
    name_en: '', name_bm: '', category_id: '', product_brand_id: '',
    description_en: '', description_bm: '', price_b2c: 0, price_b2b: 0,
    weight_kg: 0, length_cm: 0, width_cm: 0, height_cm: 0,
    image_url: '', gallery_input: '',
    spec_origin: 'Malaysia', spec_warranty: '12 Months', spec_material: 'Steel',
    fit_car_brand: '', fit_vehicle_id: ''
  })

  // 5. --- FETCH FUNCTIONS ---
  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from('products').select('*, product_variants(*), product_fitment(vehicle_id)').order('id', { ascending: false });
    setProducts(data || []);
  }, []);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
  }, []);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*');
    setUsers(data || []);
  }, []);

  const fetchMetadata = useCallback(async () => {
    const [c, pb, vl] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('product_brands').select('*').order('name'),
      supabase.from('vehicle_list').select('*').order('brand')
    ]);
    setCategories(c.data || []); setProductBrands(pb.data || []); setVehicleMasterList(vl.data || []);
  }, []);

  // 6. --- WIZARD LOGIC ---
  const subTabOrder: ('basic' | 'spec' | 'desc' | 'sales' | 'ship')[] = ['basic', 'spec', 'desc', 'sales', 'ship'];
  
  const isTabComplete = (tab: string) => {
    if (tab === 'basic') return formData.name_en !== '' && formData.category_id !== '' && formData.image_url !== '';
    if (tab === 'spec') return formData.product_brand_id !== '' && formData.fit_vehicle_id !== '';
    if (tab === 'desc') return formData.description_en !== '';
    if (tab === 'sales') return true; 
    if (tab === 'ship') return formData.weight_kg > 0;
    return false;
  }

  const handleNext = () => {
    const currentIndex = subTabOrder.indexOf(activeSubTab);
    if (currentIndex < subTabOrder.length - 1) setActiveSubTab(subTabOrder[currentIndex + 1]);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const handleManualVerify = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'PAID' }).eq('id', orderId);
    fetchOrders();
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    fetchUsers();
  }

  // 7. --- INITIALIZATION ---
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
  }, [fetchProducts, fetchOrders, fetchUsers, fetchMetadata])

  // 8. --- VARIATION ENGINE ---
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

  // 9. --- EDIT & SAVE HANDLERS ---
  const handleEditClick = async (p: any) => {
    const fitment = p.product_fitment?.[0];
    const vehicle = vehicleMasterList.find(v => v.id.toString() === fitment?.vehicle_id?.toString());

    setFormData({
      name_en: p.name_en, name_bm: p.name_bm, category_id: p.category_id?.toString(), product_brand_id: p.product_brand_id?.toString(),
      description_en: p.description_en, description_bm: p.description_bm, price_b2c: p.price_b2c, price_b2b: p.price_b2b,
      weight_kg: p.weight_kg, length_cm: p.length_cm, width_cm: p.width_cm, height_cm: p.height_cm,
      image_url: p.image_url, gallery_input: p.gallery_urls?.join('\n') || '',
      spec_origin: p.specs?.origin || 'Malaysia', spec_warranty: p.specs?.warranty || '12 Months', spec_material: p.specs?.material || 'Steel',
      fit_car_brand: vehicle?.brand || '', fit_vehicle_id: fitment?.vehicle_id?.toString() || ''
    });

    setHasVariations(p.has_variants);
    if (p.has_variants && p.product_variants && p.product_variants.length > 0) {
        const firstAttr = p.product_variants[0].attributes;
        const levels = firstAttr.map((_: any, i: number) => ({
            name: i === 0 ? "Spec" : i === 1 ? "Position" : `Level ${i+1}`,
            options: Array.from(new Set(p.product_variants.map((v: any) => v.attributes[i]))) as string[]
        }));
        setVariationLevels(levels);
        setVariantGrid(p.product_variants.map((v: any) => ({ name: v.name, price_b2c: v.price_b2c, price_b2b: v.price_b2b, sku: v.sku, stock: v.stock_quantity, is_active: v.is_active, attributes: v.attributes })));
    }
    setEditId(p.id); setIsEditing(true); setShowAddForm(true); setActiveSubTab('basic');
  }

  const handleSaveProduct = async () => {
    setLoading(true);
    const firstV = variantGrid.find(v => v.is_active) || variantGrid[0];
    const payload = {
      name_en: formData.name_en, name_bm: formData.name_bm || formData.name_en,
      category_id: formData.category_id || null, product_brand_id: formData.product_brand_id || null,
      description_en: formData.description_en, description_bm: formData.description_bm || formData.description_en,
      image_url: formData.image_url, gallery_urls: formData.gallery_input.split('\n').filter(url => url.trim() !== ''),
      weight_kg: formData.weight_kg, length_cm: formData.length_cm, width_cm: formData.width_cm, height_cm: formData.height_cm,
      has_variants: hasVariations, price_b2c: hasVariations ? (firstV?.price_b2c || 0) : formData.price_b2c, price_b2b: hasVariations ? (firstV?.price_b2b || 0) : formData.price_b2b,
      specs: { origin: formData.spec_origin, warranty: formData.spec_warranty, material: formData.spec_material }
    }
    const { data: p, error } = isEditing ? await supabase.from('products').update(payload).eq('id', editId as number).select().single() : await supabase.from('products').insert([payload]).select().single();
    if (p) {
      if (formData.fit_vehicle_id) {
          await supabase.from('product_fitment').delete().eq('product_id', p.id);
          await supabase.from('product_fitment').insert({ product_id: p.id, vehicle_id: formData.fit_vehicle_id });
      }
      if (hasVariations) {
        await supabase.from('product_variants').delete().eq('product_id', p.id);
        await supabase.from('product_variants').insert(variantGrid.map(v => ({ product_id: p.id, name: v.name, price_b2c: v.price_b2c, price_b2b: v.price_b2b, sku: v.sku, stock_quantity: v.stock, is_active: v.is_active, attributes: v.attributes })));
      }
      alert("SUCCESS: HUB UPDATED."); setShowAddForm(false); setIsEditing(false); fetchProducts();
    } else { alert(error?.message); }
    setLoading(false);
  }

  // --- UI STYLES ---
  const sectionLabel = "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block";
  const inputStyle = "w-full bg-white border border-slate-200 p-4 text-sm font-semibold text-slate-700 outline-none focus:border-brand-orange rounded-xl";

  if (loading && !isAdmin) return <div className="min-h-screen flex items-center justify-center font-medium text-slate-300 animate-pulse">Syncing Hub...</div>

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 font-sans">
      {showAddForm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-start justify-center p-4 md:p-10 overflow-y-auto backdrop-blur-sm">
            <div className="max-w-6xl mx-auto w-full bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col min-h-[85vh]">
                <div className="p-8 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Update Listing' : 'New Listing'}</h2>
                    <button onClick={() => {setShowAddForm(false); setIsEditing(false);}} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100">✕</button>
                </div>

                <div className="flex gap-4 md:gap-8 overflow-x-auto px-8 py-4 border-b bg-slate-50 sticky top-[89px] z-10 no-scrollbar">
                    {subTabOrder.map((t, idx) => (
                        <button key={t} onClick={() => setActiveSubTab(t)} className={`text-[10px] font-bold tracking-wider pb-2 border-b-2 transition-all whitespace-nowrap ${activeSubTab === t ? 'border-brand-orange text-brand-orange' : isTabComplete(t) ? 'border-green-500 text-green-500' : 'border-transparent text-slate-400'}`}>
                            {idx + 1}. {t.toUpperCase()} {isTabComplete(t) && '✓'}
                        </button>
                    ))}
                </div>

                <div className="p-8 md:p-12 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {activeSubTab === 'basic' && (
                            <>
                                <div className="space-y-4">
                                    <div><label className={sectionLabel}>Product Name (EN)</label><input className={inputStyle} value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} /></div>
                                    <div><label className={sectionLabel}>Product Name (BM)</label><input className={inputStyle} value={formData.name_bm} onChange={e => setFormData({...formData, name_bm: e.target.value})} /></div>
                                    <div><label className={sectionLabel}>Category</label><select className={inputStyle} value={formData.category_id || ''} onChange={e => setFormData({...formData, category_id: e.target.value})}><option value="">Select Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                                </div>
                                <div className="space-y-4">
                                    <div><label className={sectionLabel}>Main Image URL</label><input className={inputStyle} value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} /></div>
                                    <div><label className={sectionLabel}>Gallery Links</label><textarea className={`${inputStyle} h-32`} value={formData.gallery_input} onChange={e => setFormData({...formData, gallery_input: e.target.value})} /></div>
                                </div>
                            </>
                        )}
                        {activeSubTab === 'spec' && (
                            <>
                                <div className="space-y-6 bg-slate-50 p-8 border border-slate-200 rounded-lg">
                                    <label className="text-[#f97316] font-bold text-[10px] tracking-widest uppercase mb-4 block leading-none italic">Vehicle Fitment Linkage</label>
                                    <div><label className={sectionLabel}>Car Brand</label><select className={inputStyle} value={formData.fit_car_brand} onChange={e => setFormData({...formData, fit_car_brand: e.target.value})}><option value="">-- SELECT --</option>{Array.from(new Set(vehicleMasterList.map(v => v.brand))).map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                                    <div><label className={sectionLabel}>Car Model</label><select className={inputStyle} value={formData.fit_vehicle_id} onChange={e => setFormData({...formData, fit_vehicle_id: e.target.value})} disabled={!formData.fit_car_brand}><option value="">-- SELECT --</option>{vehicleMasterList.filter(v => v.brand === formData.fit_car_brand).map(v => <option key={v.id} value={v.id}>{v.model}</option>)}</select></div>
                                </div>
                                <div className="space-y-6">
                                    <div><label className={sectionLabel}>Part Manufacturer</label><select className={inputStyle} value={formData.product_brand_id || ''} onChange={e => setFormData({...formData, product_brand_id: e.target.value})}><option value="">-- SELECT BRAND --</option>{productBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                                    <div><label className={sectionLabel}>Warranty Info</label><input className={inputStyle} value={formData.spec_warranty} onChange={e => setFormData({...formData, spec_warranty: e.target.value})} /></div>
                                </div>
                            </>
                        )}
                        {activeSubTab === 'desc' && (
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div><label className={sectionLabel}>Description (EN)</label><textarea className={`${inputStyle} h-80 resize-none`} value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} /></div>
                                <div><label className={sectionLabel}>Description (BM)</label><textarea className={`${inputStyle} h-80 resize-none`} value={formData.description_bm} onChange={e => setFormData({...formData, description_bm: e.target.value})} /></div>
                            </div>
                        )}
                        {activeSubTab === 'sales' && (
                            <div className="md:col-span-2 space-y-10">
                                <button type="button" onClick={() => setHasVariations(!hasVariations)} className={`px-12 py-4 font-bold text-xs transition-all ${hasVariations ? 'bg-brand-orange text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>{hasVariations ? 'VARIATIONS ENABLED' : 'ENABLE VARIATIONS'}</button>
                                {hasVariations ? (
                                    <div className="space-y-8 animate-in fade-in">
                                        {variationLevels.map((level, lIdx) => (
                                            <div key={lIdx} className="bg-slate-50 border p-8 relative rounded-xl">
                                                <button onClick={() => setVariationLevels(variationLevels.filter((_, i) => i !== lIdx))} className="absolute top-4 right-4 text-[#e11d48] font-bold text-[9px]">REMOVE</button>
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div><label className={sectionLabel}>Level {lIdx+1} Name</label><input className={inputStyle} value={level.name} onChange={e => {const n = [...variationLevels]; n[lIdx].name = e.target.value; setVariationLevels(n);}} /></div>
                                                    <div><label className={sectionLabel}>Options</label><input className={inputStyle} value={level.options.join(',')} onChange={e => {const n = [...variationLevels]; n[lIdx].options = e.target.value.split(','); setVariationLevels(n);}} /></div>
                                                </div>
                                            </div>
                                        ))}
                                        {variationLevels.length < 5 && <button onClick={() => setVariationLevels([...variationLevels, { name: 'POSITION', options: ['FRONT'] }])} className="w-full border-2 border-dashed p-4 text-[10px] font-bold text-slate-400">+ Add More Level</button>}
                                        <div className="overflow-x-auto border rounded-xl shadow-sm">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400">
                                                    <tr><th className="p-5">VARIANT</th><th className="p-5">RETAIL RM</th><th className="p-5 text-[#e11d48]">DEALER RM</th><th className="p-5">STOCK</th><th className="p-5 text-center">STATUS</th></tr>
                                                </thead>
                                                <tbody>
                                                    {variantGrid.map((v, i) => (
                                                        <tr key={i} className={`border-b border-slate-50 ${!v.is_active && 'opacity-30'}`}>
                                                            <td className="p-5 font-bold text-slate-700">{v.name}</td>
                                                            <td className="p-2"><input type="number" className="input-modern !p-2" value={variantGrid[i].price_b2c} onChange={e => { const g = [...variantGrid]; g[i].price_b2c = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                            <td className="p-2"><input type="number" className="input-modern !p-2 font-bold text-[#e11d48]" value={variantGrid[i].price_b2b} onChange={e => { const g = [...variantGrid]; g[i].price_b2b = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                            <td className="p-2"><input type="number" className="input-modern !p-2 text-center" value={variantGrid[i].stock} onChange={e => { const g = [...variantGrid]; g[i].stock = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                            <td className="p-2 text-center"><button type="button" onClick={() => {const g = [...variantGrid]; g[i].is_active = !g[i].is_active; setVariantGrid(g);}} className={`px-4 py-1 rounded-full text-[8px] font-black ${v.is_active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{v.is_active ? 'ON' : 'OFF'}</button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div><label className={sectionLabel}>Retail Price RM</label><input type="number" step="0.01" className={inputStyle} value={formData.price_b2c} onChange={e => setFormData({...formData, price_b2c: Number(e.target.value)})} /></div>
                                        <div><label className={sectionLabel}>Dealer Price RM</label><input type="number" step="0.01" className={`${inputStyle} text-[#e11d48]`} value={formData.price_b2b} onChange={e => setFormData({...formData, price_b2b: Number(e.target.value)})} /></div>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeSubTab === 'ship' && (
                            <>
                                <div><label className={sectionLabel}>Weight (KG)</label><input type="number" step="0.1" className={`${inputStyle} max-w-xs`} value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: Number(e.target.value)})} /></div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div><label className={sectionLabel}>Length (CM)</label><input type="number" className={inputStyle} value={formData.length_cm} onChange={e => setFormData({...formData, length_cm: Number(e.target.value)})} /></div>
                                    <div><label className={sectionLabel}>Width (CM)</label><input type="number" className={inputStyle} value={formData.width_cm} onChange={e => setFormData({...formData, width_cm: Number(e.target.value)})} /></div>
                                    <div><label className={sectionLabel}>Height (CM)</label><input type="number" className={inputStyle} value={formData.height_cm} onChange={e => setFormData({...formData, height_cm: Number(e.target.value)})} /></div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="p-8 md:p-10 bg-slate-50 border-t flex flex-col md:flex-row justify-end gap-6 mt-auto sticky bottom-0 z-10">
                    <button onClick={() => {setShowAddForm(false); setIsEditing(false);}} className="px-10 py-5 font-bold text-xs text-slate-400">Cancel</button>
                    {activeSubTab !== 'ship' ? (
                        <button onClick={handleNext} disabled={!isTabComplete(activeSubTab)} className={`px-24 py-6 font-bold rounded-xl text-sm transition-all shadow-xl ${isTabComplete(activeSubTab) ? 'bg-brand-orange text-white' : 'bg-slate-200 text-slate-400'}`}>Next Step →</button>
                    ) : (
                        <button onClick={handleSaveProduct} disabled={!isTabComplete('ship')} className={`px-24 py-6 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-brand-orange transition-all shadow-xl ${isTabComplete('ship') ? 'bg-slate-900' : 'bg-slate-200 cursor-not-allowed'}`}>{isEditing ? 'COMMIT UPDATES' : 'PUBLISH LISTING'}</button>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* DASHBOARD VIEW */}
      <div className="max-w-7xl mx-auto p-6 md:p-12 uppercase italic">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 border-b-2 border-slate-100 pb-8 gap-6">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900">ADMIN <span className="text-[#e11d48]">HUB</span></h1>
            <button onClick={handleLogout} className="bg-[#0f172a] text-white px-10 py-3 text-[11px] font-bold rounded-lg uppercase tracking-widest">Logout</button>
        </div>
        <div className="flex flex-col md:flex-row bg-slate-100 p-1 rounded-xl mb-12 shadow-inner">
            <button onClick={() => setActiveTab('orders')} className={`flex-1 py-5 text-[11px] font-bold transition-all ${activeTab === 'orders' ? 'bg-white text-brand-orange shadow-lg rounded-lg' : 'text-slate-400'}`}>01. ORDERS</button>
            <button onClick={() => setActiveTab('products')} className={`flex-1 py-5 text-[11px] font-bold transition-all ${activeTab === 'products' ? 'bg-white text-brand-orange shadow-lg rounded-lg' : 'text-slate-400'}`}>02. INVENTORY</button>
            <button onClick={() => setActiveTab('users')} className={`flex-1 py-5 text-[11px] font-bold transition-all ${activeTab === 'users' ? 'bg-white text-brand-orange shadow-lg rounded-lg' : 'text-slate-400'}`}>03. USERS</button>
        </div>
        
        {activeTab === 'products' && (
          <div className="space-y-10 not-italic">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-12 border border-slate-200 rounded-2xl gap-8 shadow-sm">
                <div className="text-center md:text-left"><h2 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase italic leading-none">Warehouse Hub</h2><p className="text-sm text-slate-400 font-bold mt-2 uppercase italic">{products.length} Records Sync</p></div>
                <button onClick={() => { setShowAddForm(true); setIsEditing(false); setFormData({name_en: '', name_bm: '', category_id: '', product_brand_id: '', description_en: '', description_bm: '', price_b2c: 0, price_b2b: 0, weight_kg: 0, length_cm: 0, width_cm: 0, height_cm: 0, image_url: '', gallery_input: '', spec_origin: 'MALAYSIA', spec_warranty: '12 MONTHS', spec_material: 'STEEL', fit_car_brand: '', fit_vehicle_id: ''}); setActiveSubTab('basic'); }} className="bg-brand-orange text-white px-12 py-6 font-bold text-sm hover:bg-slate-900 transition-all shadow-xl rounded-xl tracking-widest uppercase italic">+ Add New Product</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 italic uppercase">
                {products.map(p => (
                    <div key={p.id} className="bg-white border border-slate-100 p-8 hover:border-brand-orange transition-all group flex flex-col justify-between shadow-sm relative overflow-hidden rounded-[2.5rem]">
                        <div className="flex gap-6 items-start mb-8 italic">
                            <div className="w-24 h-24 bg-slate-50 p-3 border border-slate-100 flex-shrink-0 relative rounded-2xl"><img src={p.image_url} className="w-full h-full object-contain mix-blend-multiply" alt={p.name_en} /></div>
                            <div className="overflow-hidden">
                                <h3 className="font-bold text-base text-slate-900 leading-tight truncate tracking-tight">{p.name_en}</h3>
                                <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-widest leading-none">{p.brand_name || 'GENUINE'}</p>
                                {p.has_variants && <p className="text-[9px] text-brand-orange mt-2 font-black italic">✓ VARIATIONS ACTIVE</p>}
                            </div>
                        </div>
                        <div className="flex justify-between items-end border-t border-slate-50 pt-6">
                            <div><p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1 italic">Master Price</p><span className="text-slate-900 font-black text-xl tracking-tighter leading-none italic uppercase">RM{p.price_b2c?.toFixed(2)}</span></div>
                            <div className="flex gap-4">
                                <button onClick={() => handleEditClick(p)} className="text-[10px] text-brand-orange font-bold hover:underline">Edit</button>
                                <button onClick={async () => { if(confirm("Confirm removal?")){ await supabase.from('products').delete().eq('id', p.id); fetchProducts() }}} className="text-[10px] text-slate-300 hover:text-[#e11d48] font-bold">Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-brand-orange transition-all not-italic">
                <div className="flex-1">
                    <p className="text-brand-orange font-bold text-[10px] mb-2">#{order.id.slice(0,8).toUpperCase()}</p>
                    <h3 className="text-lg font-bold text-slate-800 uppercase">{order.customer_name}</h3>
                    <p className="text-slate-400 text-xs mt-1 lowercase">{order.email} • {order.whatsapp}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-slate-900 italic">RM {order.total_amount.toFixed(2)}</p>
                    <span className={`inline-block px-4 py-1 rounded-full text-[9px] font-black mt-2 uppercase ${order.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-brand-orange'}`}>{order.status}</span>
                </div>
                <button onClick={() => handleManualVerify(order.id)} className="bg-slate-50 text-slate-400 p-4 rounded-2xl hover:bg-brand-orange hover:text-white transition-all uppercase text-[9px] font-black italic">Verify Paid</button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: USERS */}
        {activeTab === 'users' && (
          <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm not-italic">
             <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                    <tr><th className="p-8">IDENTITY / EMAIL</th><th className="p-8 text-center">ACCESS LEVEL</th><th className="p-8 text-right">ACTIONS</th></tr>
                </thead>
                <tbody className="text-sm font-semibold text-slate-600">
                    {users.map(u => (
                        <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="p-8 text-slate-900 lowercase">{u.email}</td>
                            <td className="p-8 text-center"><span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${u.role === 'ADMIN' ? 'bg-red-100 text-red-600' : u.role === 'DEALER' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>{u.role}</span></td>
                            <td className="p-8 text-right flex gap-3 justify-end uppercase text-[9px] font-black">
                                <button onClick={() => handleUpdateRole(u.id, 'RETAIL')} className="hover:text-slate-900">RETAIL</button>
                                <button onClick={() => handleUpdateRole(u.id, 'DEALER')} className="text-blue-500 hover:text-blue-700">DEALER</button>
                                <button onClick={() => handleUpdateRole(u.id, 'ADMIN')} className="text-red-500 hover:text-red-700">ADMIN</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
        )}

      </div>
    </div>
  )
}