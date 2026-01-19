"use client"
import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext<any>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<any[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('chassis_pro_cart')
    if (saved) setCart(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('chassis_pro_cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product: any, price: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
      return [...prev, { ...product, price, qty: 1 }]
    })
  }

  const updateQty = (id: any, delta: number) => {
    setCart(prev => prev.map(item => (item.id === id) ? { ...item, qty: Math.max(1, item.qty + delta) } : item))
  }

  const removeItem = (id: any) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const clearCart = () => setCart([])

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)