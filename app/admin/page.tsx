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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-semibold">Loading chassis pro hub...</div>
  
  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-white">
        <h1 className="text-xl font-bold mb-4">Unauthorized Access</h1>
        <Link href="/login" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold uppercase text-xs">Back to Login</Link>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-[#fcfcfd]">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col sticky top-0 h-screen hidden lg:flex shadow-2xl">
        <div className="p-8">
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                My Hub
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Enterprise Portal</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
            {[
              { id: 'orders', name: 'Dashboard' },
              { id: 'products', name: 'Inventory' },
              { id: 'users', name: 'User Management' }
            ].map((item) => (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id as any)} 
                className={`w-full flex items-center px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                {item.name}
              </button>
            ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
            <button onClick={handleLogout} className="text-xs font-bold text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest">Sign Out</button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 p-6 flex items-center justify-between sticky top-0 z-40 h-20 px-10">
            <h2 className="text-xl font-extrabold text-slate-800 capitalize tracking-tight">{activeTab}</h2>
            
            {/* SEARCH BAR */}
            <div className="flex-1 max-w-xl mx-10 hidden md:block">
                <div className="relative">
                    <input className="w-full bg-slate-100 border-none pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" placeholder="Quick search inventory..." />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                </div>
            </div>

            <Link href="/products" className="text-xs font-bold text-blue-600 hover:underline">Launch Shop →</Link>
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