'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'qrcode'
import FlamingoLogo from '@/components/FlamingoLogo'
import { supabase, formatearPeso, type Cliente, type Transaccion } from '@/lib/supabase'

export default function ClientePage() {
  const { id } = useParams<{ id: string }>()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [movimientos, setMovimientos] = useState<Transaccion[]>([])
  const [cargando, setCargando] = useState(true)
  const qrRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => { cargarDatos() }, [id])

  useEffect(() => {
    if (cliente && qrRef.current) {
      QRCode.toCanvas(qrRef.current, window.location.href, {
        width: 220,
        margin: 2,
        color: { dark: '#2C1A22', light: '#FAF6F1' }
      })
    }
  }, [cliente])

  async function cargarDatos() {
    setCargando(true)
    const [{ data: c }, { data: t }] = await Promise.all([
      supabase.from('clientes').select('*').eq('id', id).single(),
      supabase.from('transacciones').select('*').eq('cliente_id', id).order('created_at', { ascending: false }).limit(20),
    ])
    setCliente(c)
    setMovimientos(t || [])
    setCargando(false)
  }

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #2C1A22 0%, #4A2535 100%)' }}>
      <FlamingoLogo size={48} className="animate-pulse" />
    </div>
  )

  if (!cliente) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--cream)' }}>
      <FlamingoLogo size={56} />
      <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>Cliente no encontrado</p>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #2C1A22 0%, #4A2535 55%, #2C1A22 100%)' }}>

      {/* Header */}
      <div className="px-6 pt-12 pb-8 text-center">
        <FlamingoLogo size={56} className="mx-auto mb-4" />
        <h1 className="text-white text-2xl tracking-[0.15em] uppercase" style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400 }}>
          Villa Flamingos
        </h1>
        <div className="flex items-center justify-center gap-3 mt-2">
          <div className="h-px w-8" style={{ background: 'rgba(201,169,110,0.5)' }} />
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: 'rgba(201,169,110,0.7)' }}>Bienvenido</p>
          <div className="h-px w-8" style={{ background: 'rgba(201,169,110,0.5)' }} />
        </div>
      </div>

      <div className="px-5 pb-12 max-w-sm mx-auto space-y-4">

        {/* Card saldo */}
        <div className="rounded-2xl overflow-hidden border" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}>
          <div className="px-6 pt-6 pb-3">
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'rgba(201,169,110,0.6)' }}>Hola,</p>
            <h2 className="text-2xl text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
              {cliente.nombre} {cliente.apellido}
            </h2>
          </div>
          <div className="mx-4 mb-4 rounded-xl px-5 py-5 text-center" style={{ background: 'rgba(192,88,110,0.2)', border: '1px solid rgba(192,88,110,0.25)' }}>
            <p className="text-xs tracking-wider uppercase mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Tu saldo disponible</p>
            <p className="text-5xl font-bold" style={{ color: '#F2D0D8', fontFamily: 'var(--font-playfair)' }}>
              {formatearPeso(cliente.saldo)}
            </p>
          </div>
        </div>

        {/* QR */}
        <div className="rounded-2xl p-5 text-center border" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}>
          <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'rgba(201,169,110,0.6)' }}>Tu código QR</p>
          <div className="inline-block rounded-2xl p-3" style={{ background: '#FAF6F1' }}>
            <canvas ref={qrRef} className="rounded-xl block" />
          </div>
          <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Muéstraselo al mesero para pagar</p>
        </div>

        {/* Movimientos */}
        {movimientos.length > 0 && (
          <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'rgba(201,169,110,0.6)' }}>Últimos movimientos</p>
            <div className="space-y-3">
              {movimientos.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{m.descripcion || m.tipo}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {new Date(m.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                  <span className="font-semibold text-sm" style={{ color: m.tipo === 'carga' ? '#86efac' : '#fca5a5' }}>
                    {m.tipo === 'carga' ? '+' : '−'}{formatearPeso(m.monto)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs pb-2" style={{ color: 'rgba(201,169,110,0.3)' }}>
          Villa Flamingos · Código {cliente.codigo}
        </p>
      </div>
    </div>
  )
}
