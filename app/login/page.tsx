"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    // 1. Sign In
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    
    if (authError) {
      setMessage(authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      // 2. Fetch Role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()
      
      // 3. Smart Redirect
      if (profile?.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/products')
      }
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setMessage(error.message)
    else setMessage('Account created! Please check your email.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 p-10 shadow-2xl rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#e11d48] to-[#f97316]"></div>
        
        <div className="text-center mb-10">
            <Link href="/" className="text-2xl font-black tracking-tight text-slate-800 uppercase">
                Chassis <span className="text-[#e11d48]">Pro</span>
            </Link>
            <p className="text-slate-400 text-[10px] font-bold tracking-[0.3em] mt-2 uppercase">Access Portal</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email address</label>
            <input 
              type="email" 
              className="w-full bg-slate-50 border border-slate-200 p-4 text-slate-900 outline-none focus:border-[#f97316] font-bold text-sm rounded-lg" 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password" 
              className="w-full bg-slate-50 border border-slate-200 p-4 text-slate-900 outline-none focus:border-[#f97316] font-bold text-sm rounded-lg" 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          {message && <div className="bg-orange-50 border border-orange-100 p-4 text-[#f97316] text-[10px] font-bold text-center rounded-lg">{message}</div>}

          <button 
            type="submit"
            disabled={loading} 
            className="w-full bg-[#f97316] hover:bg-[#0f172a] text-white font-bold py-5 uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 rounded-lg text-xs"
          >
            {loading ? 'Authorizing...' : 'Log In To Hub'}
          </button>
          
          <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-slate-100">
            <button type="button" onClick={handleSignUp} className="text-xs text-[#e11d48] font-bold hover:text-slate-900 transition-all uppercase tracking-widest">Register Account</button>
          </div>
        </form>
      </div>
    </div>
  )
}