"use client"
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function StatusContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const statusId = searchParams.get('status_id')

  const [order, setOrder] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  useEffect(() => {
    async function fetchData() {
      if (!orderId) return;

      if (statusId === '1') {
        await supabase.from('orders').update({ status: 'PAID' }).eq('id', orderId);
      }

      const [orderRes, companyRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', orderId).single(),
        supabase.from('company_profile').select('*').eq('id', 1).single()
      ]);
      
      setOrder(orderRes.data)
      setCompany(companyRes.data)
      setLoading(false)
    }
    fetchData()
  }, [orderId, statusId])

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-bold text-slate-400 animate-pulse">GENERATING SUMMARY...</div>
  if (!order) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-bold text-slate-300">ORDER NOT FOUND</div>

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-4 md:p-10">
      
      {/* --- PROFESSIONAL PRINT LAYOUT --- */}
      <div className="hidden print:block bg-white text-black p-0 uppercase">
        {/* Adjusted Smaller Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
            <div className="flex gap-4 items-center">
                {company?.logo_url && <img src={company.logo_url} className="h-12 w-auto grayscale" alt="logo" />}
                <div>
                    <h1 className="text-xl font-black leading-none mb-1">{company?.name}</h1>
                    <p className="text-[8px] font-bold leading-tight max-w-xs opacity-70">
                        {company?.address}<br/>
                        TEL: {company?.phone} | {company?.registration_no}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-black leading-none mb-2">OFFICIAL RECEIPT</h2>
                <p className="text-[9px] font-bold">DATE: {new Date(order.created_at).toLocaleDateString('en-GB')}</p>
                <p className="text-[9px] font-bold">REF: #{order.id.slice(0,8).toUpperCase()}</p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-8">
            <div className="space-y-1">
                <p className="text-[9px] font-black border-b border-black mb-2">BILL TO</p>
                <p className="text-[10px] font-bold leading-relaxed">
                    {order.customer_name}<br/>
                    {order.whatsapp}<br/>
                    {order.address}
                </p>
            </div>
            <div className="space-y-1">
                <p className="text-[9px] font-black border-b border-black mb-2">TRANSACTION</p>
                <p className="text-[10px] font-bold">STATUS: <span className="underline">{order.status}</span></p>
                <p className="text-[10px] font-bold">METHOD: TOYYIBPAY FPX</p>
            </div>
        </div>

        {/* PRINT ITEMS TABLE */}
        <table className="w-full text-left mb-10 border-collapse">
            <thead className="border-b-2 border-black">
                <tr className="text-[9px] font-black">
                    <th className="py-2">DESCRIPTION</th>
                    <th className="py-2 text-center">QTY</th>
                    <th className="py-2 text-right">UNIT PRICE</th>
                    <th className="py-2 text-right">TOTAL</th>
                </tr>
            </thead>
            <tbody className="text-[10px] font-bold">
                {order.items_json?.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100">
                        <td className="py-3">{item.brand_name} - {item.name_en}</td>
                        <td className="py-3 text-center">{item.qty}</td>
                        <td className="py-3 text-right">{formatMoney(item.price)}</td>
                        <td className="py-3 text-right">{formatMoney(item.price * item.qty)}</td>
                    </tr>
                ))}
                <tr>
                    <td colSpan={3} className="py-4 text-right font-black">GRAND TOTAL (MYR)</td>
                    <td className="py-4 text-right font-black text-sm border-t-2 border-black">{formatMoney(order.total_amount)}</td>
                </tr>
            </tbody>
        </table>

        <div className="text-center opacity-50">
            <p className="text-[8px] font-bold italic">Computer generated. No signature required.</p>
        </div>
      </div>

      {/* --- MODERN WEB VIEW --- */}
      <div className="print:hidden max-w-4xl mx-auto bg-white border border-slate-100 p-8 md:p-12 shadow-2xl rounded-[2.5rem] relative overflow-hidden uppercase">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#e11d48] to-[#f97316]"></div>
        
        <div className="flex justify-between items-start mb-12">
            <div>
                <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none mb-2">SUCCESS</h1>
                <p className="text-slate-400 font-bold text-[10px] tracking-widest italic">Order Reference: #{order.id.slice(0,8).toUpperCase()}</p>
            </div>
            {company?.logo_url && <img src={company.logo_url} className="h-12 w-auto grayscale" alt="logo" />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 py-10 border-y border-slate-50">
            <div><p className="text-slate-400 text-[10px] font-black mb-1 tracking-widest">PAYMENT</p><p className="font-black italic text-xl text-green-500">{order.status}</p></div>
            <div><p className="text-slate-400 text-[10px] font-black mb-1 tracking-widest">TOTAL PAID</p><p className="font-black italic text-xl text-slate-900">{formatMoney(order.total_amount)}</p></div>
            <div><p className="text-slate-400 text-[10px] font-black mb-1 tracking-widest">SHIPMENT</p><p className="font-black italic text-xl text-slate-300">{order.tracking_number || 'PREPARING'}</p></div>
        </div>

        {/* WEB ITEM SUMMARY */}
        <div className="mb-12 space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 tracking-widest border-b pb-2">PURCHASED ITEMS</h3>
            {order.items_json?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                        <p className="font-bold text-slate-700 leading-none">{item.name_en}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase italic">{item.qty} UNIT(S) @ {formatMoney(item.price)}</p>
                    </div>
                    <p className="font-black text-slate-900">{formatMoney(item.price * item.qty)}</p>
                </div>
            ))}
        </div>

        <div className="bg-slate-50/50 p-8 rounded-2xl border border-slate-100 mb-12">
            <h3 className="text-[9px] font-black text-slate-400 mb-2 tracking-widest italic">DELIVERY DESTINATION</h3>
            <p className="text-slate-700 font-bold text-sm leading-relaxed tracking-tight">{order.customer_name}<br/>{order.address}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/products" className="flex-1 bg-[#0f172a] text-white py-6 font-bold text-center text-xs tracking-widest rounded-xl hover:bg-[#e11d48] transition-all">
                CONTINUE SHOPPING
            </Link>
            <button onClick={() => window.print()} className="flex-1 border-2 border-slate-100 text-slate-500 py-6 font-bold text-xs tracking-widest rounded-xl hover:bg-slate-50">
                PRINT OFFICIAL RECEIPT
            </button>
        </div>
      </div>
    </div>
  )
}

export default function OrderStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]"></div>}>
      <StatusContent />
    </Suspense>
  )
}