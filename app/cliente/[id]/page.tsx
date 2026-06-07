'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'qrcode'
import { supabase, formatearPeso, type Cliente, type Transaccion } from '@/lib/supabase'

type Evento = {
  id: string
  nombre: string
  artista: string | null
  descripcion: string | null
  fecha: string
}

export default function ClientePage() {
  const { id } = useParams<{ id: string }>()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [evento, setEvento] = useState<Evento | null>(null)
  const [movimientos, setMovimientos] = useState<Transaccion[]>([])
  const [cargando, setCargando] = useState(true)
  const [saldoAnterior, setSaldoAnterior] = useState<number | null>(null)
  const [parpadeo, setParpadeo] = useState(false)
  const qrRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => { cargarDatos() }, [id])

  useEffect(() => {
    if (!id) return
    // Suscripción tiempo real al saldo del cliente
    const channel = supabase
      .channel(`cliente-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'clientes',
        filter: `id=eq.${id}`,
      }, (payload: any) => {
        const nuevoSaldo = payload.new.saldo
        setCliente(prev => {
          if (prev) setSaldoAnterior(prev.saldo)
          return prev ? { ...prev, saldo: nuevoSaldo } : prev
        })
        setParpadeo(true)
        setTimeout(() => setParpadeo(false), 1200)
        // Recargar movimientos
        cargarMovimientos()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    if (cliente && qrRef.current) {
      QRCode.toCanvas(qrRef.current, window.location.href, {
        width: 200,
        margin: 2,
        color: { dark: '#2C1A22', light: '#FAF6F1' },
      })
    }
  }, [cliente])

  async function cargarDatos() {
    setCargando(true)
    const [{ data: c }, { data: e }, { data: t }] = await Promise.all([
      supabase.from('clientes').select('*').eq('id', id).single(),
      supabase.from('eventos').select('*').eq('activo', true).single(),
      supabase.from('transacciones').select('*').eq('cliente_id', id).order('created_at', { ascending: false }).limit(15),
    ])
    setCliente(c)
    setEvento(e)
    setMovimientos(t || [])
    setCargando(false)
  }

  async function cargarMovimientos() {
    const { data } = await supabase
      .from('transacciones')
      .select('*')
      .eq('cliente_id', id)
      .order('created_at', { ascending: false })
      .limit(15)
    setMovimientos(data || [])
  }

  async function compartir() {
    if (navigator.share) {
      await navigator.share({ title: 'Villa Flamingos', url: window.location.href })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert('Link copiado al portapapeles')
    }
  }

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #2C1A22 0%, #4A2535 100%)' }}>
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: 'rgba(201,169,110,0.6)', borderTopColor: 'transparent' }} />
        <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(201,169,110,0.5)' }}>Cargando</p>
      </div>
    </div>
  )

  if (!cliente) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--cream)' }}>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>Cliente no encontrado</p>
    </div>
  )

  const bajoDeSaldo = cliente.saldo < 100

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #2C1A22 0%, #4A2535 60%, #2C1A22 100%)' }}>

      {/* Afiche del evento */}
      <div className="px-6 pt-10 pb-6 text-center border-b" style={{ borderColor: 'rgba(201,169,110,0.12)' }}>
        {evento ? (
          <>
            <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: 'rgba(201,169,110,0.55)' }}>
              {new Date(evento.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="text-white text-3xl leading-tight" style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400 }}>
              {evento.nombre}
            </h1>
            {evento.artista && (
              <div className="mt-3 flex items-center justify-center gap-3">
                <div className="h-px flex-1" style={{ background: 'rgba(201,169,110,0.3)' }} />
                <p className="text-sm font-semibold tracking-[0.15em] uppercase" style={{ color: '#C9A96E' }}>
                  {evento.artista}
                </p>
                <div className="h-px flex-1" style={{ background: 'rgba(201,169,110,0.3)' }} />
              </div>
            )}
            {evento.descripcion && (
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{evento.descripcion}</p>
            )}
          </>
        ) : (
          <h1 className="text-white text-3xl" style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400 }}>
            Villa Flamingos
          </h1>
        )}
      </div>

      <div className="px-5 pt-5 pb-14 max-w-sm mx-auto space-y-4">

        {/* Card saldo — tiempo real */}
        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}>
          <div className="px-6 pt-5 pb-2">
            <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(201,169,110,0.55)' }}>Bienvenido,</p>
            <h2 className="text-2xl text-white mt-0.5" style={{ fontFamily: 'var(--font-playfair)' }}>
              {cliente.nombre} {cliente.apellido}
            </h2>
          </div>

          <div className="mx-4 mb-4 rounded-xl px-5 py-5 text-center transition-all duration-500"
            style={{
              background: bajoDeSaldo ? 'rgba(239,68,68,0.15)' : 'rgba(192,88,110,0.18)',
              border: `1px solid ${bajoDeSaldo ? 'rgba(239,68,68,0.3)' : 'rgba(192,88,110,0.25)'}`,
            }}>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>Tu saldo disponible</p>
            <p
              className="text-5xl font-bold transition-all duration-300"
              style={{
                fontFamily: 'var(--font-playfair)',
                color: parpadeo ? '#fde68a' : bajoDeSaldo ? '#fca5a5' : '#F2D0D8',
                transform: parpadeo ? 'scale(1.06)' : 'scale(1)',
              }}>
              {formatearPeso(cliente.saldo)}
            </p>
            {parpadeo && saldoAnterior !== null && (
              <p className="text-xs mt-2" style={{ color: 'rgba(253,230,138,0.7)' }}>
                Anterior: {formatearPeso(saldoAnterior)}
              </p>
            )}
            {bajoDeSaldo && !parpadeo && (
              <p className="text-xs mt-2" style={{ color: '#fca5a5' }}>Saldo bajo — visita caja para recargar</p>
            )}
          </div>
        </div>

        {/* QR */}
        <div className="rounded-2xl p-5 text-center border" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'rgba(201,169,110,0.55)' }}>Tu código QR</p>
          <div className="inline-block rounded-2xl p-3" style={{ background: '#FAF6F1' }}>
            <canvas ref={qrRef} className="rounded-xl block" />
          </div>
          <p className="text-xs mt-3 mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Muéstraselo al mesero para pagar</p>
          <button onClick={compartir}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{ background: 'rgba(201,169,110,0.15)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.3)' }}>
            Compartir / Guardar
          </button>
        </div>

        {/* Movimientos */}
        {movimientos.length > 0 && (
          <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'rgba(201,169,110,0.55)' }}>Movimientos</p>
            <div className="space-y-3">
              {movimientos.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{m.descripcion || m.tipo}</p>
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

        <p className="text-center text-xs" style={{ color: 'rgba(201,169,110,0.25)' }}>
          Villa Flamingos · {cliente.codigo}
        </p>
      </div>
    </div>
  )
}
