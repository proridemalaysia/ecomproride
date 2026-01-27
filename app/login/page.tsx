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
    if (!email || !password) return alert("Sila masukkan emel dan kata laluan.")
    
    setLoading(true)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    
    if (authError) {
      setMessage(authError.message)
      setLoading(false)
    } else if (authData.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single()
      if (profile?.role === 'ADMIN') router.push('/admin')
      else router.push('/products')
    }
  }

  const handleSignUp = async () => {
    if (!email || !password) return alert("Sila masukkan emel dan kata laluan sebelum mendaftar.")
    
    setLoading(true)
    setMessage('')
    
    const { data, error } = await supabase.auth.signUp({ 
      email: email, 
      password: password 
    })

    if (error) {
      setMessage(error.message)
    } else if (data.user) {
      setMessage("Account Created Successfully! You can now Log In below.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 p-10 shadow-2xl rounded-2xl relative overflow-hidden italic uppercase">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#e11d48] to-[#f97316]"></div>
        
        <div className="text-center mb-10 not-italic">
            <Link href="/" className="text-2xl font-black tracking-tight text-slate-800 uppercase leading-none">
                Chassis <span className="text-[#e11d48]">Pro</span>
            </Link>
            <p className="text-slate-400 text-[10px] font-bold tracking-[0.3em] mt-2 uppercase">Service Portal</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6 not-italic">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email address</label>
            <input 
              type="email" 
              className="w-full bg-slate-50 border border-slate-200 p-4 text-slate-900 outline-none focus:border-[#f97316] font-bold text-sm rounded-lg transition-all" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="YOUR@EMAIL.COM"
              required 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password" 
              className="w-full bg-slate-50 border border-slate-200 p-4 text-slate-900 outline-none focus:border-[#f97316] font-bold text-sm tracking-widest rounded-lg transition-all" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>
          
          {message && (
            <div className="bg-orange-50 border border-orange-100 p-4 text-[#f97316] text-[10px] font-bold text-center rounded-lg uppercase tracking-tight">
                {message}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading} 
            className="w-full bg-[#f97316] hover:bg-[#0f172a] text-white font-bold py-5 uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50 rounded-lg text-xs"
          >
            {loading ? 'Processing...' : 'Log In To Hub'}
          </button>
          
          <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-slate-100">
            <p className="text-[9px] text-slate-400 font-bold text-center tracking-widest uppercase">New Service Partner?</p>
            <button 
              type="button"
              onClick={handleSignUp} 
              disabled={loading}
              className="text-xs text-[#e11d48] font-black hover:text-slate-900 transition-all uppercase tracking-widest"
            >
              Register New Account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}