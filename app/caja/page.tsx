'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import FlamingoLogo from '@/components/FlamingoLogo'
import PinGuard from '@/components/PinGuard'
import { supabase, generarCodigo, formatearPeso, type Cliente } from '@/lib/supabase'

type Vista = 'buscar' | 'nuevo' | 'cliente'

function Caja() {
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
      QRCode.toCanvas(qrRef.current, url, {
        width: 200,
        margin: 2,
        color: { dark: '#2C1A22', light: '#FAF6F1' }
      })
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
    const { error: e1 } = await supabase.from('clientes').update({ saldo: nuevoSaldo }).eq('id', clienteActivo.id)
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
    mostrarMensaje(`${formatearPeso(montoNum)} cargados correctamente`, 'ok')
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

  const inputClass = "w-full rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 border"

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <div className="px-5 py-5 flex items-center gap-4 border-b" style={{ background: 'var(--charcoal)', borderColor: 'rgba(201,169,110,0.2)' }}>
        <Link href="/" className="opacity-60 hover:opacity-100 transition-opacity">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
            <path d="M12 4l-6 6 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </Link>
        <FlamingoLogo size={32} />
        <div>
          <h1 className="text-white font-semibold tracking-widest text-sm uppercase" style={{ fontFamily: 'var(--font-playfair)' }}>Caja</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(201,169,110,0.7)' }}>Clientes y saldo</p>
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`mx-4 mt-4 px-5 py-4 rounded-xl text-sm font-medium text-center ${mensaje.tipo === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {mensaje.tipo === 'ok' ? '✓ ' : '⚠ '}{mensaje.texto}
        </div>
      )}

      <div className="p-4 max-w-lg mx-auto space-y-4 pb-10">

        {/* Tabs */}
        {vista !== 'cliente' && (
          <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--cream-dark)' }}>
            {(['buscar', 'nuevo'] as const).map((v) => (
              <button key={v} onClick={() => setVista(v)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={vista === v
                  ? { background: 'var(--charcoal)', color: 'white' }
                  : { color: 'var(--muted)' }}>
                {v === 'buscar' ? 'Buscar cliente' : '+ Nuevo cliente'}
              </button>
            ))}
          </div>
        )}

        {/* Buscar */}
        {vista === 'buscar' && (
          <div className="space-y-3">
            <input
              className={inputClass}
              style={{ borderColor: 'var(--cream-dark)', background: 'white', color: 'var(--charcoal)' }}
              placeholder="Buscar por nombre o teléfono..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              autoFocus
            />
            {clientes.map(c => (
              <button key={c.id} onClick={() => seleccionarCliente(c)}
                className="w-full flex items-center justify-between bg-white hover:bg-rose-50 rounded-xl px-5 py-4 transition-all border text-left"
                style={{ borderColor: 'var(--cream-dark)' }}>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--charcoal)' }}>{c.nombre} {c.apellido}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{c.telefono || 'Sin teléfono'}</div>
                </div>
                <div className="font-bold text-base" style={{ color: 'var(--rose)' }}>{formatearPeso(c.saldo)}</div>
              </button>
            ))}
            {busqueda.length >= 2 && clientes.length === 0 && (
              <p className="text-center py-6 text-sm" style={{ color: 'var(--muted)' }}>
                No encontrado — prueba con <button onClick={() => setVista('nuevo')} className="underline" style={{ color: 'var(--rose)' }}>registrar nuevo</button>
              </p>
            )}
          </div>
        )}

        {/* Nuevo cliente */}
        {vista === 'nuevo' && (
          <div className="bg-white rounded-2xl border p-5 space-y-3" style={{ borderColor: 'var(--cream-dark)' }}>
            <h2 className="font-semibold tracking-wide text-sm uppercase mb-4" style={{ color: 'var(--muted)', fontFamily: 'var(--font-playfair)' }}>
              Datos del cliente
            </h2>
            {[
              { placeholder: 'Nombre *', value: nuevoNombre, onChange: setNuevoNombre },
              { placeholder: 'Apellido *', value: nuevoApellido, onChange: setNuevoApellido },
              { placeholder: 'Teléfono (opcional)', value: nuevoTel, onChange: setNuevoTel },
            ].map((f, i) => (
              <input key={i}
                className={inputClass}
                style={{ borderColor: 'var(--cream-dark)', color: 'var(--charcoal)' }}
                placeholder={f.placeholder}
                value={f.value}
                onChange={e => f.onChange(e.target.value)}
                type={i === 2 ? 'tel' : 'text'}
              />
            ))}
            <button onClick={registrarCliente} disabled={cargando}
              className="w-full py-4 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50 mt-2"
              style={{ background: 'var(--rose)' }}>
              {cargando ? 'Registrando...' : 'Registrar cliente'}
            </button>
          </div>
        )}

        {/* Cliente activo */}
        {vista === 'cliente' && clienteActivo && (
          <div className="space-y-4">
            <button onClick={() => { setVista('buscar'); setClienteActivo(null) }}
              className="text-sm flex items-center gap-1 font-medium" style={{ color: 'var(--rose)' }}>
              ← Buscar otro
            </button>

            {/* Card cliente */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--charcoal)' }}>
              <div className="px-6 pt-6 pb-4">
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'rgba(201,169,110,0.6)' }}>Cliente</p>
                <h2 className="text-2xl text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {clienteActivo.nombre} {clienteActivo.apellido}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{clienteActivo.telefono || 'Sin teléfono'}</p>
              </div>
              <div className="mx-4 mb-4 rounded-xl px-5 py-4 flex items-center justify-between" style={{ background: 'rgba(192,88,110,0.25)', border: '1px solid rgba(192,88,110,0.3)' }}>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Saldo disponible</span>
                <span className="text-3xl font-bold" style={{ color: '#F2D0D8', fontFamily: 'var(--font-playfair)' }}>
                  {formatearPeso(clienteActivo.saldo)}
                </span>
              </div>
              <div className="flex justify-center pt-1 pb-4">
                <div className="bg-white rounded-xl p-3">
                  <canvas ref={qrRef} className="rounded-lg block" />
                </div>
              </div>

              {/* Botón WhatsApp */}
              <div className="px-4 pb-5">
                <a
                  href={`https://wa.me/${clienteActivo.telefono ? '52' + clienteActivo.telefono.replace(/\D/g, '') : ''}?text=${encodeURIComponent(`¡Hola ${clienteActivo.nombre}! 🦩 Este es tu acceso a Villa Flamingos. Aquí puedes ver tu saldo en tiempo real:\n\n${typeof window !== 'undefined' ? window.location.origin : ''}/cliente/${clienteActivo.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-3 rounded-xl font-semibold text-white transition-all active:scale-95"
                  style={{ background: '#25D366' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Enviar por WhatsApp
                </a>
              </div>
            </div>

            {/* Cargar saldo */}
            <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: 'var(--cream-dark)' }}>
              <h2 className="font-semibold text-sm uppercase tracking-wide" style={{ color: 'var(--muted)', fontFamily: 'var(--font-playfair)' }}>
                Cargar saldo — efectivo
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {[100, 200, 300, 500, 1000, 2000].map(v => (
                  <button key={v} onClick={() => setMonto(String(v))}
                    className="py-3 rounded-xl font-semibold transition-all border text-sm"
                    style={monto === String(v)
                      ? { background: 'var(--rose)', color: 'white', borderColor: 'var(--rose)' }
                      : { background: 'var(--cream)', color: 'var(--charcoal)', borderColor: 'var(--cream-dark)' }}>
                    ${v}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className={inputClass + ' flex-1 font-semibold text-lg'}
                  style={{ borderColor: 'var(--cream-dark)', color: 'var(--charcoal)' }}
                  placeholder="Otro monto..."
                  type="number"
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                />
                <button onClick={cargarSaldo} disabled={cargando || !monto}
                  className="px-6 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: monto ? '#2E7D32' : 'var(--muted)' }}>
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

export default function CajaPage() {
  return <PinGuard><Caja /></PinGuard>
}
