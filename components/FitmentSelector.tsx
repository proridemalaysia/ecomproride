"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function FitmentSelector() {
  const router = useRouter()
  const [lang, setLang] = useState<'en' | 'bm'>('en')
  const [masterList, setMasterList] = useState<any[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')

  useEffect(() => {
    async function getData() {
      const { data } = await supabase
        .from('vehicle_list')
        .select('*')
        .order('brand', { ascending: true })
      
      if (data) {
        setMasterList(data)
        const uniqueBrands = Array.from(new Set(data.map((item: any) => item.brand)))
        setBrands(uniqueBrands as string[])
      }
    }
    getData()
  }, [])

  const handleSearch = () => {
    if (selectedVehicleId) {
      router.push(`/products?vId=${selectedVehicleId}`)
    } else {
      alert(lang === 'en' ? 'PLEASE SELECT A MODEL' : 'SILA PILIH MODEL');
    }
  }

  // Uniform style for the dropdowns
  const selectStyle = "w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-black text-slate-700 outline-none focus:border-[#f97316] transition-all cursor-pointer appearance-none"

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
        {/* Language Toggle */}
        <div className="flex justify-end mb-3">
            <button 
                onClick={() => setLang(lang === 'en' ? 'bm' : 'en')}
                className="text-[10px] font-black tracking-widest text-[#f97316] uppercase hover:text-[#e11d48] transition-all italic border-b border-transparent hover:border-[#e11d48]"
            >
                {lang === 'en' ? 'Tukar ke BM' : 'Switch to EN'}
            </button>
        </div>

        {/* The Search Bar Wrapper */}
        <div className="bg-white border border-slate-100 p-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                {/* 1. BRAND SELECT */}
                <div className="w-full">
                    <select 
                        className={selectStyle}
                        onChange={(e) => {
                            setSelectedBrand(e.target.value)
                            setSelectedVehicleId('')
                        }}
                    >
                        <option value="">{lang === 'en' ? '1. SELECT BRAND' : '1. JENAMA KENDERAAN'}</option>
                        {brands.map(brand => (
                            <option key={brand} value={brand}>{brand}</option>
                        ))}
                    </select>
                </div>

                {/* 2. MODEL SELECT */}
                <div className="w-full">
                    <select 
                        className={`${selectStyle} disabled:opacity-20`}
                        disabled={!selectedBrand}
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                    >
                        <option value="">{lang === 'en' ? '2. SELECT MODEL' : '2. PILIH MODEL'}</option>
                        {masterList
                            .filter(item => item.brand === selectedBrand)
                            .map(item => (
                                <option key={item.id} value={item.id}>{item.model}</option>
                            ))
                        }
                    </select>
                </div>

                {/* 3. SEARCH BUTTON */}
                <button 
                    onClick={handleSearch}
                    className="w-full bg-[#f97316] hover:bg-[#0f172a] text-white font-black py-4 rounded-lg text-xs uppercase italic tracking-[0.2em] transition-all hover:shadow-xl active:scale-[0.98]"
                >
                    {lang === 'en' ? 'Find Parts' : 'Cari Barang'}
                </button>
            </div>
        </div>
    </div>
  )
}