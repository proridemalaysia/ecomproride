"use client"
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function InventoryTab() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('id', { ascending: false });
    setProducts(data || []);
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Inventory Stock</h2>
            <p className="text-sm text-slate-400 font-medium">Manage and track your warehouse listings</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-xl shadow-blue-500/20 transition-all active:scale-95">
          + Add New Listing
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                        <th className="px-8 py-5">Item Code</th>
                        <th className="px-8 py-5">Product Details</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5 text-center">In Stock</th>
                        <th className="px-8 py-5 text-right">Price (RM)</th>
                        <th className="px-8 py-5"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {products.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-all cursor-default">
                            <td className="px-8 py-6">
                                <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-xs">
                                    PR-{p.id.toString().padStart(4, '0')}
                                </span>
                            </td>
                            <td className="px-8 py-6">
                                <p className="font-bold text-slate-800 text-sm leading-tight mb-1">{p.name_en}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{p.brand_name}</p>
                            </td>
                            <td className="px-8 py-6">
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md uppercase">
                                    {p.category}
                                </span>
                            </td>
                            <td className="px-8 py-6 text-center">
                                <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full text-[10px] font-black">
                                    AVAILABLE
                                </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                                <span className="font-black text-slate-800 text-sm">
                                    {p.price_b2c.toFixed(2)}
                                </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                                <button className="w-8 h-8 rounded-lg text-slate-300 hover:bg-slate-100 hover:text-blue-600 transition-all font-bold">✎</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {products.length === 0 && !loading && (
            <div className="py-24 text-center">
                <p className="text-slate-300 font-bold italic">No records found in inventory.</p>
            </div>
        )}
      </div>
    </div>
  )
}