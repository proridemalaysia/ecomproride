"use client"
import { useCart } from '@/context/CartContext'
import { useState, useEffect } from 'react'
import { calculateShipping } from '@/lib/shipping'
import { getStateByPostcode, commonTowns } from '@/lib/postcodes'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function CheckoutPage() {
  const { cart, clearCart, updateQty, removeItem } = useCart()
  const [loading, setLoading] = useState(false)
  
  const [customer, setCustomer] = useState({ name: '', email: '', whatsapp: '' })
  const [address, setAddress] = useState({ street: '', postcode: '', town: '', state: '' })
  const [townSuggestions, setTownSuggestions] = useState<string[]>([])
  
  const [shippingData, setShippingData] = useState<{weightInfo: string, options: any[]}>({ weightInfo: '0', options: [] })
  const [selectedCourier, setSelectedCourier] = useState<any>(null)

  // CURRENCY FORMATTER
  const formatMoney = (amount: any) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return 'RM 0.00';
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const itemsTotal = cart.reduce((acc: number, item: any) => acc + (Number(item.price || 0) * item.qty), 0)
  const grandTotal = itemsTotal + (selectedCourier?.totalCost || 0)

  useEffect(() => {
    if (address.postcode.length === 5) {
      const detectedState = getStateByPostcode(address.postcode)
      setAddress(prev => ({ ...prev, state: detectedState }))
      const towns = commonTowns[address.postcode] || []
      setTownSuggestions(towns)
      if (towns.length > 0 && !address.town) setAddress(prev => ({ ...prev, town: towns[0] }))
      
      const result = calculateShipping(address.postcode, cart)
      setShippingData(result)
      if (result.options.length > 0) setSelectedCourier(result.options[0])
    }
  }, [address.postcode, cart])

  const handlePlaceOrder = async () => {
    if (!customer.name || !customer.whatsapp || !customer.email || !selectedCourier) {
      alert('Sila lengkapkan maklumat perhubungan dan penghantaran.'); return;
    }
    setLoading(true)
    try {
      const { data: order, error: dbError } = await supabase.from('orders').insert([{
        customer_name: customer.name, email: customer.email, whatsapp: customer.whatsapp,
        address: `${address.street}, ${address.town}, ${address.postcode}, ${address.state}`,
        total_amount: grandTotal, status: 'PENDING'
      }]).select().single()

      if (dbError) throw dbError
      
      const payResponse = await fetch('/api/checkout/toyyibpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, total: grandTotal, customer, cart })
      })
      const payData = await payResponse.json()
      if (payData.url) { clearCart(); window.location.href = payData.url; }
    } catch (err: any) { alert(err.message) } finally { setLoading(false) }
  }

  const labelStyle = "text-[10px] font-black text-slate-400 tracking-widest mb-2 block uppercase italic"
  const inputStyle = "w-full bg-white border border-slate-200 p-5 text-sm font-bold text-slate-900 outline-none focus:border-[#f97316] transition-all uppercase rounded-lg"

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans uppercase italic p-4 md:p-12 pt-32 md:pt-40">
      <nav className="fixed top-0 w-full left-0 p-6 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-black italic tracking-tighter uppercase">CHASSIS <span className="text-[#e11d48]">PRO</span></Link>
            <Link href="/products" className="text-[10px] font-black text-slate-400">← BACK TO SHOP</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
          
          <div className="lg:col-span-2 space-y-12">
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/50">
                <h3 className="font-black text-xs mb-8 italic text-[#e11d48] tracking-widest flex items-center gap-2">
                    <span className="w-6 h-6 bg-[#e11d48] text-white rounded-full flex items-center justify-center not-italic">01</span> 
                    Contact Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-italic">
                    <div className="md:col-span-2"><label className={labelStyle}>Full Name</label><input onChange={e => setCustomer({...customer, name: e.target.value})} className={inputStyle} /></div>
                    <div><label className={labelStyle}>WhatsApp No</label><input onChange={e => setCustomer({...customer, whatsapp: e.target.value})} className={inputStyle} /></div>
                    <div><label className={labelStyle}>Email Address</label><input onChange={e => setCustomer({...customer, email: e.target.value})} className={inputStyle} /></div>
                </div>
            </section>

            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/50">
                <h3 className="font-black text-xs mb-8 italic text-[#e11d48] tracking-widest flex items-center gap-2">
                    <span className="w-6 h-6 bg-[#e11d48] text-white rounded-full flex items-center justify-center not-italic">02</span> 
                    Delivery Destination
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-italic">
                    <div className="md:col-span-2"><label className={labelStyle}>Street Address</label><input onChange={e => setAddress({...address, street: e.target.value})} className={inputStyle} /></div>
                    <div><label className={labelStyle}>Postcode</label><input value={address.postcode} onChange={e => setAddress({...address, postcode: e.target.value})} className={`${inputStyle} text-[#f97316] text-xl font-black`} maxLength={5} /></div>
                    <div><label className={labelStyle}>Town</label><input value={address.town} onChange={e => setAddress({...address, town: e.target.value})} className={inputStyle} /></div>
                </div>
            </section>

            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/50">
                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                    <h3 className="font-black text-xs italic text-[#e11d48] tracking-widest">03. Courier Choice</h3>
                    <span className="text-[10px] font-black text-slate-400">CHARGEABLE: {shippingData.weightInfo} KG</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-italic">
                    {shippingData.options.map(c => (
                        <div key={c.name} onClick={() => setSelectedCourier(c)} className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${selectedCourier?.name === c.name ? 'border-[#f97316] bg-orange-50 shadow-md' : 'border-slate-100'}`}>
                            <p className="font-black text-[10px] text-slate-400 uppercase italic tracking-tighter">{c.name}</p>
                            <p className="font-black text-xl text-slate-900 mt-2">{formatMoney(c.totalCost)}</p>
                        </div>
                    ))}
                </div>
            </section>
          </div>

          {/* RIGHT: ORDER SUMMARY WITH REMOVE LINK */}
          <div className="lg:sticky lg:top-32 h-fit">
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-2xl space-y-8 relative overflow-hidden not-italic">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#e11d48] to-[#f97316]"></div>
              <h2 className="text-xl font-black italic border-b border-slate-100 pb-4 uppercase text-slate-900">Order Summary</h2>
              
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item: any) => (
                    <div key={item.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative group">
                        <p className="font-black text-slate-900 text-xs leading-tight uppercase italic">{item.brand_name} - {item.name_en}</p>
                        <p className="text-slate-400 text-[9px] mt-1 font-bold">{formatMoney(item.price)} / UNIT</p>
                        
                        <div className="flex items-center justify-between mt-4 border-t border-slate-200 pt-4">
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <button onClick={() => updateQty(item.id, -1)} className="px-4 py-2 hover:bg-[#e11d48] hover:text-white transition-all font-black text-lg">-</button>
                                <span className="px-5 py-2 text-sm font-black text-slate-900">{item.qty}</span>
                                <button onClick={() => updateQty(item.id, 1)} className="px-4 py-2 hover:bg-[#e11d48] hover:text-white transition-all font-black text-lg">+</button>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-slate-900 text-sm mb-1">{formatMoney(Number(item.price) * item.qty)}</p>
                                {/* REMOVE BUTTON ADDED HERE */}
                                <button 
                                    onClick={() => removeItem(item.id)}
                                    className="text-[9px] font-black text-slate-300 hover:text-[#e11d48] transition-colors uppercase italic tracking-widest"
                                >
                                    Remove Part [X]
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t-2 border-slate-100">
                <div className="flex justify-between text-xs font-black text-slate-400 uppercase italic">
                    <span>Subtotal</span>
                    <span className="text-slate-900">{formatMoney(itemsTotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-slate-400 uppercase italic">
                    <span>Shipping Fee ({shippingData.weightInfo} KG)</span>
                    <span className="text-[#f97316]">{selectedCourier ? formatMoney(selectedCourier.totalCost) : '--'}</span>
                </div>
                <div className="pt-8 mt-6 border-t-2 border-slate-900">
                    <p className="font-black text-[10px] italic text-slate-400 uppercase mb-2">Grand Total Payment</p>
                    <div className="text-4xl md:text-5xl font-black text-[#e11d48] tracking-tighter italic leading-none truncate uppercase">
                        {formatMoney(grandTotal)}
                    </div>
                </div>
              </div>

              <button onClick={handlePlaceOrder} disabled={loading || cart.length === 0 || !selectedCourier} className="w-full bg-[#0f172a] text-white py-7 font-black uppercase italic tracking-[0.2em] hover:bg-[#e11d48] transition-all shadow-xl rounded-2xl active:scale-95 disabled:opacity-30">
                {loading ? 'PROCESSING...' : 'PLACE ORDER & PAY'}
              </button>
            </div>
          </div>
      </div>
    </div>
  )
}