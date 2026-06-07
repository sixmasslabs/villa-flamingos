import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'linear-gradient(135deg, #fce4ec 0%, #fff8f0 100%)' }}>

      {/* Logo / Título */}
      <div className="text-center mb-12">
        <div className="text-7xl mb-4">🦩</div>
        <h1 className="text-4xl font-black text-pink-600 tracking-tight">Villa Flamingos</h1>
        <p className="text-gray-500 mt-2 text-lg">Sistema de consumo interno</p>
      </div>

      {/* Botones principales */}
      <div className="w-full max-w-sm space-y-4">
        <Link href="/caja" className="flex items-center gap-4 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl p-5 shadow-md transition-all active:scale-95">
          <span className="text-4xl">💰</span>
          <div>
            <div className="font-bold text-xl">Caja</div>
            <div className="text-pink-100 text-sm">Registrar clientes y cargar saldo</div>
          </div>
        </Link>

        <Link href="/mesero" className="flex items-center gap-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl p-5 shadow-md transition-all active:scale-95">
          <span className="text-4xl">📷</span>
          <div>
            <div className="font-bold text-xl">Mesero</div>
            <div className="text-amber-100 text-sm">Escanear QR y cobrar consumo</div>
          </div>
        </Link>

        <Link href="/reporte" className="flex items-center gap-4 bg-slate-700 hover:bg-slate-800 text-white rounded-2xl p-5 shadow-md transition-all active:scale-95">
          <span className="text-4xl">📊</span>
          <div>
            <div className="font-bold text-xl">Reporte del día</div>
            <div className="text-slate-300 text-sm">Ver ventas y movimientos</div>
          </div>
        </Link>
      </div>

      <p className="text-gray-400 text-sm mt-12">v1.0 · Solo para uso interno</p>
    </div>
  )
}
