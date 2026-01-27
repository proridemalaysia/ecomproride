"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import OrdersTab from '@/components/admin/OrdersTab'
import InventoryTab from '@/components/admin/InventoryTab'
import UsersTab from '@/components/admin/UsersTab'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'users'>('products')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAccess() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
        if (profile?.role === 'ADMIN') setIsAdmin(true)
      }
      setLoading(false)
    }
    checkAccess()
  }, [])

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-400 font-medium">Initializing Enterprise Portal...</div>

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      
      {/* ERP SIDEBAR */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col sticky top-0 h-screen hidden lg:flex border-r border-slate-800">
        <div className="p-8">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-black">CP</div>
                MY HUB
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-2">Enterprise System</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
            <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <span>Dashboard</span>
            </button>
            <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <span>Inventory</span>
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <span>Customers</span>
            </button>
        </nav>

        <div className="p-4 border-t border-slate-800 mt-auto">
            <button onClick={() => supabase.auth.signOut().then(() => window.location.href='/')} className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-500 hover:text-red-400 transition-colors uppercase">Sign Out</button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between sticky top-0 z-40 h-20">
            <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab}</h2>
            <div className="flex-1 max-w-2xl mx-8">
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input className="w-full bg-slate-100 border-none pl-12 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" placeholder="Search item code, brand, or SKU..." />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Link href="/products" className="text-xs font-bold text-slate-400 hover:text-slate-600 border px-3 py-1.5 rounded-lg border-slate-200">SHOP</Link>
            </div>
        </header>

        <div className="p-6 lg:p-10">
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'products' && <InventoryTab />}
            {activeTab === 'users' && <UsersTab />}
        </div>
      </main>
    </div>
  )
}