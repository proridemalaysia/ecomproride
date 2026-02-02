"use client"
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardTab() {
  const [stats, setStats] = useState({ totalSales: 0, orderCount: 0, productCount: 0, userCount: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [orders, products, users] = await Promise.all([
      supabase.from('orders').select('*'),
      supabase.from('products').select('id'),
      supabase.from('profiles').select('id')
    ]);

    const totalRevenue = (orders.data || [])
      .filter(o => o.status === 'PAID' || o.status === 'SHIPPED')
      .reduce((acc, curr) => acc + Number(curr.total_amount), 0);

    setStats({
      totalSales: totalRevenue,
      orderCount: orders.data?.length || 0,
      productCount: products.data?.length || 0,
      userCount: users.data?.length || 0
    });

    const { data: latestOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(6);
    const { data: latestUsers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(6);

    setRecentOrders(latestOrders || []);
    setRecentUsers(latestUsers || []);
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="py-20 text-center text-slate-300 animate-pulse font-black text-xl tracking-[0.5em]">GATHERING BUSINESS INTELLIGENCE...</div>

  return (
    <div className="space-y-12">
      
      {/* 1. ANALYTICS GRID - Large Headers & Sharp Borders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
            { label: 'GROSS REVENUE', value: `RM ${stats.totalSales.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, color: 'text-blue-600' },
            { label: 'TOTAL ORDERS', value: stats.orderCount, color: 'text-slate-900' },
            { label: 'ACTIVE INVENTORY', value: stats.productCount, color: 'text-slate-900' },
            { label: 'REGISTERED USERS', value: stats.userCount, color: 'text-slate-900' }
        ].map((stat, i) => (
            <div key={i} className="bg-white border-2 border-slate-100 p-10 rounded-2xl shadow-sm hover:border-blue-100 transition-all">
                {/* BIGGER HEADERS */}
                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.25em] mb-4">{stat.label}</p>
                <p className={`text-5xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* 2. RECENT SALES PIPELINE - Fills the wide space */}
          <section className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-end px-4 border-b-2 border-slate-100 pb-4">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Recent Sales Pipeline</h3>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Live View (Last 6)</span>
            </div>
            
            <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
                <div className="divide-y-2 divide-slate-50">
                    {recentOrders.map(order => (
                        <div key={order.id} className="p-8 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-8">
                                <div className="bg-slate-100 w-12 h-12 rounded-xl flex items-center justify-center font-black text-slate-400">
                                    {order.status === 'PAID' ? '💰' : '📦'}
                                </div>
                                <div>
                                    {/* BIGGER NAMES */}
                                    <p className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">{order.customer_name}</p>
                                    {/* READABLE ORDER ID */}
                                    <p className="text-xs font-black text-slate-400 tracking-[0.2em] mt-1 uppercase opacity-70">REF: #{order.id.slice(0,8).toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <p className="text-2xl font-black text-slate-900 tracking-tighter italic">RM {Number(order.total_amount).toFixed(2)}</p>
                                {/* BIGGER STATUS BADGE */}
                                <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full inline-block tracking-widest ${order.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {order.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </section>

          {/* 3. NEW SPECIALISTS - Right Sidebar */}
          <section className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight ml-4 italic border-b-2 border-slate-100 pb-4">New Specialists</h3>
            <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm p-10 space-y-8">
                {recentUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs font-black tracking-tighter shadow-lg shadow-slate-900/20">
                                {user.email?.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 lowercase">{user.email}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{user.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
                <button className="w-full py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-black text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all uppercase tracking-[0.3em] italic">
                    All Customer Data →
                </button>
            </div>
          </section>

      </div>
    </div>
  )
}