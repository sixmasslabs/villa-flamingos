'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PinGuard from '@/components/PinGuard'
import FlamingoLogo from '@/components/FlamingoLogo'
import { supabase } from '@/lib/supabase'

type Evento = {
  id: string
  nombre: string
  artista: string | null
  descripcion: string | null
  fecha: string
  activo: boolean
}

function AdminContenido() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [nombre, setNombre] = useState('')
  const [artista, setArtista] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [pinActual, setPinActual] = useState('')
  const [pinNuevo, setPinNuevo] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [guardandoPin, setGuardandoPin] = useState(false)

  useEffect(() => { cargarEventos() }, [])

  async function cargarEventos() {
    const { data } = await supabase.from('eventos').select('*').order('fecha', { ascending: false }).limit(20)
    setEventos(data || [])
  }

  async function crearEvento() {
    if (!nombre.trim()) return
    setGuardando(true)
    const { error } = await supabase.from('eventos').insert({
      nombre: nombre.trim(),
      artista: artista.trim() || null,
      descripcion: descripcion.trim() || null,
      fecha,
      activo: false,
    })
    setGuardando(false)
    if (!error) {
      setNombre(''); setArtista(''); setDescripcion('')
      setMensaje('Evento creado')
      cargarEventos()
      setTimeout(() => setMensaje(''), 2500)
    }
  }

  async function activarEvento(id: string) {
    // Desactiva todos, luego activa el seleccionado
    await supabase.from('eventos').update({ activo: false }).neq('id', 'none')
    await supabase.from('eventos').update({ activo: true }).eq('id', id)
    setMensaje('Evento activo actualizado')
    cargarEventos()
    setTimeout(() => setMensaje(''), 2500)
  }

  async function cambiarPin() {
    if (pinNuevo.length < 4) { setMensaje('El PIN debe tener al menos 4 dígitos'); return }
    if (pinNuevo !== pinConfirm) { setMensaje('Los PIN no coinciden'); return }
    setGuardandoPin(true)
    const { data } = await supabase.from('configuracion').select('valor').eq('clave', 'pin').single()
    if (data?.valor !== pinActual) {
      setGuardandoPin(false)
      setMensaje('PIN actual incorrecto')
      setTimeout(() => setMensaje(''), 2500)
      return
    }
    await supabase.from('configuracion').update({ valor: pinNuevo }).eq('clave', 'pin')
    setGuardandoPin(false)
    setPinActual(''); setPinNuevo(''); setPinConfirm('')
    setMensaje('PIN actualizado correctamente')
    setTimeout(() => setMensaje(''), 2500)
  }

  const inputClass = "w-full rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 border"
  const inputStyle = { borderColor: 'var(--cream-dark)', color: 'var(--charcoal)', background: 'white' }

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
          <h1 className="text-white font-semibold tracking-widest text-sm uppercase" style={{ fontFamily: 'var(--font-playfair)' }}>Administración</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(201,169,110,0.7)' }}>Eventos · PIN</p>
        </div>
      </div>

      {mensaje && (
        <div className="mx-4 mt-4 px-5 py-3 rounded-xl text-sm font-medium text-center bg-green-50 text-green-700 border border-green-200">
          ✓ {mensaje}
        </div>
      )}

      <div className="p-4 max-w-lg mx-auto space-y-5 pb-10">

        {/* Crear evento */}
        <div className="bg-white rounded-2xl border p-5 space-y-3" style={{ borderColor: 'var(--cream-dark)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-playfair)' }}>
            Nuevo evento
          </h2>
          <input className={inputClass} style={inputStyle} placeholder="Nombre del evento *" value={nombre} onChange={e => setNombre(e.target.value)} />
          <input className={inputClass} style={inputStyle} placeholder="Artista invitado" value={artista} onChange={e => setArtista(e.target.value)} />
          <input className={inputClass} style={inputStyle} placeholder="Descripción (opcional)" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          <input className={inputClass} style={inputStyle} type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          <button onClick={crearEvento} disabled={guardando || !nombre.trim()}
            className="w-full py-4 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'var(--rose)' }}>
            {guardando ? 'Creando...' : 'Crear evento'}
          </button>
        </div>

        {/* Lista de eventos */}
        {eventos.length > 0 && (
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--cream-dark)' }}>
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)', fontFamily: 'var(--font-playfair)' }}>
              Eventos
            </h2>
            <div className="space-y-2">
              {eventos.map(e => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: e.activo ? 'var(--rose)' : 'var(--cream-dark)', background: e.activo ? '#FFF0F3' : 'var(--cream)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--charcoal)' }}>{e.nombre}</p>
                    {e.artista && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{e.artista} · {e.fecha}</p>}
                  </div>
                  {e.activo ? (
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: 'var(--rose)', color: 'white' }}>ACTIVO</span>
                  ) : (
                    <button onClick={() => activarEvento(e.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
                      style={{ borderColor: 'var(--cream-dark)', color: 'var(--muted)' }}>
                      Activar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cambiar PIN */}
        <div className="bg-white rounded-2xl border p-5 space-y-3" style={{ borderColor: 'var(--cream-dark)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-playfair)' }}>
            Cambiar PIN de acceso
          </h2>
          <input className={inputClass} style={inputStyle} type="password" inputMode="numeric" placeholder="PIN actual" value={pinActual} onChange={e => setPinActual(e.target.value.replace(/\D/g, ''))} />
          <input className={inputClass} style={inputStyle} type="password" inputMode="numeric" placeholder="PIN nuevo (mín. 4 dígitos)" value={pinNuevo} onChange={e => setPinNuevo(e.target.value.replace(/\D/g, ''))} />
          <input className={inputClass} style={inputStyle} type="password" inputMode="numeric" placeholder="Confirmar PIN nuevo" value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ''))} />
          <button onClick={cambiarPin} disabled={guardandoPin}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'var(--charcoal)' }}>
            {guardandoPin ? 'Guardando...' : 'Actualizar PIN'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default function Admin() {
  return <PinGuard><AdminContenido /></PinGuard>
}
