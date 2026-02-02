"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import OrdersTab from '@/components/admin/OrdersTab'
import InventoryTab from '@/components/admin/InventoryTab'
import UsersTab from '@/components/admin/UsersTab'
import CampaignsTab from '@/components/admin/CampaignsTab'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'users' | 'campaigns'>('products')
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-medium">Synchronizing Portal...</div>
  if (!isAdmin) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
    <h1 className="text-xl font-bold">Access Restricted</h1>
    <Link href="/login" className="bg-blue-600 text-white px-8 py-2 rounded-lg">Return to Login</Link>
  </div>

  return (
    <div className="min-h-screen flex bg-[#fcfcfd]">
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col sticky top-0 h-screen hidden lg:flex">
        <div className="p-8 flex flex-col items-center border-b border-slate-800">
            <img src="https://vaqlsjjkcctuwrskssga.supabase.co/storage/v1/object/public/logo/KEsq.png" className="h-12 w-auto mb-4" alt="KE" />
            <h1 className="text-lg font-bold tracking-tight">Management Hub</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 mt-4">
            {[
              { id: 'orders', name: 'Orders' },
              { id: 'products', name: 'Inventory' },
              { id: 'users', name: 'User Access' },
              { id: 'campaigns', name: 'Marketing & Gifts' }
            ].map((item) => (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id as any)} 
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                {item.name}
              </button>
            ))}
        </nav>
        <div className="p-6 border-t border-slate-800">
            <button onClick={() => supabase.auth.signOut().then(() => window.location.href='/')} className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest">Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-100 p-6 flex justify-between items-center sticky top-0 z-40 h-20 px-10">
            <h2 className="text-xl font-bold text-slate-800">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
            <Link href="/products" className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-tight">View Shop →</Link>
        </header>
        <div className="p-10">
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'products' && <InventoryTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'campaigns' && <CampaignsTab />}
        </div>
      </main>
    </div>
  )
}