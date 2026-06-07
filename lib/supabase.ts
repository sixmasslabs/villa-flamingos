import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Cliente = {
  id: string
  nombre: string
  apellido: string
  telefono: string | null
  codigo: string
  saldo: number
  created_at: string
}

export type Transaccion = {
  id: string
  cliente_id: string
  tipo: 'carga' | 'consumo'
  monto: number
  descripcion: string | null
  fecha: string
  created_at: string
}

export function generarCodigo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function formatearPeso(monto: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(monto)
}
