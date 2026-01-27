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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading Enterprise System...</div>
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center">Access Denied</div>

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col sticky top-0 h-screen hidden lg:flex">
        <div className="p-8 border-b border-slate-800">
            <h1 className="text-2xl font-bold tracking-tight">MY HUB</h1>
            <p className="text-[10px] text-slate-500 font-semibold uppercase mt-1">Enterprise System</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
            <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                Dashboard
            </button>
            <button onClick={() => setActiveTab('products')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                Inventory
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                Users
            </button>
        </nav>

        <div className="p-6 border-t border-slate-800">
            <button onClick={() => supabase.auth.signOut().then(() => window.location.href='/')} className="text-xs font-bold text-slate-500 hover:text-white uppercase">Logout</button>
        </div>
      </aside>

      {/* MAIN CONTENT Area */}
      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-40 h-20 px-10">
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input className="w-full bg-slate-100 border-none pl-12 pr-4 py-2.5 rounded-xl text-sm outline-none" placeholder="Search item code, SKU..." />
                </div>
            </div>
            <Link href="/products" className="text-xs font-bold text-blue-600 hover:underline">View Shop →</Link>
        </header>

        <div className="p-10">
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'products' && <InventoryTab />}
            {activeTab === 'users' && <UsersTab />}
        </div>
      </main>
    </div>
  )
}