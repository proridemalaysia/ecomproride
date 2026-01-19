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
    
    // 1. Sign in with Email/Password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    
    if (authError) {
      setMessage(authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      // 2. Fetch the user's role to decide where to send them
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()
      
      if (profileError) {
        console.error("Profile Error:", profileError.message)
        router.push('/products') // Fallback to shop
      } else {
        // 3. Redirect based on detected role
        if (profile.role === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push('/products')
        }
      }
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setMessage(error.message)
    else setMessage('ACCOUNT CREATED! CHECK EMAIL TO CONFIRM.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans uppercase italic">
      {/* Background Dot Pattern to match homepage */}
      <div className="fixed inset-0 opacity-[0.4] pointer-events-none" 
           style={{backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>

      <div className="w-full max-w-md bg-white border border-slate-200 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-2xl relative z-10">
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#e11d48] to-[#f97316] rounded-t-2xl"></div>
        
        <div className="text-center mb-10">
            <Link href="/" className="text-slate-900 font-black italic text-3xl tracking-tighter uppercase leading-none">
            CHASSIS <span className="text-[#e11d48]">PRO</span>
            </Link>
            <p className="text-slate-400 text-[9px] font-black tracking-[0.4em] mt-2 italic">Specialist Access Portal</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6 not-italic">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase italic ml-1">Account Email</label>
            <input 
              type="email" 
              className="w-full bg-slate-50 border border-slate-200 p-4 text-slate-900 outline-none focus:border-[#f97316] font-bold text-sm transition-all rounded-lg" 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="YOUR@EMAIL.COM"
              required 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase italic ml-1">Secure Password</label>
            <input 
              type="password" 
              className="w-full bg-slate-50 border border-slate-200 p-4 text-slate-900 outline-none focus:border-[#f97316] font-bold text-sm tracking-widest transition-all rounded-lg" 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>
          
          {message && (
            <div className="bg-orange-50 border border-orange-100 p-4 text-[#f97316] text-[10px] font-black text-center italic rounded-lg">
                {message}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading} 
            className="w-full bg-[#f97316] hover:bg-[#0f172a] text-white font-black py-5 uppercase italic tracking-[0.2em] transition-all shadow-xl shadow-orange-500/20 active:scale-95 disabled:opacity-50 rounded-lg text-sm"
          >
            {loading ? 'Authorizing...' : 'Log In To Hub'}
          </button>
          
          <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-slate-100">
            <p className="text-[9px] text-slate-400 font-bold text-center tracking-widest uppercase">New Service Partner?</p>
            <button 
              type="button"
              onClick={handleSignUp} 
              className="text-xs text-[#e11d48] font-black hover:text-slate-900 transition-all uppercase italic tracking-widest"
            >
              Register New Account
            </button>
          </div>
        </form>
      </div>

      {/* Subtle Bottom Branding */}
      <div className="fixed bottom-10 opacity-20 select-none pointer-events-none">
        <p className="text-xs font-black tracking-[1em] text-slate-400">CHASSIS PRO MALAYSIA</p>
      </div>
    </div>
  )
}