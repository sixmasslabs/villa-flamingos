'use client'

import { useState, useEffect, ReactNode } from 'react'
import FlamingoLogo from './FlamingoLogo'
import { supabase } from '@/lib/supabase'

export default function PinGuard({ children }: { children: ReactNode }) {
  const [desbloqueado, setDesbloqueado] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('vf_pin_ok') === 'true') setDesbloqueado(true)
  }, [])

  async function verificar() {
    if (pin.length < 4) return
    setCargando(true)
    const { data } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'pin')
      .single()
    setCargando(false)
    if (data?.valor === pin) {
      sessionStorage.setItem('vf_pin_ok', 'true')
      setDesbloqueado(true)
    } else {
      setError(true)
      setPin('')
      setTimeout(() => setError(false), 2000)
    }
  }

  if (desbloqueado) return <>{children}</>

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #2C1A22 0%, #4A2535 100%)' }}>
      <FlamingoLogo size={56} className="mb-6" />
      <h1 className="text-white text-2xl mb-1 tracking-widest uppercase"
        style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400 }}>
        Villa Flamingos
      </h1>
      <p className="text-xs tracking-[0.2em] mb-10" style={{ color: 'rgba(201,169,110,0.6)' }}>
        ACCESO RESTRINGIDO
      </p>

      <div className="w-full max-w-xs space-y-3">
        <input
          type="password"
          inputMode="numeric"
          maxLength={8}
          placeholder="PIN"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => e.key === 'Enter' && verificar()}
          autoFocus
          className="w-full text-center text-2xl font-bold tracking-[0.4em] py-4 rounded-2xl focus:outline-none"
          style={{
            background: error ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'}`,
            color: 'white',
            caretColor: '#C9A96E',
          }}
        />
        {error && (
          <p className="text-center text-sm" style={{ color: '#fca5a5' }}>PIN incorrecto</p>
        )}
        <button
          onClick={verificar}
          disabled={pin.length < 4 || cargando}
          className="w-full py-4 rounded-2xl font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'var(--rose)' }}>
          {cargando ? 'Verificando...' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}
