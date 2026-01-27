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
      <div className="flex justify-between items-center px-2">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Inventory</h2>
        <button className="bg-[#2563eb] hover:bg-blue-700 text-white px-5 py-2 rounded-md font-bold text-xs flex items-center gap-2 transition-all">
          + Add New Item
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-[#fcfcfd]">
                <tr>
                    <th className="table-head">Item Code</th>
                    <th className="table-head">Product Info</th>
                    <th className="table-head">Pos / Type</th>
                    <th className="table-head text-center">Stock</th>
                    <th className="table-head text-right">Sell (RM)</th>
                    <th className="table-head"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* ITEM CODE COLUMN */}
                        <td className="px-6 py-4">
                            <p className="item-code-primary">MIS{p.id}W50{p.id}LG</p>
                            <p className="item-code-secondary">MIS{p.id}W50{p.id}LG</p>
                        </td>

                        {/* PRODUCT INFO COLUMN */}
                        <td className="px-6 py-4">
                            <p className="font-semibold text-slate-700 text-sm">{p.name_en}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{p.brand_name || 'Brand Name'}</p>
                        </td>

                        {/* CATEGORY/POS COLUMN */}
                        <td className="px-6 py-4">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">{p.category || 'Standard'}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase">Min</p>
                        </td>

                        {/* STOCK COLUMN */}
                        <td className="px-6 py-4 text-center">
                            <span className="bg-green-50 text-green-600 border border-green-100 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
                                10
                            </span>
                        </td>

                        {/* PRICE COLUMN */}
                        <td className="px-6 py-4 text-right">
                            <span className="font-bold text-slate-700 text-sm">
                                {p.price_b2c.toFixed(2)}
                            </span>
                        </td>

                        {/* ACTION COLUMN */}
                        <td className="px-6 py-4 text-right">
                            <button className="text-slate-300 hover:text-blue-600 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {products.length === 0 && !loading && (
            <div className="py-20 text-center text-slate-300 text-sm font-medium italic">Empty warehouse records.</div>
        )}
      </div>
    </div>
  )
}