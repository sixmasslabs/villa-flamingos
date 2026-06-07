'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'qrcode'
import { supabase, formatearPeso, type Cliente, type Transaccion } from '@/lib/supabase'

export default function ClientePage() {
  const { id } = useParams<{ id: string }>()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [movimientos, setMovimientos] = useState<Transaccion[]>([])
  const [cargando, setCargando] = useState(true)
  const qrRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    cargarDatos()
  }, [id])

  useEffect(() => {
    if (cliente && qrRef.current) {
      QRCode.toCanvas(qrRef.current, window.location.href, { width: 240, margin: 2 })
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fce4ec 0%, #fff8f0 100%)' }}>
      <div className="text-pink-400 text-xl">Cargando...</div>
    </div>
  )

  if (!cliente) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f4f0' }}>
      <div className="text-center">
        <div className="text-6xl mb-4">😕</div>
        <p className="text-gray-500 text-lg">Cliente no encontrado</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #fce4ec 0%, #fff8f0 100%)' }}>
      {/* Header con saldo */}
      <div className="bg-pink-500 text-white px-6 py-8 text-center">
        <div className="text-5xl mb-2">🦩</div>
        <h1 className="text-2xl font-black">Villa Flamingos</h1>
        <div className="mt-6">
          <p className="text-pink-100 text-sm">Hola,</p>
          <p className="text-2xl font-bold">{cliente.nombre} {cliente.apellido}</p>
        </div>
        <div className="mt-6 bg-white/20 rounded-2xl p-5">
          <p className="text-pink-100 text-sm">Tu saldo disponible</p>
          <p className="text-5xl font-black mt-1">{formatearPeso(cliente.saldo)}</p>
        </div>
      </div>

      <div className="p-5 max-w-sm mx-auto space-y-5">
        {/* QR del cliente */}
        <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
          <p className="text-gray-500 text-sm mb-3">Tu código QR personal</p>
          <div className="flex justify-center">
            <canvas ref={qrRef} className="rounded-xl" />
          </div>
          <p className="text-gray-400 text-xs mt-3">Muéstraselo al mesero para pagar</p>
        </div>

        {/* Movimientos */}
        {movimientos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-gray-700 mb-3">Últimos movimientos</h2>
            <div className="space-y-2">
              {movimientos.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-semibold text-gray-700">{m.descripcion || m.tipo}</div>
                    <div className="text-xs text-gray-400">{new Date(m.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</div>
                  </div>
                  <div className={`font-bold text-base ${m.tipo === 'carga' ? 'text-green-500' : 'text-red-500'}`}>
                    {m.tipo === 'carga' ? '+' : '-'}{formatearPeso(m.monto)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-gray-400 text-xs pb-4">
          Código: {cliente.codigo} · ¿Dudas? Habla con caja
        </p>
      </div>
    </div>
  )
}
