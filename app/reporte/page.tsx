'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, formatearPeso } from '@/lib/supabase'

type ResumenCliente = {
  nombre: string
  apellido: string
  total_consumo: number
  total_carga: number
  saldo: number
}

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
    const { data: transacciones } = await supabase
      .from('transacciones')
      .select('*, clientes(nombre, apellido)')
      .eq('fecha', fecha)
      .order('created_at', { ascending: false })

    if (transacciones) {
      let sumaCarga = 0, sumaConsumo = 0
      const movs: MovimientoDetalle[] = transacciones.map((t: any) => {
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
    <div className="min-h-screen" style={{ background: '#f8f4f0' }}>
      <div className="bg-slate-700 text-white px-5 py-4 flex items-center gap-3 shadow">
        <Link href="/" className="text-white text-2xl">←</Link>
        <div>
          <h1 className="font-bold text-xl">📊 Reporte del día</h1>
          <p className="text-slate-300 text-sm">Resumen de ventas y movimientos</p>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Selector de fecha */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <label className="block text-sm text-gray-500 mb-2 font-semibold">Fecha del reporte</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-slate-400" />
        </div>

        {cargando ? (
          <div className="text-center py-10 text-gray-400">Cargando...</div>
        ) : (
          <>
            {/* Resumen */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
                <div className="text-sm text-green-600 font-semibold mb-1">Total cargado</div>
                <div className="text-2xl font-black text-green-600">{formatearPeso(totalCarga)}</div>
                <div className="text-xs text-green-400 mt-1">efectivo recibido</div>
              </div>
              <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 text-center">
                <div className="text-sm text-pink-600 font-semibold mb-1">Total consumo</div>
                <div className="text-2xl font-black text-pink-500">{formatearPeso(totalConsumo)}</div>
                <div className="text-xs text-pink-400 mt-1">vendido en el bar</div>
              </div>
            </div>

            <div className="bg-slate-700 text-white rounded-2xl p-4 text-center">
              <div className="text-slate-300 text-sm">Saldo pendiente (no consumido)</div>
              <div className="text-3xl font-black mt-1">{formatearPeso(totalCarga - totalConsumo)}</div>
            </div>

            {/* Lista de movimientos */}
            {movimientos.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <div className="text-4xl mb-3">📭</div>
                No hay movimientos en esta fecha
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="font-bold text-gray-700 mb-3">Detalle ({movimientos.length} movimientos)</h2>
                <div className="space-y-2">
                  {movimientos.map(m => (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">{m.cliente_nombre}</div>
                        <div className="text-xs text-gray-400">{m.descripcion || m.tipo} · {new Date(m.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div className={`font-bold ml-3 ${m.tipo === 'carga' ? 'text-green-500' : 'text-red-500'}`}>
                        {m.tipo === 'carga' ? '+' : '-'}{formatearPeso(m.monto)}
                      </div>
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
