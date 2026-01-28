"use client"
import { useCart } from '@/context/CartContext'
import { useState, useEffect, useCallback } from 'react'
import { calculateShipping } from '@/lib/shipping'
import { getStateByPostcode, commonTowns } from '@/lib/postcodes'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function CheckoutPage() {
  const { cart, clearCart, updateQty, removeItem } = useCart()
  const [loading, setLoading] = useState(false)
  
  // Form States
  const [customer, setCustomer] = useState({ name: '', email: '', whatsapp: '' })
  const [address, setAddress] = useState({ street: '', postcode: '', town: '', state: '' })
  const [townSuggestions, setTownSuggestions] = useState<string[]>([])
  
  // Shipping States
  const [shippingData, setShippingData] = useState<{weightInfo: string, options: any[]}>({ weightInfo: '0.00', options: [] })
  const [selectedCourier, setSelectedCourier] = useState<any>(null)

  // Gifts & Vouchers States
  const [wantsSticker, setWantsSticker] = useState(false)
  const [tshirtSize, setTshirtSize] = useState('')
  const [availableGifts, setAvailableGifts] = useState<any[]>([])
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null)

  const formatMoney = (amount: any) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0.00';
    return new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  const hasFullSet = cart.some((item: any) => item.name_en.toLowerCase().includes('full set'));
  const itemsTotal = cart.reduce((acc: number, item: any) => acc + (Number(item.price || 0) * item.qty), 0)
  const discount = appliedVoucher ? Number(appliedVoucher.discount_amount) : 0
  const grandTotal = Math.max(0, itemsTotal + Number(selectedCourier?.totalCost || 0) - discount)

  useEffect(() => {
    async function getGifts() {
        const { data } = await supabase.from('free_gifts').select('*').gt('stock', 0)
        setAvailableGifts(data || [])
    }
    getGifts()
  }, [])

  const updateLogistics = useCallback(() => {
    if (address.postcode.length === 5 && cart.length > 0) {
      const result = calculateShipping(address.postcode, cart)
      setShippingData(result)
      if (result.options.length > 0) setSelectedCourier(result.options[0])
      const detectedState = getStateByPostcode(address.postcode)
      setAddress(prev => ({ ...prev, state: detectedState }))
      const towns = commonTowns[address.postcode] || []
      setTownSuggestions(towns)
      if (towns.length > 0 && !address.town) setAddress(prev => ({ ...prev, town: towns[0] }))
    }
  }, [address.postcode, cart])

  useEffect(() => { updateLogistics() }, [updateLogistics])

  const handlePlaceOrder = async () => {
    if (!customer.name || !customer.whatsapp || !selectedCourier) return alert('Sila lengkapkan maklumat.');
    setLoading(true)
    let giftSummary = '';
    if (wantsSticker) giftSummary += 'Proride Sticker';
    if (tshirtSize) giftSummary += (giftSummary ? ' & ' : '') + `T-Shirt Size: ${tshirtSize}`;

    try {
      const { data: order, error: dbError } = await supabase.from('orders').insert([{
        customer_name: customer.name, email: customer.email, whatsapp: customer.whatsapp,
        address: `${address.street}, ${address.town}, ${address.postcode}, ${address.state}`,
        total_amount: grandTotal, status: 'PENDING', items_json: cart,
        free_gift_info: giftSummary, voucher_code: appliedVoucher?.code || null, discount_applied: discount
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

  const headerLabel = "text-sm font-black text-slate-800 uppercase tracking-tight mb-2 block italic";
  const inputStyle = "w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-medium text-slate-500 outline-none focus:border-blue-600 transition-all shadow-sm";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20 p-4 md:p-12 pt-32 md:pt-40">
      <nav className="fixed top-0 w-full left-0 p-5 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
            <Link href="/" className="text-xl font-black tracking-tight uppercase">CHASSIS <span className="text-blue-600">PRO</span></Link>
            <Link href="/products" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-all uppercase">← Back</Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
          <div className="lg:col-span-2 space-y-10">
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-xs font-bold text-blue-600 tracking-[0.2em] uppercase mb-8 italic">01. Select Your Free Gift</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div onClick={() => setWantsSticker(!wantsSticker)} className={`p-6 border-2 rounded-2xl cursor-pointer transition-all flex items-center gap-4 ${wantsSticker ? 'border-blue-600 bg-blue-50' : 'border-slate-50 bg-slate-50/50'}`}>
                        <div className={`w-6 h-6 rounded flex items-center justify-center border-2 ${wantsSticker ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}>{wantsSticker && <span className="text-white text-xs font-bold">✓</span>}</div>
                        <div><p className="font-bold text-sm text-slate-800">Proride Performance Sticker</p><p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Free Gift</p></div>
                    </div>
                    <div className={`p-6 border-2 rounded-2xl transition-all ${hasFullSet ? 'border-slate-100 bg-white' : 'border-dashed border-slate-200 opacity-50'}`}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 italic">Premium T-Shirt (Full Set Only)</p>
                        {hasFullSet ? (
                            <select value={tshirtSize} onChange={(e) => setTshirtSize(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-blue-600">
                                <option value="">Choose Size</option>
                                {availableGifts.filter(g => g.name.includes('T-Shirt')).map(g => (<option key={g.id} value={g.size}>{g.size} ({g.stock} left)</option>))}
                            </select>
                        ) : ( <p className="text-xs font-bold text-slate-300 italic uppercase">Unlock with Full Set (4pcs)</p> )}
                    </div>
                </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-xs font-bold text-blue-600 tracking-[0.2em] uppercase mb-8 italic">02. Promotion Code</h3>
                <div className="flex gap-3">
                    <input className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold outline-none focus:border-blue-600 uppercase" placeholder="VOUCHER CODE" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} />
                    <button onClick={async () => {
                        const { data } = await supabase.from('vouchers').select('*').eq('code', voucherCode.toUpperCase()).eq('is_active', true).single()
                        if (data) { setAppliedVoucher(data); alert("Voucher Applied!"); } else { alert("Invalid Code."); }
                    }} className="bg-[#0f172a] text-white px-10 rounded-xl font-bold text-xs uppercase hover:bg-blue-600 transition-all">Apply</button>
                </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-xs font-bold text-blue-600 tracking-[0.2em] uppercase mb-8 italic">03. Shipping Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2"><label className={headerLabel}>Full Name</label><input onChange={e => setCustomer({...customer, name: e.target.value})} className={inputStyle} /></div>
                    <div><label className={headerLabel}>WhatsApp No</label><input onChange={e => setCustomer({...customer, whatsapp: e.target.value})} className={inputStyle} /></div>
                    <div><label className={headerLabel}>Email Address</label><input onChange={e => setCustomer({...customer, email: e.target.value})} className={inputStyle} /></div>
                    <div className="md:col-span-2"><label className={headerLabel}>Street Address</label><textarea onChange={e => setAddress({...address, street: e.target.value})} className={`${inputStyle} h-24 resize-none`} /></div>
                    <div><label className={headerLabel}>Postcode</label><input value={address.postcode} onChange={e => setAddress({...address, postcode: e.target.value})} className={inputStyle} maxLength={5} /></div>
                    <div><label className={headerLabel}>Town / City</label><input value={address.town} onChange={e => setAddress({...address, town: e.target.value})} className={inputStyle} /></div>
                </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-8 border-b pb-4">
                    <h3 className="text-xs font-bold text-blue-600 tracking-[0.2em] uppercase italic">04. Courier Selection</h3>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">Weight: {shippingData.weightInfo} KG</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {shippingData.options.map(c => (
                        <div key={c.name} onClick={() => setSelectedCourier(c)} className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${selectedCourier?.name === c.name ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}>
                            <p className="font-bold text-[10px] text-slate-400 uppercase tracking-tighter leading-none mb-2">{c.name}</p>
                            <p className="font-black text-xl text-slate-900">RM {formatMoney(c.totalCost)}</p>
                        </div>
                    ))}
                </div>
            </section>
          </div>

          <div className="lg:sticky lg:top-32 h-fit">
            <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-2xl space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#e11d48] to-[#f97316]"></div>
              <h2 className="text-lg font-black border-b pb-4 uppercase text-slate-800 italic">Order Total</h2>
              <div className="space-y-6 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item: any) => (
                    <div key={item.id} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start gap-4">
                            <p className="font-bold text-slate-800 text-xs leading-tight uppercase italic">{item.name_en}</p>
                            <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>
                        </div>
                        <div className="flex items-center justify-between mt-4 border-t border-slate-200 pt-4">
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <button onClick={() => updateQty(item.id, -1)} className="px-3 py-1 hover:bg-blue-600 hover:text-white transition-all font-black text-lg">-</button>
                                <span className="px-4 py-1 text-xs font-black text-slate-900">{item.qty}</span>
                                <button onClick={() => updateQty(item.id, 1)} className="px-3 py-1 hover:bg-blue-600 hover:text-white transition-all font-black text-lg">+</button>
                            </div>
                            <span className="font-black text-slate-900 text-sm">RM {formatMoney(Number(item.price) * item.qty)}</span>
                        </div>
                    </div>
                ))}
              </div>
              <div className="space-y-4 pt-6 border-t-2 border-slate-100">
                {(wantsSticker || tshirtSize) && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-2 mb-4">
                        {wantsSticker && <p className="text-[10px] font-black text-blue-700 italic uppercase leading-none">✓ Proride Sticker</p>}
                        {tshirtSize && <p className="text-[10px] font-black text-blue-700 italic uppercase leading-none">✓ T-Shirt Size: {tshirtSize}</p>}
                    </div>
                )}
                <div className="flex justify-between text-xs font-bold text-slate-400"><span>Items Total</span><span className="text-slate-900">RM {formatMoney(itemsTotal)}</span></div>
                <div className="flex justify-between text-xs font-bold text-slate-400"><span>Delivery Fee</span><span className="text-slate-900">RM {formatMoney(selectedCourier?.totalCost || 0)}</span></div>
                {appliedVoucher && <div className="flex justify-between text-xs font-bold text-green-600 uppercase"><span>Voucher</span><span>- RM {formatMoney(discount)}</span></div>}
                <div className="pt-8 mt-4 border-t-2 border-slate-900 flex justify-between items-center gap-4">
                    <span className="font-bold text-xs text-slate-400 uppercase tracking-widest italic">Total</span>
                    <span className="text-2xl md:text-3xl font-black text-blue-600 tracking-tighter italic leading-none whitespace-nowrap">RM {formatMoney(grandTotal)}</span>
                </div>
              </div>
              <button onClick={handlePlaceOrder} disabled={loading || cart.length === 0 || !selectedCourier} className="w-full bg-[#0f172a] text-white py-7 font-black uppercase italic tracking-widest hover:bg-blue-600 transition-all shadow-xl rounded-2xl active:scale-95 disabled:opacity-20">
                {loading ? 'PROCESSING...' : 'PLACE ORDER & PAY'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}