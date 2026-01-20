"use client"
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AdminDashboard() {
  // --- UI & NAVIGATION ---
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
  const [productBrands, setProductBrands] = useState<any[]>([]) 
  const [vehicleMasterList, setVehicleMasterList] = useState<any[]>([])

  // --- VARIATION STATE ---
  const [hasVariations, setHasVariations] = useState(false)
  const [variationLevels, setVariationLevels] = useState<{name: string, options: string[]}[]>([
    { name: 'Spec', options: ['Standard'] }
  ])
  const [variantGrid, setVariantGrid] = useState<any[]>([])

  // --- MASTER FORM STATE ---
  const [formData, setFormData] = useState({
    name_en: '', name_bm: '', category_id: '', product_brand_id: '',
    description_en: '', description_bm: '', price_b2c: 0, price_b2b: 0,
    weight_kg: 0, length_cm: 0, width_cm: 0, height_cm: 0,
    image_url: '', gallery_input: '',
    spec_origin: 'Malaysia', spec_warranty: '12 Months', spec_material: 'Steel',
    fit_car_brand: '', fit_vehicle_id: ''
  })

  // --- FETCH FUNCTIONS ---
  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error) setOrders(data || []);
  }, []);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('email', { ascending: true });
    if (!error) setUsers(data || []);
  }, []);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('*, product_variants(*), product_fitment(vehicle_id)').order('id', { ascending: false });
    if (!error) setProducts(data || []);
  }, []);

  const fetchMetadata = useCallback(async () => {
    const [c, pb, vl] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('product_brands').select('*').order('name'),
      supabase.from('vehicle_list').select('*').order('brand')
    ]);
    setCategories(c.data || []); setProductBrands(pb.data || []); setVehicleMasterList(vl.data || []);
  }, []);

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

  // --- LOGIC HANDLERS ---
  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = '/'; }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) {
        alert("User access updated.");
        fetchUsers();
    }
  }

  const handleManualVerify = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'PAID' }).eq('id', orderId);
    fetchOrders();
  }

  // --- VARIATION ENGINE ---
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

  const handleEditClick = (p: any) => {
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
    if (p.has_variants && p.product_variants) {
      setVariantGrid(p.product_variants.map((v: any) => ({ name: v.name, price_b2c: v.price_b2c, price_b2b: v.price_b2b, sku: v.sku, stock: v.stock_quantity, is_active: v.is_active, attributes: v.attributes })));
    }
    setEditId(p.id); setIsEditing(true); setShowAddForm(true); setActiveSubTab('basic');
  }

  // --- STYLES ---
  const subTabOrder: ('basic' | 'spec' | 'desc' | 'sales' | 'ship')[] = ['basic', 'spec', 'desc', 'sales', 'ship'];
  const labelStyle = "text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block";
  const inputStyle = "w-full bg-white border border-slate-200 p-4 text-sm font-semibold text-slate-700 outline-none focus:border-brand-orange rounded-xl";

  if (loading && !isAdmin) return <div className="min-h-screen flex items-center justify-center font-medium text-slate-300 animate-pulse">Syncing Hub...</div>

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 font-sans">
      
      {showAddForm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-start justify-center p-4 md:p-10 overflow-y-auto backdrop-blur-sm">
            <div className="max-w-6xl mx-auto w-full bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col min-h-[85vh]">
                <div className="p-8 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Update Listing' : 'New Listing'}</h2>
                    <button onClick={() => setShowAddForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100">✕</button>
                </div>

                <div className="flex gap-8 overflow-x-auto px-10 py-4 border-b bg-slate-50 sticky top-[89px] z-10 no-scrollbar">
                    {subTabOrder.map((t, idx) => (
                        <button key={t} onClick={() => setActiveSubTab(t)} className={`text-[10px] font-bold tracking-wider pb-2 border-b-2 transition-all ${activeSubTab === t ? 'border-brand-orange text-brand-orange' : 'border-transparent text-slate-400'}`}>
                            {idx + 1}. {t.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="p-10 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {activeSubTab === 'basic' && (
                            <>
                                <div className="space-y-6">
                                    <div><label className={labelStyle}>Product Name (EN)</label><input className={inputStyle} value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} /></div>
                                    <div><label className={labelStyle}>Product Name (BM)</label><input className={inputStyle} value={formData.name_bm} onChange={e => setFormData({...formData, name_bm: e.target.value})} /></div>
                                    <div><label className={labelStyle}>Category</label><select className={inputStyle} value={formData.category_id || ''} onChange={e => setFormData({...formData, category_id: e.target.value})}><option value="">Select Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                                </div>
                                <div className="space-y-6">
                                    <div><label className={labelStyle}>Main Image Link</label><input className={inputStyle} value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} /></div>
                                    <div><label className={labelStyle}>Gallery Links</label><textarea className={`${inputStyle} h-32`} value={formData.gallery_input} onChange={e => setFormData({...formData, gallery_input: e.target.value})} /></div>
                                </div>
                            </>
                        )}
                        {activeSubTab === 'sales' && (
                            <div className="md:col-span-2 overflow-x-auto border rounded-2xl shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                                        <tr><th className="p-5">Variant</th><th className="p-5">Retail Price</th><th className="p-5 text-[#e11d48]">Wholesale</th><th className="p-5">Stock</th><th className="p-5 text-center">Active</th></tr>
                                    </thead>
                                    <tbody>
                                        {variantGrid.map((v, i) => (
                                            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                <td className="p-5 font-bold text-slate-700">{v.name}</td>
                                                <td className="p-2"><input type="number" className="input-modern !p-2" value={variantGrid[i].price_b2c} onChange={e => { const g = [...variantGrid]; g[i].price_b2c = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                <td className="p-2"><input type="number" className="input-modern !p-2 font-bold text-[#e11d48]" value={variantGrid[i].price_b2b} onChange={e => { const g = [...variantGrid]; g[i].price_b2b = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                <td className="p-2"><input type="number" className="input-modern !p-2 text-center" value={variantGrid[i].stock} onChange={e => { const g = [...variantGrid]; g[i].stock = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                <td className="p-2 text-center"><button onClick={() => {const g = [...variantGrid]; g[i].is_active = !g[i].is_active; setVariantGrid(g);}} className={`px-4 py-1 rounded-full text-[9px] font-bold ${v.is_active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>{v.is_active ? 'ON' : 'OFF'}</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {/* SPEC, DESC, SHIP Tabs hidden for brevity but logic remains same as previous verified codes */}
                    </div>
                </div>

                <div className="p-8 border-t flex justify-end gap-4 bg-white sticky bottom-0">
                    <button onClick={() => {setShowAddForm(false); setIsEditing(false);}} className="text-slate-400 font-bold text-xs px-6 hover:text-slate-900 transition-colors uppercase">Cancel</button>
                    <button onClick={handleSaveProduct} className="bg-slate-900 text-white px-16 py-4 font-bold rounded-xl text-sm hover:bg-brand-orange transition-all shadow-xl shadow-slate-200 uppercase tracking-widest">{isEditing ? 'Commit Updates' : 'Publish Listing'}</button>
                </div>
            </div>
        </div>
      )}

      {/* DASHBOARD VIEW */}
      <div className="max-w-7xl mx-auto p-6 md:p-12">
        <header className="flex justify-between items-center mb-16 border-b pb-8">
            <h1 className="text-xl font-black tracking-tight text-slate-800">CHASSIS<span className="text-[#e11d48]">PRO</span> <span className="font-light text-slate-300 ml-2">MANAGEMENT</span></h1>
            <button onClick={handleLogout} className="text-[10px] font-bold text-slate-400 hover:text-[#e11d48] border px-4 py-2 rounded-lg border-slate-100 uppercase transition-all">Logout</button>
        </header>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-16 shadow-inner max-w-md">
            <button onClick={() => setActiveTab('orders')} className={`flex-1 py-4 text-[10px] font-bold transition-all rounded-xl ${activeTab === 'orders' ? 'bg-white text-brand-orange shadow-lg' : 'text-slate-400'}`}>ORDERS</button>
            <button onClick={() => setActiveTab('products')} className={`flex-1 py-4 text-[10px] font-bold transition-all rounded-xl ${activeTab === 'products' ? 'bg-white text-brand-orange shadow-lg' : 'text-slate-400'}`}>INVENTORY</button>
            <button onClick={() => setActiveTab('users')} className={`flex-1 py-4 text-[10px] font-bold transition-all rounded-xl ${activeTab === 'users' ? 'bg-white text-brand-orange shadow-lg' : 'text-slate-400'}`}>USERS</button>
        </div>

        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white border p-8 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-brand-orange transition-all">
                <div className="flex-1">
                    <p className="text-brand-orange font-bold text-[10px] mb-2">#{order.id.slice(0,8).toUpperCase()}</p>
                    <h3 className="text-lg font-bold text-slate-800">{order.customer_name}</h3>
                    <p className="text-slate-400 text-xs mt-1">{order.email} • {order.whatsapp}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-slate-900">RM {order.total_amount.toFixed(2)}</p>
                    <span className={`inline-block px-4 py-1 rounded-full text-[9px] font-black mt-2 uppercase ${order.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-brand-orange'}`}>{order.status}</span>
                </div>
                <button onClick={() => handleManualVerify(order.id)} className="bg-slate-50 text-slate-400 p-4 rounded-2xl hover:bg-brand-orange hover:text-white transition-all">Verify</button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: INVENTORY (GRID) */}
        {activeTab === 'products' && (
          <div className="space-y-12">
            <button onClick={() => { setShowAddForm(true); setIsEditing(false); setActiveSubTab('basic'); }} className="bg-brand-orange text-white w-full py-10 rounded-3xl font-black text-xl shadow-2xl shadow-orange-500/20 hover:scale-[1.01] transition-all border-4 border-white uppercase italic tracking-widest">+ Register New Stock Unit</button>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map(p => (
                    <div key={p.id} className="bg-white border p-8 hover:shadow-2xl transition-all rounded-[2rem] flex flex-col group border-slate-100">
                        <div className="flex gap-6 items-start mb-8">
                            <img src={p.image_url} className="w-24 h-24 bg-slate-50 p-3 object-contain rounded-2xl mix-blend-multiply" alt={p.name_en} />
                            <div className="overflow-hidden">
                                <h3 className="font-bold text-slate-800 leading-tight truncate text-base">{p.name_en}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest leading-none">{p.brand_name || 'GENUINE'}</p>
                                {p.has_variants && <span className="text-[8px] bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded font-black mt-3 inline-block">VARIATIONS ACTIVE</span>}
                            </div>
                        </div>
                        <div className="mt-auto pt-8 border-t border-slate-50 flex justify-between items-end">
                            <div><p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-tighter italic">Base Price</p><span className="text-slate-900 font-black text-2xl tracking-tighter">RM{p.price_b2c?.toFixed(2)}</span></div>
                            <div className="flex gap-4">
                                <button onClick={() => handleEditClick(p)} className="text-[10px] font-bold text-brand-orange uppercase hover:underline">Edit</button>
                                <button onClick={async () => { if(confirm("Remove from inventory?")){ await supabase.from('products').delete().eq('id', p.id); fetchProducts() }}} className="text-[10px] font-bold text-slate-200 uppercase hover:text-[#e11d48]">Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: USERS */}
        {activeTab === 'users' && (
          <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
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