'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { supabase, generarCodigo, formatearPeso, type Cliente } from '@/lib/supabase'

type Vista = 'buscar' | 'nuevo' | 'cliente'

export default function Caja() {
  const [vista, setVista] = useState<Vista>('buscar')
  const [busqueda, setBusqueda] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteActivo, setClienteActivo] = useState<Cliente | null>(null)
  const [monto, setMonto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'ok' | 'error' } | null>(null)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoApellido, setNuevoApellido] = useState('')
  const [nuevoTel, setNuevoTel] = useState('')
  const qrRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (busqueda.length >= 2) buscarClientes()
    else setClientes([])
  }, [busqueda])

  useEffect(() => {
    if (clienteActivo && qrRef.current) {
      const url = `${window.location.origin}/cliente/${clienteActivo.id}`
      QRCode.toCanvas(qrRef.current, url, { width: 220, margin: 2 })
    }
  }, [clienteActivo])

  async function buscarClientes() {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .or(`nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`)
      .order('nombre')
      .limit(10)
    setClientes(data || [])
  }

  async function registrarCliente() {
    if (!nuevoNombre.trim() || !nuevoApellido.trim()) {
      mostrarMensaje('Nombre y apellido son obligatorios', 'error')
      return
    }
    setCargando(true)
    const codigo = generarCodigo()
    const { data, error } = await supabase
      .from('clientes')
      .insert({ nombre: nuevoNombre.trim(), apellido: nuevoApellido.trim(), telefono: nuevoTel.trim() || null, codigo })
      .select()
      .single()
    setCargando(false)
    if (error) { mostrarMensaje('Error al registrar', 'error'); return }
    setClienteActivo(data)
    setVista('cliente')
    setNuevoNombre(''); setNuevoApellido(''); setNuevoTel('')
  }

  async function cargarSaldo() {
    const montoNum = parseFloat(monto)
    if (!clienteActivo || isNaN(montoNum) || montoNum <= 0) {
      mostrarMensaje('Ingresa un monto válido', 'error')
      return
    }
    setCargando(true)
    const nuevoSaldo = clienteActivo.saldo + montoNum
    const { error: e1 } = await supabase
      .from('clientes')
      .update({ saldo: nuevoSaldo })
      .eq('id', clienteActivo.id)
    if (e1) { setCargando(false); mostrarMensaje('Error al cargar saldo', 'error'); return }
    await supabase.from('transacciones').insert({
      cliente_id: clienteActivo.id,
      tipo: 'carga',
      monto: montoNum,
      descripcion: 'Carga en caja (efectivo)',
    })
    setClienteActivo({ ...clienteActivo, saldo: nuevoSaldo })
    setMonto('')
    setCargando(false)
    mostrarMensaje(`✓ ${formatearPeso(montoNum)} cargados correctamente`, 'ok')
  }

  function mostrarMensaje(texto: string, tipo: 'ok' | 'error') {
    setMensaje({ texto, tipo })
    setTimeout(() => setMensaje(null), 3500)
  }

  function seleccionarCliente(c: Cliente) {
    setClienteActivo(c)
    setBusqueda('')
    setClientes([])
    setVista('cliente')
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8f4f0' }}>
      {/* Header */}
      <div className="bg-pink-500 text-white px-5 py-4 flex items-center gap-3 shadow">
        <Link href="/" className="text-white text-2xl">←</Link>
        <div>
          <h1 className="font-bold text-xl">💰 Caja</h1>
          <p className="text-pink-100 text-sm">Registrar clientes y cargar saldo</p>
        </div>
      </div>

      {/* Mensaje flotante */}
      {mensaje && (
        <div className={`mx-4 mt-4 p-4 rounded-xl font-semibold text-center ${mensaje.tipo === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="p-4 max-w-lg mx-auto space-y-4">

        {/* Tabs */}
        {vista !== 'cliente' && (
          <div className="flex gap-2">
            <button onClick={() => setVista('buscar')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${vista === 'buscar' ? 'bg-pink-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200'}`}>
              Buscar cliente
            </button>
            <button onClick={() => setVista('nuevo')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${vista === 'nuevo' ? 'bg-pink-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200'}`}>
              + Nuevo cliente
            </button>
          </div>
        )}

        {/* Buscar cliente */}
        {vista === 'buscar' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
              placeholder="Buscar por nombre o teléfono..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              autoFocus
            />
            {clientes.map(c => (
              <button key={c.id} onClick={() => seleccionarCliente(c)}
                className="w-full flex items-center justify-between bg-gray-50 hover:bg-pink-50 rounded-xl px-4 py-3 transition-all border border-transparent hover:border-pink-200">
                <div className="text-left">
                  <div className="font-semibold text-gray-800">{c.nombre} {c.apellido}</div>
                  <div className="text-sm text-gray-400">{c.telefono || 'Sin teléfono'}</div>
                </div>
                <div className="font-bold text-pink-500 text-lg">{formatearPeso(c.saldo)}</div>
              </button>
            ))}
            {busqueda.length >= 2 && clientes.length === 0 && (
              <p className="text-center text-gray-400 py-4">No encontrado. ¿Deseas registrarlo?</p>
            )}
          </div>
        )}

        {/* Nuevo cliente */}
        {vista === 'nuevo' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
            <h2 className="font-bold text-gray-700 text-lg">Datos del cliente</h2>
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
              placeholder="Nombre *" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} />
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
              placeholder="Apellido *" value={nuevoApellido} onChange={e => setNuevoApellido(e.target.value)} />
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
              placeholder="Teléfono (opcional)" type="tel" value={nuevoTel} onChange={e => setNuevoTel(e.target.value)} />
            <button onClick={registrarCliente} disabled={cargando}
              className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95">
              {cargando ? 'Registrando...' : 'Registrar cliente'}
            </button>
          </div>
        )}

        {/* Panel cliente activo */}
        {vista === 'cliente' && clienteActivo && (
          <div className="space-y-4">
            {/* Botón volver */}
            <button onClick={() => { setVista('buscar'); setClienteActivo(null) }}
              className="text-pink-500 font-semibold flex items-center gap-1">
              ← Buscar otro cliente
            </button>

            {/* Info cliente */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
              <div className="text-2xl font-black text-gray-800">{clienteActivo.nombre} {clienteActivo.apellido}</div>
              <div className="text-gray-400 mt-1">{clienteActivo.telefono || 'Sin teléfono'}</div>
              <div className="mt-4 text-5xl font-black text-pink-500">{formatearPeso(clienteActivo.saldo)}</div>
              <div className="text-gray-400 text-sm mt-1">Saldo disponible</div>

              {/* QR Code */}
              <div className="mt-5 flex flex-col items-center">
                <canvas ref={qrRef} className="rounded-xl" />
                <p className="text-xs text-gray-400 mt-2">QR del cliente</p>
              </div>
            </div>

            {/* Cargar saldo */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h2 className="font-bold text-gray-700 text-lg">Cargar saldo en efectivo</h2>
              <div className="grid grid-cols-3 gap-2">
                {[100, 200, 300, 500, 1000, 2000].map(v => (
                  <button key={v} onClick={() => setMonto(String(v))}
                    className={`py-3 rounded-xl font-bold text-lg border transition-all ${monto === String(v) ? 'bg-pink-500 text-white border-pink-500' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-pink-300'}`}>
                    ${v}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Otro monto..."
                  type="number"
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                />
                <button onClick={cargarSaldo} disabled={cargando || !monto}
                  className="bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-bold px-5 rounded-xl transition-all active:scale-95 text-lg">
                  {cargando ? '...' : 'Cargar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
