"use client"
import { useEffect, useState, useCallback } from 'react'
import { useCart } from '@/context/CartContext'
import { calculateShipping } from '@/lib/shipping'
import { getStateByPostcode, commonTowns } from '@/lib/postcodes'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function CheckoutPage() {
  const { cart, clearCart, updateQty, removeItem } = useCart()
  const [loading, setLoading] = useState(false)
  
  // 1. FORM STATES
  const [customer, setCustomer] = useState({ name: '', email: '', whatsapp: '' })
  const [address, setAddress] = useState({ street: '', postcode: '', town: '', state: '' })
  const [townSuggestions, setTownSuggestions] = useState<string[]>([])
  
  // 2. SHIPPING & LOGISTICS
  const [shippingData, setShippingData] = useState<{weightInfo: string, options: any[]}>({ weightInfo: '0.00', options: [] })
  const [selectedCourier, setSelectedCourier] = useState<any>(null)

  // 3. CAMPAIGN STATES (Gifts & Vouchers)
  const [wantsSticker, setWantsSticker] = useState(false)
  const [tshirtSize, setTshirtSize] = useState('')
  const [availableGifts, setAvailableGifts] = useState<any[]>([])
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null)

  // 4. CALCULATIONS
  const formatMoney = (amount: any) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0.00';
    return new Intl.NumberFormat('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const hasFullSet = cart.some((item: any) => item.name_en?.toLowerCase().includes('full set'));
  const itemsTotal = cart.reduce((acc: number, item: any) => acc + (Number(item.price || 0) * item.qty), 0)
  const discount = appliedVoucher ? Number(appliedVoucher.discount_amount) : 0
  const grandTotal = Math.max(0, itemsTotal + Number(selectedCourier?.totalCost || 0) - discount)

  // 5. DATA FETCHING
  useEffect(() => {
    async function getGifts() {
        const { data } = await supabase.from('free_gifts').select('*').gt('stock', 0)
        setAvailableGifts(data || [])
    }
    getGifts()
  }, [])

  // 6. SMART LOGISTICS ENGINE
  const updateLogistics = useCallback(() => {
    if (address.postcode.length === 5 && cart.length > 0) {
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

  useEffect(() => { updateLogistics() }, [updateLogistics])

  // 7. PLACE ORDER ACTION
  const handlePlaceOrder = async () => {
    if (!customer.name || !customer.whatsapp || !customer.email || !selectedCourier || !address.state) {
      alert('Please complete all contact and shipping details.'); 
      return;
    }

    setLoading(true)
    let giftSummary = '';
    if (wantsSticker) giftSummary += 'Proride Sticker';
    if (tshirtSize) giftSummary += (giftSummary ? ' & ' : '') + `T-Shirt (${tshirtSize})`;

    try {
      const { data: order, error: dbError } = await supabase.from('orders').insert([{
        customer_name: customer.name, 
        email: customer.email, 
        whatsapp: customer.whatsapp,
        address: `${address.street}, ${address.town}, ${address.postcode}, ${address.state}`,
        total_amount: grandTotal, 
        status: 'PENDING',
        items_json: cart,
        free_gift_info: giftSummary,
        voucher_code: appliedVoucher?.code || null,
        discount_applied: discount
      }]).select().single()

      if (dbError) throw dbError
      
      const payResponse = await fetch('/api/checkout/toyyibpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, total: grandTotal, customer, cart })
      })
      const payData = await payResponse.json()
      if (payData.url) { 
        clearCart(); 
        window.location.href = payData.url; 
      }
    } catch (err: any) { 
        alert('Ralat: ' + err.message) 
    } finally { 
        setLoading(false) 
    }
  }

  // --- UI STYLING CONSTANTS ---
  const sectionCard = "bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm";
  const labelStyle = "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block";
  const inputStyle = "w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 transition-all";

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans pb-20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full left-0 p-5 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
            <Link href="/" className="flex items-center gap-3">
                <img src="https://vaqlsjjkcctuwrskssga.supabase.co/storage/v1/object/public/logo/KEsq.png" className="h-8 w-auto" alt="Logo" />
                <span className="text-xl font-bold tracking-tight">Chassis<span className="text-blue-600">Pro</span></span>
            </Link>
            <Link href="/products" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-tight">← Back to Shop</Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12 pt-28 md:pt-36">
        <header className="mb-12">
            <h1 className="text-3xl md:text-5xl font-bold text-slate-800 tracking-tight">Checkout Portal</h1>
            <p className="text-slate-400 text-sm mt-2 font-medium">Verify your items and select a delivery method</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* LEFT: INFORMATION FORMS */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* 01. GIFTS */}
            <section className={sectionCard}>
                <h3 className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-8">01. Free Rewards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div onClick={() => setWantsSticker(!wantsSticker)} className={`p-6 border-2 rounded-2xl cursor-pointer transition-all flex items-center gap-4 ${wantsSticker ? 'border-blue-600 bg-blue-50' : 'border-slate-50'}`}>
                        <div className={`w-6 h-6 rounded flex items-center justify-center border-2 ${wantsSticker ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}>{wantsSticker && <span className="text-white text-xs font-bold">✓</span>}</div>
                        <div><p className="font-bold text-sm text-slate-800">Proride Performance Sticker</p></div>
                    </div>
                    <div className={`p-6 border-2 rounded-2xl transition-all ${hasFullSet ? 'border-slate-100 bg-white shadow-sm' : 'border-dashed border-slate-200 opacity-50'}`}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Premium T-Shirt (Full Set Bonus)</p>
                        {hasFullSet ? (
                            <select value={tshirtSize} onChange={(e) => setTshirtSize(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-blue-600">
                                <option value="">Select Size</option>
                                {availableGifts.filter(g => g.name.includes('T-Shirt')).map(g => (<option key={g.id} value={g.size}>{g.size} ({g.stock} left)</option>))}
                            </select>
                        ) : ( <p className="text-xs font-bold text-slate-300 italic">Available for Full Set (4pcs) orders</p> )}
                    </div>
                </div>
            </section>

            {/* 02. VOUCHER */}
            <section className={sectionCard}>
                <h3 className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-8">02. Voucher Code</h3>
                <div className="flex gap-3">
                    <input className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold outline-none focus:border-blue-600 uppercase" placeholder="Enter code" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} />
                    <button onClick={async () => {
                        const { data } = await supabase.from('vouchers').select('*').eq('code', voucherCode.toUpperCase()).eq('is_active', true).single()
                        if (data) { setAppliedVoucher(data); alert("Voucher Applied!"); } else { alert("Code not found."); }
                    }} className="bg-slate-900 text-white px-10 rounded-xl font-bold text-xs uppercase hover:bg-blue-600 transition-all">Apply</button>
                </div>
            </section>

            {/* 03. SHIPPING */}
            <section className={sectionCard}>
                <h3 className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-8">03. Shipping Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2"><label className={labelStyle}>Recipient Full Name</label><input onChange={e => setCustomer({...customer, name: e.target.value})} className={inputStyle} placeholder="Name" /></div>
                    <div><label className={labelStyle}>WhatsApp Number</label><input onChange={e => setCustomer({...customer, whatsapp: e.target.value})} className={inputStyle} placeholder="601..." /></div>
                    <div><label className={labelStyle}>Email Address</label><input onChange={e => setCustomer({...customer, email: e.target.value})} className={inputStyle} placeholder="For receipt" /></div>
                    <div className="md:col-span-2"><label className={labelStyle}>Street Address</label><textarea onChange={e => setAddress({...address, street: e.target.value})} className={`${inputStyle} h-24 resize-none`} placeholder="Unit, House No, Street name" /></div>
                    <div><label className={labelStyle}>Postcode</label><input value={address.postcode} onChange={e => setAddress({...address, postcode: e.target.value})} className={inputStyle} maxLength={5} placeholder="43000" /></div>
                    <div><label className={labelStyle}>Town / City</label><input value={address.town} onChange={e => setAddress({...address, town: e.target.value})} className={inputStyle} placeholder="City" /></div>
                </div>
            </section>

            {/* 04. COURIER */}
            <section className={sectionCard}>
                <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
                    <h3 className="text-xs font-bold text-blue-600 tracking-widest uppercase">04. Delivery Service</h3>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tight">Weight: {shippingData.weightInfo} KG</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {shippingData.options.map(c => (
                        <div key={c.name} onClick={() => setSelectedCourier(c)} className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${selectedCourier?.name === c.name ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-slate-50 hover:border-slate-200 bg-white'}`}>
                            <p className="font-bold text-[10px] text-slate-400 uppercase tracking-tight mb-2">{c.name}</p>
                            <p className="font-bold text-xl text-slate-800">RM {formatMoney(c.totalCost)}</p>
                        </div>
                    ))}
                    {shippingData.options.length === 0 && <p className="col-span-3 py-10 text-center text-slate-300 text-xs font-medium">Enter postcode to see delivery rates</p>}
                </div>
            </section>
          </div>

          {/* RIGHT: ORDER SUMMARY (EDITABLE) */}
          <div className="lg:sticky lg:top-32 h-fit">
            <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Order Summary</h2>
              
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item: any) => (
                    <div key={item.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative group">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <p className="font-bold text-slate-800 text-sm leading-tight">{item.name_en}</p>
                                <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest">{item.brand_name}</p>
                            </div>
                            <button onClick={() => removeItem(item.id)} className="text-slate-200 hover:text-red-500 transition-colors">✕</button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <button onClick={() => updateQty(item.id, -1)} className="px-3 py-1 hover:bg-slate-100 text-slate-400 font-bold transition-all text-lg">-</button>
                                <span className="px-4 py-1 text-xs font-bold text-slate-800">{item.qty}</span>
                                <button onClick={() => updateQty(item.id, 1)} className="px-3 py-1 hover:bg-slate-100 text-slate-400 font-bold transition-all text-lg">+</button>
                            </div>
                            <span className="font-bold text-slate-900 text-sm">RM {formatMoney(Number(item.price) * item.qty)}</span>
                        </div>
                    </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t-2 border-slate-50">
                {(wantsSticker || tshirtSize) && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-2 mb-4">
                        <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest leading-none mb-1">Rewards Applied</p>
                        {wantsSticker && <p className="text-[10px] font-bold text-blue-700 uppercase">✓ Proride Sticker</p>}
                        {tshirtSize && <p className="text-[10px] font-bold text-blue-700 uppercase">✓ T-Shirt Size: {tshirtSize}</p>}
                    </div>
                )}
                <div className="flex justify-between text-xs font-bold text-slate-400"><span>Subtotal</span><span className="text-slate-700">RM {formatMoney(itemsTotal)}</span></div>
                <div className="flex justify-between text-xs font-bold text-slate-400"><span>Delivery</span><span className="text-slate-700">RM {formatMoney(selectedCourier?.totalCost || 0)}</span></div>
                {appliedVoucher && <div className="flex justify-between text-xs font-bold text-green-600"><span>Discount</span><span>- RM {formatMoney(discount)}</span></div>}
                <div className="pt-8 mt-4 border-t-2 border-slate-900 flex justify-between items-center gap-4">
                    <span className="font-bold text-xs text-slate-400 uppercase tracking-widest">Grand Total</span>
                    <span className="text-3xl font-black text-blue-600 tracking-tighter">RM {formatMoney(grandTotal)}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder} 
                disabled={loading || cart.length === 0 || !selectedCourier}
                className="w-full bg-[#0f172a] text-white py-7 font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl rounded-2xl active:scale-95 disabled:opacity-20"
              >
                {loading ? 'Processing...' : 'Place Order & Pay'}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}