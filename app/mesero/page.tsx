'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Html5Qrcode } from 'html5-qrcode'
import FlamingoLogo from '@/components/FlamingoLogo'
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

  useEffect(() => { return () => { detenerScanner() } }, [])

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
    const partes = texto.split('/')
    const id = partes[partes.length - 1]
    if (!id || id.length < 10) { mostrarMensaje('QR no reconocido', 'error'); return }
    const { data } = await supabase.from('clientes').select('*').eq('id', id).single()
    if (!data) { mostrarMensaje('Cliente no encontrado', 'error'); return }
    setCliente(data)
    setVista('cobro')
  }

  async function cobrar() {
    const precio = bebidaSeleccionada?.precio ?? parseFloat(montoCustom)
    if (!cliente || isNaN(precio) || precio <= 0) { mostrarMensaje('Selecciona una bebida o ingresa un monto', 'error'); return }
    if (precio > cliente.saldo) { mostrarMensaje('Saldo insuficiente', 'error'); return }
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
    mostrarMensaje(`${formatearPeso(precio)} cobrados`, 'ok')
  }

  function mostrarMensaje(texto: string, tipo: 'ok' | 'error') {
    setMensaje({ texto, tipo })
    setTimeout(() => setMensaje(null), 3500)
  }

  const precioActual = bebidaSeleccionada?.precio ?? (parseFloat(montoCustom) || 0)
  const saldoInsuficiente = cliente ? precioActual > cliente.saldo : false

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <div className="px-5 py-5 flex items-center gap-4 border-b" style={{ background: 'var(--charcoal)', borderColor: 'rgba(201,169,110,0.2)' }}>
        <Link href="/" className="opacity-60 hover:opacity-100 transition-opacity">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
            <path d="M12 4l-6 6 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </Link>
        <FlamingoLogo size={32} />
        <div>
          <h1 className="text-white font-semibold tracking-widest text-sm uppercase" style={{ fontFamily: 'var(--font-playfair)' }}>Servicio</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(201,169,110,0.7)' }}>Escanear · Cobrar</p>
        </div>
      </div>

      {mensaje && (
        <div className={`mx-4 mt-4 px-5 py-4 rounded-xl text-sm font-medium text-center ${mensaje.tipo === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {mensaje.tipo === 'ok' ? '✓ ' : '⚠ '}{mensaje.texto}
        </div>
      )}

      <div className="p-4 max-w-lg mx-auto space-y-4 pb-10">

        {/* Escaner */}
        {vista === 'escaner' && (
          <div className="space-y-4">
            <div id={scannerDivId} className={`rounded-2xl overflow-hidden bg-black ${!escaneando ? 'hidden' : ''}`} />
            {!escaneando && (
              <div className="rounded-2xl text-center p-10 border" style={{ background: 'var(--charcoal)', borderColor: 'rgba(201,169,110,0.15)' }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)' }}>
                  <span className="text-4xl">📷</span>
                </div>
                <h2 className="text-xl text-white mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>Listo para escanear</h2>
                <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.4)' }}>Apunta la cámara al código QR del cliente</p>
                <button onClick={iniciarScanner}
                  className="px-8 py-3 rounded-xl font-semibold text-white transition-all active:scale-95"
                  style={{ background: 'var(--gold)' }}>
                  Abrir cámara
                </button>
              </div>
            )}
            {escaneando && (
              <button onClick={detenerScanner}
                className="w-full py-3 rounded-xl text-sm font-medium border transition-all"
                style={{ borderColor: 'var(--cream-dark)', color: 'var(--muted)', background: 'white' }}>
                Cancelar
              </button>
            )}
          </div>
        )}

        {/* Panel cobro */}
        {vista === 'cobro' && cliente && (
          <div className="space-y-4">
            <button onClick={() => { setCliente(null); setBebidaSeleccionada(null); setMontoCustom(''); setVista('escaner') }}
              className="text-sm flex items-center gap-1 font-medium" style={{ color: 'var(--rose)' }}>
              ← Otro cliente
            </button>

            {/* Info cliente */}
            <div className="rounded-2xl px-5 py-4 flex items-center justify-between" style={{ background: 'var(--charcoal)' }}>
              <div>
                <p className="text-xs tracking-wider uppercase mb-1" style={{ color: 'rgba(201,169,110,0.6)' }}>Cliente</p>
                <p className="text-white font-semibold text-lg" style={{ fontFamily: 'var(--font-playfair)' }}>{cliente.nombre} {cliente.apellido}</p>
              </div>
              <div className="text-right">
                <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Saldo</p>
                <p className="text-2xl font-bold" style={{ color: '#F2D0D8', fontFamily: 'var(--font-playfair)' }}>{formatearPeso(cliente.saldo)}</p>
              </div>
            </div>

            {/* Bebidas */}
            <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: 'var(--cream-dark)' }}>
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)', fontFamily: 'var(--font-playfair)' }}>Selecciona el consumo</h2>
              <div className="grid grid-cols-2 gap-2">
                {BEBIDAS.map(b => (
                  <button key={b.nombre} onClick={() => { setBebidaSeleccionada(b); setMontoCustom('') }}
                    className="py-3 px-4 rounded-xl border text-left transition-all"
                    style={bebidaSeleccionada?.nombre === b.nombre
                      ? { background: 'var(--charcoal)', borderColor: 'var(--charcoal)' }
                      : { background: 'var(--cream)', borderColor: 'var(--cream-dark)' }}>
                    <div className="font-semibold text-sm" style={{ color: bebidaSeleccionada?.nombre === b.nombre ? 'white' : 'var(--charcoal)' }}>{b.nombre}</div>
                    <div className="text-xs mt-0.5" style={{ color: bebidaSeleccionada?.nombre === b.nombre ? 'rgba(201,169,110,0.8)' : 'var(--muted)' }}>${b.precio}</div>
                  </button>
                ))}
              </div>
              <input
                className="w-full rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 border font-semibold"
                style={{ borderColor: 'var(--cream-dark)', color: 'var(--charcoal)' }}
                placeholder="Monto personalizado..."
                type="number"
                value={montoCustom}
                onChange={e => { setMontoCustom(e.target.value); setBebidaSeleccionada(null) }}
              />
            </div>

            {precioActual > 0 && (
              <button onClick={cobrar} disabled={cargando}
                className="w-full py-5 rounded-2xl font-bold text-xl transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: saldoInsuficiente ? '#ef4444' : '#2E7D32',
                  color: 'white',
                  fontFamily: 'var(--font-playfair)'
                }}>
                {cargando ? 'Procesando...' : saldoInsuficiente ? 'Saldo insuficiente' : `Cobrar ${formatearPeso(precioActual)}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
