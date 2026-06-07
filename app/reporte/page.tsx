'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import FlamingoLogo from '@/components/FlamingoLogo'
import { supabase, formatearPeso } from '@/lib/supabase'

type MovimientoDetalle = {
  id: string
  cliente_nombre: string
  tipo: string
  monto: number
  descripcion: string | null
  created_at: string
}

export default function Reporte() {
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0])
  const [totalCarga, setTotalCarga] = useState(0)
  const [totalConsumo, setTotalConsumo] = useState(0)
  const [movimientos, setMovimientos] = useState<MovimientoDetalle[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargarReporte() }, [fecha])

  async function cargarReporte() {
    setCargando(true)
    const { data } = await supabase
      .from('transacciones')
      .select('*, clientes(nombre, apellido)')
      .eq('fecha', fecha)
      .order('created_at', { ascending: false })

    if (data) {
      let sumaCarga = 0, sumaConsumo = 0
      const movs: MovimientoDetalle[] = data.map((t: any) => {
        if (t.tipo === 'carga') sumaCarga += t.monto
        else sumaConsumo += t.monto
        return {
          id: t.id,
          cliente_nombre: t.clientes ? `${t.clientes.nombre} ${t.clientes.apellido}` : 'Desconocido',
          tipo: t.tipo,
          monto: t.monto,
          descripcion: t.descripcion,
          created_at: t.created_at,
        }
      })
      setTotalCarga(sumaCarga)
      setTotalConsumo(sumaConsumo)
      setMovimientos(movs)
    }
    setCargando(false)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <div className="px-5 py-5 flex items-center gap-4 border-b" style={{ background: 'var(--charcoal)', borderColor: 'rgba(201,169,110,0.2)' }}>
        <Link href="/" className="opacity-60 hover:opacity-100 transition-opacity">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M12 4l-6 6 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </Link>
        <FlamingoLogo size={32} />
        <div>
          <h1 className="text-white font-semibold tracking-widest text-sm uppercase" style={{ fontFamily: 'var(--font-playfair)' }}>Reporte</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(201,169,110,0.7)' }}>Ventas del día</p>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4 pb-10">
        {/* Selector fecha */}
        <div className="bg-white rounded-2xl border p-4" style={{ borderColor: 'var(--cream-dark)' }}>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)', fontFamily: 'var(--font-playfair)' }}>
            Fecha
          </label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 border"
            style={{ borderColor: 'var(--cream-dark)', color: 'var(--charcoal)' }} />
        </div>

        {cargando ? (
          <div className="text-center py-14">
            <FlamingoLogo size={40} className="mx-auto animate-pulse" />
          </div>
        ) : (
          <>
            {/* Métricas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-5 border" style={{ background: 'white', borderColor: 'var(--cream-dark)' }}>
                <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: '#2E7D32', fontFamily: 'var(--font-playfair)' }}>Cargado</p>
                <p className="text-2xl font-bold" style={{ color: '#2E7D32', fontFamily: 'var(--font-playfair)' }}>{formatearPeso(totalCarga)}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>efectivo recibido</p>
              </div>
              <div className="rounded-2xl p-5 border" style={{ background: 'white', borderColor: 'var(--cream-dark)' }}>
                <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: 'var(--rose)', fontFamily: 'var(--font-playfair)' }}>Consumo</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--rose)', fontFamily: 'var(--font-playfair)' }}>{formatearPeso(totalConsumo)}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>vendido en bar</p>
              </div>
            </div>

            <div className="rounded-2xl px-5 py-4 flex items-center justify-between" style={{ background: 'var(--charcoal)' }}>
              <span className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-playfair)' }}>Saldo pendiente</span>
              <span className="text-2xl font-bold" style={{ color: '#F2D0D8', fontFamily: 'var(--font-playfair)' }}>{formatearPeso(totalCarga - totalConsumo)}</span>
            </div>

            {/* Detalle */}
            {movimientos.length === 0 ? (
              <div className="text-center py-14">
                <FlamingoLogo size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Sin movimientos en esta fecha</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--cream-dark)' }}>
                <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'var(--muted)', fontFamily: 'var(--font-playfair)' }}>
                  Detalle — {movimientos.length} movimientos
                </p>
                <div className="space-y-3">
                  {movimientos.map(m => (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--cream-dark)' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--charcoal)' }}>{m.cliente_nombre}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                          {m.descripcion || m.tipo} · {new Date(m.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="font-semibold text-sm ml-3" style={{ color: m.tipo === 'carga' ? '#2E7D32' : 'var(--rose)' }}>
                        {m.tipo === 'carga' ? '+' : '−'}{formatearPeso(m.monto)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
