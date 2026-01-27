"use client"
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function InventoryTab() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  const [categories, setCategories] = useState<any[]>([])
  const [productBrands, setProductBrands] = useState<any[]>([])
  const [vehicleList, setVehicleList] = useState<any[]>([])
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'spec' | 'desc' | 'sales' | 'ship'>('basic')
  const subTabOrder: ('basic' | 'spec' | 'desc' | 'sales' | 'ship')[] = ['basic', 'spec', 'desc', 'sales', 'ship']

  // VARIATION ENGINE
  const [hasVariations, setHasVariations] = useState(false)
  const [variationLevels, setVariationLevels] = useState<{name: string, options: string[]}[]>([{ name: 'Spec', options: ['Standard'] }])
  const [variantGrid, setVariantGrid] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name_en: '', name_bm: '', category_id: '', product_brand_id: '',
    description_en: '', description_bm: '', price_b2c: 0, price_b2b: 0,
    weight_kg: 0, length_cm: 0, width_cm: 0, height_cm: 0, image_url: '', gallery_input: '',
    spec_origin: 'Malaysia', spec_warranty: '12 Months', spec_material: 'Steel',
    fit_car_brand: '', fit_vehicle_id: ''
  })

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*, product_variants(*), product_fitment(vehicle_id)').order('id', { ascending: false });
    setProducts(data || []); setLoading(false);
  }, [])

  useEffect(() => {
    fetchProducts();
    async function getMeta() {
        const [c, pb, vl] = await Promise.all([supabase.from('categories').select('*'), supabase.from('product_brands').select('*'), supabase.from('vehicle_list').select('*')]);
        setCategories(c.data || []); setProductBrands(pb.data || []); setVehicleList(vl.data || []);
    }
    getMeta()
  }, [fetchProducts])

  // CRITICAL FIX: VARIATION DATA PERSISTENCE LOGIC
  useEffect(() => {
    if (hasVariations) {
        const getCombos = (arrays: string[][]): string[][] => arrays.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())), [[]] as string[][]);
        const activeOptions = variationLevels.map(v => v.options.filter(o => o.trim() !== ''));
        
        if (activeOptions.length > 0 && activeOptions[0].length > 0) {
            const combos = getCombos(activeOptions);
            setVariantGrid(prevGrid => combos.map((combo) => {
                const comboName = combo.join(' - ');
                // Check if this variant was already filled in previously
                const existing = prevGrid.find(g => g.name === comboName);
                return {
                    name: comboName,
                    attributes: combo,
                    price_b2c: existing?.price_b2c || 0,
                    price_b2b: existing?.price_b2b || 0,
                    sku: existing?.sku || '',
                    stock: existing?.stock || 0,
                    is_active: existing?.is_active ?? true
                };
            }));
        }
    }
  }, [variationLevels, hasVariations]);

  const handleEditClick = (p: any) => {
    const fitment = p.product_fitment?.[0];
    const vehicle = vehicleList.find(v => v.id.toString() === fitment?.vehicle_id?.toString());
    setFormData({
      name_en: p.name_en, name_bm: p.name_bm || '', category_id: p.category_id?.toString() || '', product_brand_id: p.product_brand_id?.toString() || '',
      description_en: p.description_en || '', description_bm: p.description_bm || '', price_b2c: p.price_b2c, price_b2b: p.price_b2b,
      weight_kg: p.weight_kg, length_cm: p.length_cm, width_cm: p.width_cm, height_cm: p.height_cm,
      image_url: p.image_url, gallery_input: p.gallery_urls?.join('\n') || '',
      spec_origin: p.specs?.origin || 'Malaysia', spec_warranty: p.specs?.warranty || '12 Months', spec_material: p.specs?.material || 'Steel',
      fit_car_brand: vehicle?.brand || '', fit_vehicle_id: fitment?.vehicle_id?.toString() || ''
    });
    if (p.has_variants) {
        setHasVariations(true);
        setVariantGrid(p.product_variants.map((v:any) => ({ name: v.name, price_b2c: v.price_b2c, price_b2b: v.price_b2b, sku: v.sku, stock: v.stock_quantity, is_active: v.is_active, attributes: v.attributes })));
    }
    setEditId(p.id); setIsEditing(true); setShowForm(true); setActiveSubTab('basic');
  }

  const handleSave = async () => {
    setIsSaving(true);
    const firstV = variantGrid.find(v => v.is_active) || variantGrid[0];
    const payload = {
        name_en: formData.name_en, name_bm: formData.name_bm || formData.name_en,
        category_id: formData.category_id || null, product_brand_id: formData.product_brand_id || null,
        description_en: formData.description_en, description_bm: formData.description_bm || formData.description_en,
        image_url: formData.image_url, gallery_urls: formData.gallery_input.split('\n').filter(l => l.trim() !== ''),
        weight_kg: formData.weight_kg, length_cm: formData.length_cm, width_cm: formData.width_cm, height_cm: formData.height_cm,
        has_variants: hasVariations, price_b2c: hasVariations ? firstV.price_b2c : formData.price_b2c, price_b2b: hasVariations ? firstV.price_b2b : formData.price_b2b,
        brand_name: productBrands.find(b=>b.id.toString()===formData.product_brand_id)?.name || 'GENUINE',
        category: categories.find(c=>c.id.toString()===formData.category_id)?.name || 'PART',
        specs: { origin: formData.spec_origin, warranty: formData.spec_warranty, material: formData.spec_material }
    }
    const { data: p, error } = isEditing ? await supabase.from('products').update(payload).eq('id', editId).select().single() : await supabase.from('products').insert([payload]).select().single();
    if (p) {
        if (formData.fit_vehicle_id) { await supabase.from('product_fitment').delete().eq('product_id', p.id); await supabase.from('product_fitment').insert({ product_id: p.id, vehicle_id: formData.fit_vehicle_id }); }
        if (hasVariations) { await supabase.from('product_variants').delete().eq('product_id', p.id); await supabase.from('product_variants').insert(variantGrid.map(v => ({ product_id: p.id, name: v.name, price_b2c: v.price_b2c, price_b2b: v.price_b2b, sku: v.sku, stock_quantity: v.stock, is_active: v.is_active, attributes: v.attributes }))); }
        alert("Inventory Database Updated."); setShowForm(false); setIsEditing(false); fetchProducts();
    } else { alert(error?.message); }
    setIsSaving(false);
  }

  const isTabComplete = (tab: string) => {
    if (tab === 'basic') return formData.name_en && formData.category_id && formData.image_url;
    if (tab === 'spec') return formData.product_brand_id && formData.fit_vehicle_id;
    return true;
  }

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center px-2">
        <div><h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2><p className="text-sm text-slate-400 font-medium">Professional warehouse tracking system</p></div>
        <button onClick={() => {setShowForm(true); setIsEditing(false); setActiveSubTab('basic');}} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-xs shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
          {isSaving ? 'Synchronizing...' : '+ Add New Listing'}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b">
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"><th className="px-8 py-5">Item Code</th><th className="px-8 py-5">Product Info</th><th className="px-8 py-5 text-center">In Stock</th><th className="px-8 py-5 text-right">Price (RM)</th><th className="px-8 py-5"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-all cursor-default">
                        <td className="px-8 py-6"><span className="font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-xs uppercase tracking-tighter italic">PRO-{p.id.toString().padStart(4, '0')}</span></td>
                        <td className="px-8 py-6"><p className="font-bold text-slate-700 text-sm leading-tight">{p.name_en}</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{p.brand_name}</p></td>
                        <td className="px-8 py-6 text-center"><span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black italic">AVAILABLE</span></td>
                        <td className="px-8 py-6 text-right font-black text-slate-700 text-sm">{p.price_b2c.toFixed(2)}</td>
                        <td className="px-8 py-6 text-right"><button onClick={() => handleEditClick(p)} className="text-slate-300 hover:text-blue-600 transition-all font-bold">✎</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-start justify-center p-4 md:p-10 overflow-y-auto backdrop-blur-md">
            <div className="max-w-6xl mx-auto w-full bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col min-h-[85vh]">
                <div className="p-8 border-b flex justify-between bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Update Listing' : 'New Listing'}</h2>
                    <button onClick={() => setShowForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 transition-all">✕</button>
                </div>
                <div className="flex gap-4 md:gap-8 px-8 py-4 border-b bg-slate-50 sticky top-[89px] z-10 overflow-x-auto no-scrollbar">
                    {subTabOrder.map((t, idx) => (
                        <button key={t} onClick={() => setActiveSubTab(t)} className={`text-[10px] font-bold tracking-wider pb-2 border-b-2 transition-all whitespace-nowrap ${activeSubTab === t ? 'border-blue-600 text-blue-600' : isTabComplete(t) ? 'border-green-500 text-green-500' : 'border-transparent text-slate-400'}`}>{idx + 1}. {t.toUpperCase()} {isTabComplete(t) && '✓'}</button>
                    ))}
                </div>
                <div className="p-10 flex-1 not-italic">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {activeSubTab === 'basic' && (
                            <>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Name (English)</label><input className="input-erp" value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} /></div>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Name (BM)</label><input className="input-erp" value={formData.name_bm} onChange={e => setFormData({...formData, name_bm: e.target.value})} /></div>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Category</label><select className="input-erp" value={formData.category_id || ''} onChange={e => setFormData({...formData, category_id: e.target.value})}><option value="">Select</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Main Image URL</label><input className="input-erp" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} /></div>
                            </>
                        )}
                        {activeSubTab === 'spec' && (
                            <>
                                <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border">
                                    <label className="text-blue-600 font-bold text-[10px] uppercase tracking-widest">Car Fitment</label>
                                    <select className="input-erp" value={formData.fit_car_brand} onChange={e => setFormData({...formData, fit_car_brand: e.target.value})}><option value="">Brand</option>{Array.from(new Set(vehicleList.map(v => v.brand))).map(b => <option key={b} value={b}>{b}</option>)}</select>
                                    <select className="input-erp" value={formData.fit_vehicle_id} onChange={e => setFormData({...formData, fit_vehicle_id: e.target.value})} disabled={!formData.fit_car_brand}><option value="">Model</option>{vehicleList.filter(v => v.brand === formData.fit_car_brand).map(v => <option key={v.id} value={v.id}>{v.model}</option>)}</select>
                                </div>
                                <div className="space-y-4">
                                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Part Manufacturer</label><select className="input-erp" value={formData.product_brand_id || ''} onChange={e => setFormData({...formData, product_brand_id: e.target.value})}><option value="">Brand</option>{productBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Warranty Info</label><input className="input-erp" value={formData.spec_warranty} onChange={e => setFormData({...formData, spec_warranty: e.target.value})} /></div>
                                </div>
                            </>
                        )}
                        {activeSubTab === 'desc' && (
                            <>
                                <div className="md:col-span-2 grid grid-cols-2 gap-8">
                                    <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Description (EN)</label><textarea className="input-erp h-80" value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} /></div>
                                    <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Description (BM)</label><textarea className="input-erp h-80 font-italic" value={formData.description_bm} onChange={e => setFormData({...formData, description_bm: e.target.value})} /></div>
                                </div>
                            </>
                        )}
                        {activeSubTab === 'sales' && (
                            <div className="md:col-span-2 space-y-8">
                                <div className="flex items-center gap-4 bg-slate-50 p-8 rounded-2xl border">
                                    <span className="font-bold text-sm">Enable Variations?</span>
                                    <button type="button" onClick={() => setHasVariations(!hasVariations)} className={`px-12 py-3 rounded-xl font-bold text-xs transition-all ${hasVariations ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>{hasVariations ? 'ON' : 'OFF'}</button>
                                </div>
                                {hasVariations ? (
                                    <div className="space-y-8">
                                        {!isEditing && variationLevels.map((level, lIdx) => (
                                            <div key={lIdx} className="bg-slate-50 border p-6 relative rounded-2xl">
                                                <button onClick={() => setVariationLevels(variationLevels.filter((_, i) => i !== lIdx))} className="absolute top-4 right-4 text-red-500 font-bold text-[9px]">REMOVE LEVEL</button>
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div><label className="text-xs font-bold text-slate-400 mb-2 block">Level Name</label><input className="input-erp" value={level.name} onChange={e => {const n = [...variationLevels]; n[lIdx].name = e.target.value.toUpperCase(); setVariationLevels(n);}} /></div>
                                                    <div><label className="text-xs font-bold text-slate-400 mb-2 block">Options</label><input className="input-erp" value={level.options.join(',')} onChange={e => {const n = [...variationLevels]; n[lIdx].options = e.target.value.split(',').map(s => s.toUpperCase()); setVariationLevels(n);}} /></div>
                                                </div>
                                            </div>
                                        ))}
                                        {!isEditing && variationLevels.length < 5 && <button onClick={() => setVariationLevels([...variationLevels, { name: 'POSITION', options: ['FRONT'] }])} className="w-full border-2 border-dashed border-slate-200 p-4 text-[10px] font-black text-slate-400 hover:text-blue-600 transition-all uppercase italic tracking-widest">+ Add Level</button>}
                                        <div className="overflow-x-auto border border-slate-100 rounded-3xl shadow-sm">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                                                    <tr><th className="p-5">Variant Combo</th><th className="p-5 text-blue-600">Retail RM</th><th className="p-5 text-red-500">Dealer RM</th><th className="p-5">Stock</th><th className="p-5 text-center">Status</th></tr>
                                                </thead>
                                                <tbody>
                                                    {variantGrid.map((v, i) => (
                                                        <tr key={i} className={`border-b border-slate-50 ${!v.is_active && 'opacity-30'}`}>
                                                            <td className="p-5 font-bold text-slate-600">{v.name}</td>
                                                            <td className="p-2"><input type="number" step="0.01" className="input-erp !p-2" value={variantGrid[i].price_b2c} onChange={e => { const g = [...variantGrid]; g[i].price_b2c = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                            <td className="p-2"><input type="number" step="0.01" className="input-erp !p-2 font-bold text-blue-600" value={variantGrid[i].price_b2b} onChange={e => { const g = [...variantGrid]; g[i].price_b2b = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                            <td className="p-2"><input type="number" className="input-erp !p-2 text-center" value={variantGrid[i].stock} onChange={e => { const g = [...variantGrid]; g[i].stock = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                            <td className="p-2 text-center"><button onClick={() => {const g = [...variantGrid]; g[i].is_active = !g[i].is_active; setVariantGrid(g);}} className={`px-4 py-1 rounded-full text-[9px] font-black ${v.is_active ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{v.is_active ? 'ON' : 'OFF'}</button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-10">
                                        <div><label className="text-xs font-bold text-slate-400 mb-2 block">Retail RM</label><input type="number" step="0.01" className={input-erp} value={formData.price_b2c} onChange={e => setFormData({...formData, price_b2c: Number(e.target.value)})} /></div>
                                        <div><label className="text-xs font-bold text-slate-400 mb-2 block">Dealer RM</label><input type="number" step="0.01" className={`${input-erp} text-blue-600`} value={formData.price_b2b} onChange={e => setFormData({...formData, price_b2b: Number(e.target.value)})} /></div>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeSubTab === 'ship' && (
                            <div className="space-y-12">
                                <div><label className="text-xs font-bold text-slate-400 mb-2 block">Weight (KG)</label><input type="number" step="0.1" className="input-erp max-w-xs" value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: Number(e.target.value)})} /></div>
                                <div className="grid grid-cols-3 gap-8">
                                    <div><label className="text-xs font-bold text-slate-400 mb-2 block">Length (CM)</label><input type="number" className="input-erp" value={formData.length_cm} onChange={e => setFormData({...formData, length_cm: Number(e.target.value)})} /></div>
                                    <div><label className="text-xs font-bold text-slate-400 mb-2 block">Width (CM)</label><input type="number" className="input-erp" value={formData.width_cm} onChange={e => setFormData({...formData, width_cm: Number(e.target.value)})} /></div>
                                    <div><label className="text-xs font-bold text-slate-400 mb-2 block">Height (CM)</label><input type="number" className="input-erp" value={formData.height_cm} onChange={e => setFormData({...formData, height_cm: Number(e.target.value)})} /></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-8 border-t bg-slate-50 flex justify-between items-center sticky bottom-0 z-10">
                    <button onClick={() => setShowForm(false)} className="text-slate-400 font-bold text-xs px-6 uppercase tracking-widest">Cancel</button>
                    <div className="flex gap-4">
                        {activeSubTab !== 'ship' ? (
                            <button onClick={() => setActiveSubTab(subTabOrder[subTabOrder.indexOf(activeSubTab) + 1])} disabled={!isTabComplete(activeSubTab)} className={`px-12 py-4 rounded-xl font-bold text-sm transition-all shadow-lg ${isTabComplete(activeSubTab) ? 'bg-blue-600 text-white hover:bg-slate-900' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>Next Step →</button>
                        ) : (
                            <button onClick={handleSave} className="bg-slate-900 text-white px-20 py-4 rounded-xl font-bold shadow-xl hover:bg-blue-600 transition-all text-sm tracking-widest uppercase">{isSaving ? 'Processing...' : (isEditing ? 'Commit Updates' : 'Publish Listing')}</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}