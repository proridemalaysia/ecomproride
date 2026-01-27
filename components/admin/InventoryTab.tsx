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
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Inventory</h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20">
          + Add New Item
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="erp-table">
            <thead>
                <tr>
                    <th>Item Code</th>
                    <th>Product Info</th>
                    <th>Pos / Type</th>
                    <th className="text-center">Stock</th>
                    <th className="text-right">Sell (RM)</th>
                    <th></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        {/* ITEM CODE */}
                        <td className="w-48">
                            <p className="font-bold text-blue-800 text-sm tracking-tight">MIS20W504LG</p>
                            <p className="text-[10px] text-slate-400 font-medium">MIS20W504LG</p>
                        </td>

                        {/* PRODUCT INFO */}
                        <td>
                            <p className="font-bold text-slate-700 text-sm">{p.name_en}</p>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">{p.brand_name}</p>
                        </td>

                        {/* POS / TYPE */}
                        <td className="w-40">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">{p.category}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase italic">Min</p>
                        </td>

                        {/* STOCK */}
                        <td className="text-center">
                            <span className="bg-green-50 text-green-700 px-3 py-1 rounded-md text-[10px] font-bold border border-green-100">
                                10
                            </span>
                        </td>

                        {/* PRICE */}
                        <td className="text-right font-bold text-slate-700 text-sm">
                            {p.price_b2c.toFixed(2)}
                        </td>

                        {/* ACTION */}
                        <td className="text-right w-20">
                            <button className="text-slate-300 hover:text-blue-600 text-xl font-bold">✎</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {products.length === 0 && !loading && (
            <div className="p-20 text-center text-slate-300 italic">No inventory items found.</div>
        )}
      </div>
    </div>
  )
}