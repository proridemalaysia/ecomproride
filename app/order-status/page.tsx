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

      // 1. Sync Payment Status
      if (statusId === '1') {
        await supabase.from('orders').update({ status: 'PAID' }).eq('id', orderId);
      }

      // 2. Fetch Order and Company Profile
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

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-black italic animate-pulse">GENERATING INVOICE...</div>
  if (!order) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-black uppercase text-slate-300 text-center">Record Not Found</div>

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-4 md:p-10">
      
      {/* 1. PROFESSIONAL PRINT LAYOUT (Hidden on web, visible on print) */}
      <div className="hidden print:block bg-white p-0 text-black uppercase not-italic">
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
            <div>
                <h1 className="text-4xl font-black tracking-tighter mb-2">{company?.name}</h1>
                <p className="text-[10px] font-bold leading-relaxed whitespace-pre-wrap max-w-sm">
                    {company?.address}<br/>
                    TEL: {company?.phone} | EMAIL: {company?.email}<br/>
                    {company?.registration_no}
                </p>
            </div>
            <div className="text-right">
                <h2 className="text-5xl font-black text-slate-200 leading-none mb-4">OFFICIAL<br/>RECEIPT</h2>
                <p className="text-xs font-bold">DATE: {new Date(order.created_at).toLocaleDateString('en-MY')}</p>
                <p className="text-xs font-bold">REF: #{order.id.slice(0,8).toUpperCase()}</p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-20 mb-12">
            <div>
                <h4 className="text-[10px] font-black border-b border-black mb-4 pb-1">BILL TO:</h4>
                <p className="text-sm font-bold leading-loose">
                    {order.customer_name}<br/>
                    {order.whatsapp}<br/>
                    {order.address}
                </p>
            </div>
            <div>
                <h4 className="text-[10px] font-black border-b border-black mb-4 pb-1">PAYMENT DETAILS:</h4>
                <div className="flex justify-between text-xs mb-2"><span>Status:</span><span className="font-black underline">{order.status}</span></div>
                <div className="flex justify-between text-xs mb-2"><span>Method:</span><span className="font-black">TOYYIBPAY FPX</span></div>
                <div className="flex justify-between text-xl font-black mt-4 pt-4 border-t-2 border-black">
                    <span>TOTAL PAID</span>
                    <span>{formatMoney(order.total_amount)}</span>
                </div>
            </div>
        </div>

        <div className="mt-20 text-center border-t border-slate-100 pt-10">
            <p className="text-[9px] font-bold text-slate-400">This is a computer-generated receipt. No signature is required.</p>
        </div>
      </div>

      {/* 2. MODERN WEB VIEW (Visible on web, hidden on print) */}
      <div className="print:hidden max-w-4xl mx-auto bg-white border border-slate-200 p-8 md:p-16 shadow-2xl rounded-[2.5rem] relative overflow-hidden italic uppercase">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#e11d48] to-[#f97316]"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
            <div>
                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none mb-2 text-slate-900">
                    {order.status === 'PAID' ? 'SUCCESS' : 'PENDING'}
                </h1>
                <p className="text-slate-400 font-bold tracking-[0.3em] text-[10px]">Reference: #{order.id.slice(0,8).toUpperCase()}</p>
            </div>
            {company?.logo_url && <img src={company.logo_url} className="h-16 w-auto grayscale" alt="logo" />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16 py-12 border-y border-slate-50">
            <div className="space-y-2">
                <p className="text-slate-400 text-[9px] font-black tracking-widest">STATUS</p>
                <p className={`font-black italic text-2xl ${order.status === 'PAID' ? 'text-green-500' : 'text-brand-orange animate-pulse'}`}>{order.status}</p>
            </div>
            <div className="space-y-2">
                <p className="text-slate-400 text-[9px] font-black tracking-widest">TOTAL PAID</p>
                <p className="font-black italic text-2xl text-slate-900">{formatMoney(order.total_amount)}</p>
            </div>
            <div className="space-y-2">
                <p className="text-slate-400 text-[9px] font-black tracking-widest">SHIPMENT</p>
                <p className="font-black italic text-xl text-slate-300">{order.tracking_number || 'PREPARING (HQ)'}</p>
            </div>
        </div>

        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 mb-16">
            <h3 className="text-[9px] font-black text-slate-400 mb-4 tracking-widest">DELIVERY DESTINATION</h3>
            <p className="text-slate-900 font-bold text-sm leading-relaxed tracking-tight">
                {order.customer_name}<br/>
                {order.address}
            </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/products" className="flex-1 bg-slate-900 text-white py-6 font-bold text-center text-xs tracking-widest rounded-xl hover:bg-[#e11d48] transition-all">
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