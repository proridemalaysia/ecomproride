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
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount);
  };

  useEffect(() => {
    async function fetchData() {
      if (!orderId) return;
      if (statusId === '1') await supabase.from('orders').update({ status: 'PAID' }).eq('id', orderId);
      const [orderRes, companyRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', orderId).single(),
        supabase.from('company_profile').select('*').eq('id', 1).single()
      ]);
      setOrder(orderRes.data); setCompany(companyRes.data); setLoading(false);
    }
    fetchData()
  }, [orderId, statusId])

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-bold text-slate-400 animate-pulse italic">GENERATING...</div>
  if (!order) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-bold text-slate-300">ORDER NOT FOUND</div>

  const subtotal = order.items_json?.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0) || 0;
  const shippingFee = order.total_amount - subtotal + (order.discount_applied || 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-4 md:p-10 italic uppercase">
      
      {/* PRINT RECEIPT */}
      <div className="hidden print:block bg-white text-black p-0 not-italic">
        <div className="flex justify-between items-center border-b-2 border-black pb-8 mb-8">
            <img src="https://vaqlsjjkcctuwrskssga.supabase.co/storage/v1/object/public/logo/KEfullsq.png" className="h-20 w-auto" alt="KE Full Logo" />
            <div className="text-right">
                <h2 className="text-2xl font-black leading-none mb-2">OFFICIAL RECEIPT</h2>
                <p className="text-[9px] font-bold">DATE: {new Date(order.created_at).toLocaleDateString('en-GB')}</p>
                <p className="text-[9px] font-bold">REF: #{order.id.slice(0,8).toUpperCase()}</p>
            </div>
        </div>
        <div className="mb-8"><p className="text-[8px] font-bold opacity-70 whitespace-pre-wrap">{company?.address} | {company?.registration_no}</p></div>
        
        {/* Table logic remains same as previous step, now anchored by new logo */}
        <table className="w-full text-left mb-10 border-collapse">
            <thead className="border-b border-black"><tr className="text-[8px] font-black uppercase tracking-widest"><th>Description</th><th className="text-center">Qty</th><th className="text-right">Unit</th><th className="text-right">Total</th></tr></thead>
            <tbody className="text-[9px] font-bold">
                {order.items_json?.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100"><td className="py-3">{item.brand_name} - {item.name_en}</td><td className="py-3 text-center">{item.qty}</td><td className="py-3 text-right">{formatMoney(item.price)}</td><td className="py-3 text-right">{formatMoney(item.price * item.qty)}</td></tr>
                ))}
                <tr><td colSpan={3} className="py-6 text-right font-bold text-slate-400">Total Paid (MYR)</td><td className="py-6 text-right font-black text-sm">{formatMoney(order.total_amount)}</td></tr>
            </tbody>
        </table>
      </div>

      {/* WEB VIEW */}
      <div className="print:hidden max-w-4xl mx-auto bg-white border border-slate-100 p-8 md:p-16 shadow-2xl rounded-[3rem] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#e11d48] to-[#f97316]"></div>
        <div className="flex justify-between items-start mb-12">
            <div><h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-slate-900 leading-none mb-2 uppercase">SUCCESS</h1><p className="text-slate-400 font-bold text-[10px] tracking-widest italic">REF: #{order.id.slice(0,8).toUpperCase()}</p></div>
            <img src="https://vaqlsjjkcctuwrskssga.supabase.co/storage/v1/object/public/logo/KEfullsq.png" className="h-16 w-auto grayscale opacity-80" alt="logo" />
        </div>
        {/* ... Rest of the status content ... */}
        <div className="flex flex-col sm:flex-row gap-6 mt-12">
            <Link href="/products" className="flex-1 bg-slate-900 text-white py-6 font-bold text-center text-xs rounded-2xl hover:bg-[#e11d48] transition-all">CONTINUE SHOPPING</Link>
            <button onClick={() => window.print()} className="flex-1 border-2 border-slate-100 text-slate-500 py-6 font-bold text-xs rounded-2xl hover:bg-slate-50">PRINT OFFICIAL RECEIPT</button>
        </div>
      </div>
    </div>
  )
}
export default function OrderStatusPage() { return ( <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]"></div>}><StatusContent /></Suspense> ) }