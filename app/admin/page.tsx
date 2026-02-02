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

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center text-slate-400 font-medium">Synchronizing Secure Hub...</div>
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center font-bold">403 ACCESS DENIED</div>

  return (
    <div className="min-h-screen flex bg-[#f4f7fa] font-sans">
      
      {/* SIDEBAR - INDUSTRIAL DESIGN */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col sticky top-0 h-screen hidden lg:flex">
        <div className="p-8 border-b border-slate-800 flex items-center gap-3">
            <img src="https://vaqlsjjkcctuwrskssga.supabase.co/storage/v1/object/public/logo/KEsq.png" className="h-8 w-auto brightness-200" alt="Logo" />
            <span className="text-sm font-black tracking-widest uppercase italic">Admin Console</span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 mt-4">
            {[
                { id: 'dashboard', name: 'Overview' },
                { id: 'orders', name: 'Pending Orders' },
                { id: 'products', name: 'Parts Inventory' },
                { id: 'users', name: 'Customer Database' },
                { id: 'campaigns', name: 'Vouchers & Gifts' }
            ].map(item => (
                <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full text-left px-5 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                    {item.name}
                </button>
            ))}
        </nav>

        <div className="p-6 bg-black/20 border-t border-slate-800">
            <p className="text-[10px] text-slate-500 font-bold mb-3 truncate">{userEmail}</p>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.href='/')} className="text-[11px] font-black text-slate-400 hover:text-red-400 transition-colors uppercase tracking-widest">Sign Out Hub</button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-40 px-10 h-20">
            <h2 className="text-xl font-extrabold text-slate-900 capitalize tracking-tight">{activeTab}</h2>
            <div className="flex gap-4">
                <Link href="/products" className="text-xs font-bold text-slate-400 hover:text-blue-600 px-4 py-2 border border-slate-100 rounded-lg transition-all">Launch Store</Link>
            </div>
        </header>

        <div className="p-8 md:p-12 max-w-[1600px] mx-auto animate-in fade-in duration-500">
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