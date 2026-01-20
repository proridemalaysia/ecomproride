"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function UsersTab() {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('*').order('email', { ascending: true })
    setUsers(data || [])
  }

  async function updateRole(id: string, role: string) {
    await supabase.from('profiles').update({ role }).eq('id', id)
    fetchUsers()
  }

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
       <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
              <tr><th className="p-8">Email / Identity</th><th className="p-8 text-center">Rank</th><th className="p-8 text-right">Actions</th></tr>
          </thead>
          <tbody className="text-sm font-semibold text-slate-600">
              {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-8 text-slate-900 lowercase">{u.email}</td>
                      <td className="p-8 text-center"><span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${u.role === 'ADMIN' ? 'bg-red-100 text-red-600' : u.role === 'DEALER' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>{u.role}</span></td>
                      <td className="p-8 text-right flex gap-3 justify-end uppercase text-[9px] font-black">
                          <button onClick={() => updateRole(u.id, 'RETAIL')} className="hover:text-slate-900">Retail</button>
                          <button onClick={() => updateRole(u.id, 'DEALER')} className="text-blue-500 hover:text-blue-700">Dealer</button>
                          <button onClick={() => updateRole(u.id, 'ADMIN')} className="text-red-500 hover:text-red-700">Admin</button>
                      </td>
                  </tr>
              ))}
          </tbody>
       </table>
    </div>
  )
}