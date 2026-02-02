"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import DashboardTab from '@/components/admin/DashboardTab'
import OrdersTab from '@/components/admin/OrdersTab'
import InventoryTab from '@/components/admin/InventoryTab'
import UsersTab from '@/components/admin/UsersTab'
import CampaignsTab from '@/components/admin/CampaignsTab'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'users' | 'campaigns'>('dashboard')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    async function checkAccess() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUserEmail(session.user.email || '')
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

  if (loading) return <div className="min-h-screen flex items-center justify-center font-medium text-slate-300">Syncing...</div>
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center font-bold uppercase">403 Forbidden</div>

  return (
    <div className="min-h-screen flex bg-[#f9f9f9] font-sans">
      <aside className="w-72 bg-white border-r border-[#eeeeee] flex flex-col sticky top-0 h-screen hidden lg:flex">
        <div className="p-10 flex flex-col items-center">
            <img src="https://vaqlsjjkcctuwrskssga.supabase.co/storage/v1/object/public/logo/KEsq.png" className="h-12 w-auto mb-6" alt="KE" />
            <h1 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Management Hub</h1>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4">
            {[
                { id: 'dashboard', name: 'Dashboard' },
                { id: 'orders', name: 'Orders' },
                { id: 'products', name: 'Inventory' },
                { id: 'users', name: 'Users' },
                { id: 'campaigns', name: 'Campaigns' }
            ].map(item => (
                <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full text-left px-6 py-4 rounded-full text-sm font-semibold transition-all ${activeTab === item.id ? 'bg-[#111111] text-white shadow-xl' : 'text-slate-400 hover:text-black'}`}
                >
                    {item.name}
                </button>
            ))}
        </nav>

        <div className="p-10 border-t border-[#eeeeee]">
            <p className="text-[10px] text-slate-300 font-bold mb-4 truncate">{userEmail}</p>
            <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-brand-accent uppercase tracking-widest transition-colors">Sign Out</button>
        </div>
      </aside>

      <main className="flex-1">
        <header className="bg-white/50 backdrop-blur-md p-8 flex justify-between items-center sticky top-0 z-40 px-12 border-b border-[#eeeeee]">
            <h2 className="text-xl font-bold text-slate-900 capitalize tracking-tight">{activeTab}</h2>
            <Link href="/products" className="text-[10px] font-bold text-slate-400 hover:text-black border border-slate-200 px-4 py-2 rounded-full transition-all uppercase tracking-widest">View Store</Link>
        </header>

        <div className="p-12 max-w-7xl mx-auto animate-in fade-in duration-700">
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'products' && <InventoryTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'campaigns' && <CampaignsTab />}
        </div>
      </main>
    </div>
  )
}