'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase, formatearPeso, type Cliente } from '@/lib/supabase'

const BEBIDAS = [
  { nombre: 'Cerveza', precio: 80 },
  { nombre: 'Agua', precio: 40 },
  { nombre: 'Refresco', precio: 50 },
  { nombre: 'Coctel', precio: 120 },
  { nombre: 'Vino copa', precio: 100 },
  { nombre: 'Tequila', precio: 90 },
  { nombre: 'Ron', precio: 90 },
  { nombre: 'Vodka', precio: 90 },
]

type Vista = 'escaner' | 'cobro'

export default function Mesero() {
  const [vista, setVista] = useState<Vista>('escaner')
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [escaneando, setEscaneando] = useState(false)
  const [bebidaSeleccionada, setBebidaSeleccionada] = useState<typeof BEBIDAS[0] | null>(null)
  const [montoCustom, setMontoCustom] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'ok' | 'error' } | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerDivId = 'qr-reader'

  useEffect(() => {
    return () => { detenerScanner() }
  }, [])

  async function iniciarScanner() {
    setEscaneando(true)
    const scanner = new Html5Qrcode(scannerDivId)
    scannerRef.current = scanner
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await detenerScanner()
          await resolverQR(decodedText)
        },
        () => {}
      )
    } catch {
      mostrarMensaje('No se pudo acceder a la cámara', 'error')
      setEscaneando(false)
    }
  }

  async function detenerScanner() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      scannerRef.current = null
    }
    setEscaneando(false)
  }

  async function resolverQR(texto: string) {
    // El QR contiene la URL: .../cliente/[id]
    const partes = texto.split('/')
    const id = partes[partes.length - 1]
    if (!id || id.length < 10) {
      mostrarMensaje('QR no reconocido', 'error')
      return
    }
    const { data } = await supabase.from('clientes').select('*').eq('id', id).single()
    if (!data) { mostrarMensaje('Cliente no encontrado', 'error'); return }
    setCliente(data)
    setVista('cobro')
  }

  async function cobrar() {
    const precio = bebidaSeleccionada?.precio ?? parseFloat(montoCustom)
    if (!cliente || isNaN(precio) || precio <= 0) {
      mostrarMensaje('Selecciona una bebida o ingresa un monto', 'error')
      return
    }
    if (precio > cliente.saldo) {
      mostrarMensaje('Saldo insuficiente', 'error')
      return
    }
    setCargando(true)
    const nuevoSaldo = cliente.saldo - precio
    const { error } = await supabase.from('clientes').update({ saldo: nuevoSaldo }).eq('id', cliente.id)
    if (error) { setCargando(false); mostrarMensaje('Error al cobrar', 'error'); return }
    await supabase.from('transacciones').insert({
      cliente_id: cliente.id,
      tipo: 'consumo',
      monto: precio,
      descripcion: bebidaSeleccionada?.nombre ?? 'Consumo personalizado',
    })
    setCliente({ ...cliente, saldo: nuevoSaldo })
    setBebidaSeleccionada(null)
    setMontoCustom('')
    setCargando(false)
    mostrarMensaje(`✓ ${formatearPeso(precio)} cobrados correctamente`, 'ok')
  }

  function mostrarMensaje(texto: string, tipo: 'ok' | 'error') {
    setMensaje({ texto, tipo })
    setTimeout(() => setMensaje(null), 3500)
  }

  function nuevoEscaneo() {
    setCliente(null)
    setBebidaSeleccionada(null)
    setMontoCustom('')
    setVista('escaner')
  }

  const precioActual = bebidaSeleccionada?.precio ?? (parseFloat(montoCustom) || 0)

  return (
    <div className="min-h-screen" style={{ background: '#f8f4f0' }}>
      <div className="bg-amber-500 text-white px-5 py-4 flex items-center gap-3 shadow">
        <Link href="/" className="text-white text-2xl">←</Link>
        <div>
          <h1 className="font-bold text-xl">📷 Mesero</h1>
          <p className="text-amber-100 text-sm">Escanear QR y cobrar consumo</p>
        </div>
      </div>

      {mensaje && (
        <div className={`mx-4 mt-4 p-4 rounded-xl font-semibold text-center ${mensaje.tipo === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="p-4 max-w-lg mx-auto space-y-4">

        {/* Escaner */}
        {vista === 'escaner' && (
          <div className="space-y-4">
            <div id={scannerDivId} className={`rounded-2xl overflow-hidden bg-black ${!escaneando ? 'hidden' : ''}`} />
            {!escaneando && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
                <div className="text-7xl">📷</div>
                <h2 className="text-xl font-bold text-gray-700">Listo para escanear</h2>
                <p className="text-gray-400">Apunta la cámara al código QR del cliente</p>
                <button onClick={iniciarScanner}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95">
                  Abrir cámara
                </button>
              </div>
            )}
            {escaneando && (
              <button onClick={detenerScanner}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-all">
                Cancelar
              </button>
            )}
          </div>
        )}

        {/* Panel de cobro */}
        {vista === 'cobro' && cliente && (
          <div className="space-y-4">
            {/* Info cliente */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xl font-black text-gray-800">{cliente.nombre} {cliente.apellido}</div>
                  <div className="text-gray-400 text-sm mt-1">Saldo disponible</div>
                  <div className="text-3xl font-black text-pink-500 mt-1">{formatearPeso(cliente.saldo)}</div>
                </div>
                <button onClick={nuevoEscaneo} className="text-sm text-amber-500 font-semibold bg-amber-50 px-3 py-2 rounded-lg">
                  Otro cliente
                </button>
              </div>
            </div>

            {/* Bebidas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h2 className="font-bold text-gray-700">Selecciona el consumo</h2>
              <div className="grid grid-cols-2 gap-2">
                {BEBIDAS.map(b => (
                  <button key={b.nombre} onClick={() => { setBebidaSeleccionada(b); setMontoCustom('') }}
                    className={`py-3 px-3 rounded-xl border text-left transition-all ${bebidaSeleccionada?.nombre === b.nombre ? 'bg-amber-500 text-white border-amber-500' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-amber-300'}`}>
                    <div className="font-bold text-sm">{b.nombre}</div>
                    <div className={`text-xs mt-0.5 ${bebidaSeleccionada?.nombre === b.nombre ? 'text-amber-100' : 'text-gray-400'}`}>${b.precio}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Monto personalizado..."
                  type="number"
                  value={montoCustom}
                  onChange={e => { setMontoCustom(e.target.value); setBebidaSeleccionada(null) }}
                />
              </div>
            </div>

            {/* Botón cobrar */}
            {precioActual > 0 && (
              <button onClick={cobrar} disabled={cargando}
                className={`w-full font-black py-5 rounded-2xl text-xl transition-all active:scale-95 shadow-lg ${precioActual > cliente.saldo ? 'bg-red-400 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
                {cargando ? 'Cobrando...' : precioActual > cliente.saldo ? '⚠️ Saldo insuficiente' : `Cobrar ${formatearPeso(precioActual)}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
