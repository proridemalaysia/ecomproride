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

      // 1. Fail-safe update if returning from successful payment
      if (statusId === '1') {
        await supabase.from('orders').update({ status: 'PAID' }).eq('id', orderId);
      }

      // 2. Fetch Order Data and Company Letterhead
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

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-bold text-slate-400 animate-pulse uppercase tracking-widest text-xs">Syncing Hub...</div>
  if (!order) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-bold text-slate-300 uppercase">Order Not Found</div>

  const subtotal = order.items_json?.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0) || 0;
  const shippingFee = order.total_amount - subtotal + (order.discount_applied || 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-4 md:p-10">
      
      {/* --- PROFESSIONAL PRINT RECEIPT (Hidden on Web) --- */}
      <div className="hidden print:block bg-white text-black p-0 uppercase not-italic">
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
            <div className="flex gap-4 items-center">
                {company?.logo_url && <img src={company.logo_url} className="h-10 w-auto grayscale" alt="logo" />}
                <div>
                    <h1 className="text-lg font-black leading-none mb-1">{company?.name}</h1>
                    <p className="text-[7px] font-bold leading-tight max-w-xs opacity-80">
                        {company?.address}<br/>
                        TEL: {company?.phone} | {company?.registration_no}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <h2 className="text-xl font-black leading-none mb-1">OFFICIAL RECEIPT</h2>
                <p className="text-[8px] font-bold tracking-tighter text-slate-500">DATE: {new Date(order.created_at).toLocaleDateString('en-GB')}</p>
                <p className="text-[8px] font-bold tracking-tighter text-slate-500">REF: #{order.id.slice(0,8).toUpperCase()}</p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-8">
            <div className="space-y-1">
                <p className="text-[8px] font-black border-b border-black mb-2 opacity-50 uppercase tracking-widest">Customer Details</p>
                <p className="text-[10px] font-bold leading-relaxed">
                    {order.customer_name}<br/>
                    {order.whatsapp}<br/>
                    {order.address}
                </p>
            </div>
            <div className="space-y-1 text-right">
                <p className="text-[8px] font-black border-b border-black mb-2 opacity-50 uppercase tracking-widest">Payment Info</p>
                <p className="text-[10px] font-bold">Status: {order.status}</p>
                <p className="text-[10px] font-bold">Method: ToyyibPay FPX</p>
            </div>
        </div>

        <table className="w-full text-left mb-10 border-collapse">
            <thead className="border-b border-black">
                <tr className="text-[8px] font-black opacity-50">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Total</th>
                </tr>
            </thead>
            <tbody className="text-[9px] font-bold">
                {order.items_json?.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100">
                        <td className="py-3">{item.brand_name} - {item.name_en}</td>
                        <td className="py-3 text-center">{item.qty}</td>
                        <td className="py-3 text-right">{formatMoney(item.price)}</td>
                        <td className="py-3 text-right">{formatMoney(item.price * item.qty)}</td>
                    </tr>
                ))}
                
                {/* FREE GIFTS IN TABLE */}
                {order.free_gift_info && (
                    <tr className="border-b border-slate-100 italic text-blue-600">
                        <td className="py-3 italic">Reward: {order.free_gift_info}</td>
                        <td className="py-3 text-center">1</td>
                        <td className="py-3 text-right">RM 0.00</td>
                        <td className="py-3 text-right">RM 0.00</td>
                    </tr>
                )}

                {/* CALCULATIONS */}
                <tr><td colSpan={3} className="pt-6 text-right font-bold text-slate-400">Subtotal</td><td className="pt-6 text-right font-bold">{formatMoney(subtotal)}</td></tr>
                <tr><td colSpan={3} className="py-1 text-right font-bold text-slate-400">Shipping Fee</td><td className="py-1 text-right font-bold">{formatMoney(shippingFee)}</td></tr>
                
                {order.voucher_code && (
                    <tr><td colSpan={3} className="py-1 text-right font-black text-green-600 italic">Voucher ({order.voucher_code})</td><td className="py-1 text-right font-black text-green-600">- {formatMoney(order.discount_applied)}</td></tr>
                )}

                <tr>
                    <td colSpan={3} className="py-4 text-right font-black text-sm">Amount Paid (MYR)</td>
                    <td className="py-4 text-right font-black text-base border-t-2 border-black">{formatMoney(order.total_amount)}</td>
                </tr>
            </tbody>
        </table>

        <div className="mt-20 text-center opacity-30">
            <p className="text-[7px] font-bold italic tracking-widest">This is a computer generated document. No signature required.</p>
        </div>
      </div>

      {/* --- MODERN WEB VIEW (Dashboard Style) --- */}
      <div className="print:hidden max-w-4xl mx-auto bg-white border border-slate-200 p-8 md:p-12 shadow-2xl rounded-[3rem] relative overflow-hidden italic uppercase">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#e11d48] to-[#f97316]"></div>
        
        <div className="flex justify-between items-start mb-12">
            <div>
                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-slate-900 leading-none mb-2">SUCCESS</h1>
                <p className="text-slate-400 font-bold text-[10px] tracking-widest italic leading-none">Order Ref: #{order.id.slice(0,8).toUpperCase()}</p>
            </div>
            {company?.logo_url && <img src={company.logo_url} className="h-12 w-auto grayscale opacity-50" alt="logo" />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 py-10 border-y border-slate-50">
            <div><p className="text-slate-400 text-[10px] font-black mb-1 tracking-widest">Payment</p><p className="font-black italic text-xl text-green-500">{order.status}</p></div>
            <div><p className="text-slate-400 text-[10px] font-black mb-1 tracking-widest">Amount Paid</p><p className="font-black italic text-xl text-slate-900">{formatMoney(order.total_amount)}</p></div>
            <div><p className="text-slate-400 text-[10px] font-black mb-1 tracking-widest">Shipment</p><p className="font-black italic text-xl text-slate-300">{order.tracking_number || 'PREPARING'}</p></div>
        </div>

        {/* WEB ITEM LISTING */}
        <div className="mb-12 space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 tracking-widest border-b pb-2 italic leading-none">Order Breakdown</h3>
            {order.items_json?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm border-b border-slate-50 pb-4">
                    <div className="flex-1">
                        <p className="font-bold text-slate-700 leading-none mb-1">{item.name_en}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase italic">{item.qty} unit(s) @ {formatMoney(item.price)}</p>
                    </div>
                    <p className="font-black text-slate-900 italic">{formatMoney(item.price * item.qty)}</p>
                </div>
            ))}
            
            {/* WEB GIFTS VIEW */}
            {order.free_gift_info && (
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 italic tracking-widest leading-none">Included Gift: {order.free_gift_info}</p>
                    <p className="text-[10px] font-black text-blue-600">FREE</p>
                </div>
            )}
        </div>

        <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 mb-12">
            <h3 className="text-[9px] font-black text-slate-400 mb-2 tracking-widest italic uppercase">Delivery Address</h3>
            <p className="text-slate-700 font-bold text-sm leading-relaxed tracking-tight italic uppercase">{order.customer_name}<br/>{order.address}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
            <Link href="/products" className="flex-1 bg-[#0f172a] text-white py-6 font-bold text-center text-xs tracking-widest rounded-2xl hover:bg-[#e11d48] transition-all italic uppercase">
                Continue Shopping
            </Link>
            <button onClick={() => window.print()} className="flex-1 border-2 border-slate-100 text-slate-500 py-6 font-bold text-xs tracking-widest rounded-2xl hover:bg-slate-50 italic uppercase">
                Print Official Receipt
            </button>
        </div>
      </div>
    </div>
  )
}

export default function OrderStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] animate-pulse"></div>}>
      <StatusContent />
    </Suspense>
  )
}