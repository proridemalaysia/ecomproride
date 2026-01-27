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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Warehouse Hub</h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all">
          + Add New Item
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Item Code</th>
                    <th className="px-6 py-4">Product Info</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-center">Stock</th>
                    <th className="px-6 py-4 text-right">Sell (RM)</th>
                    <th className="px-6 py-4"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                            <p className="font-bold text-blue-600 text-sm">PR-{p.id.toString().padStart(4, '0')}</p>
                        </td>
                        <td className="px-6 py-5">
                            <p className="font-bold text-slate-700 text-sm">{p.name_en}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">{p.brand_name}</p>
                        </td>
                        <td className="px-6 py-5">
                            <p className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded inline-block">{p.category}</p>
                        </td>
                        <td className="px-6 py-5 text-center">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold">10</span>
                        </td>
                        <td className="px-6 py-5 text-right font-black text-slate-700 text-sm">
                            {p.price_b2c.toFixed(2)}
                        </td>
                        <td className="px-6 py-5 text-right">
                            <button className="text-slate-300 hover:text-blue-600 transition-all text-sm">✎</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {products.length === 0 && !loading && (
            <div className="p-20 text-center text-slate-400 text-sm italic">Inventory is empty.</div>
        )}
      </div>
    </div>
  )
}