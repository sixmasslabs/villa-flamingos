import Link from 'next/link'
import FlamingoLogo from '@/components/FlamingoLogo'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #2C1A22 0%, #4A2535 50%, #2C1A22 100%)' }}>

      {/* Fondo textura sutil */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle at 25% 25%, #C9A96E 1px, transparent 1px), radial-gradient(circle at 75% 75%, #C9A96E 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="relative flex flex-col items-center justify-center flex-1 px-6 py-16">

        {/* Logo y nombre */}
        <div className="text-center mb-14">
          <div className="flex justify-center mb-5">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-5 border border-white/20">
              <FlamingoLogo size={72} />
            </div>
          </div>
          <h1 className="text-white text-4xl tracking-[0.15em] uppercase mb-2"
            style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400 }}>
            Villa Flamingos
          </h1>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-12" style={{ background: '#C9A96E' }} />
            <p className="text-xs tracking-[0.25em] uppercase" style={{ color: '#C9A96E' }}>
              Sistema de consumo
            </p>
            <div className="h-px w-12" style={{ background: '#C9A96E' }} />
          </div>
        </div>

        {/* Botones */}
        <div className="w-full max-w-sm space-y-3">
          <Link href="/caja" className="flex items-center gap-4 rounded-2xl p-5 transition-all active:scale-95 border border-white/10 hover:border-white/30"
            style={{ background: 'rgba(192, 88, 110, 0.85)', backdropFilter: 'blur(8px)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/20">
              💰
            </div>
            <div>
              <div className="text-white font-semibold text-lg tracking-wide">Caja</div>
              <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>Registrar clientes · Cargar saldo</div>
            </div>
            <div className="ml-auto text-white/40 text-xl">›</div>
          </Link>

          <Link href="/mesero" className="flex items-center gap-4 rounded-2xl p-5 transition-all active:scale-95 border border-white/10 hover:border-white/30"
            style={{ background: 'rgba(201, 169, 110, 0.75)', backdropFilter: 'blur(8px)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/20">
              📷
            </div>
            <div>
              <div className="text-white font-semibold text-lg tracking-wide">Servicio</div>
              <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>Escanear QR · Cobrar consumo</div>
            </div>
            <div className="ml-auto text-white/40 text-xl">›</div>
          </Link>

          <Link href="/reporte" className="flex items-center gap-4 rounded-2xl p-5 transition-all active:scale-95 border border-white/10 hover:border-white/30"
            style={{ background: 'rgba(44, 26, 34, 0.8)', backdropFilter: 'blur(8px)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/10">
              📊
            </div>
            <div>
              <div className="text-white font-semibold text-lg tracking-wide">Reporte</div>
              <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.50)' }}>Ventas y movimientos del día</div>
            </div>
            <div className="ml-auto text-white/40 text-xl">›</div>
          </Link>

          <Link href="/admin" className="flex items-center gap-4 rounded-2xl p-4 transition-all active:scale-95 border border-white/8 hover:border-white/20"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white/8">
              ⚙️
            </div>
            <div>
              <div className="text-sm font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>Administración</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>Eventos · PIN · Configuración</div>
            </div>
            <div className="ml-auto text-white/20 text-lg">›</div>
          </Link>
        </div>

        <p className="mt-14 text-xs tracking-widest uppercase" style={{ color: 'rgba(201,169,110,0.4)' }}>
          Uso exclusivo del personal
        </p>
      </div>
    </div>
  )
}
