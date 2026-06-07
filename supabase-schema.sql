-- Ejecutar este SQL en Supabase > SQL Editor

create table clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  telefono text,
  codigo text unique not null,
  saldo numeric(10,2) not null default 0,
  created_at timestamptz default now()
);

create table transacciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  tipo text not null check (tipo in ('carga', 'consumo')),
  monto numeric(10,2) not null,
  descripcion text,
  fecha date not null default current_date,
  created_at timestamptz default now()
);

-- Activar acceso público (sin autenticación por ahora)
alter table clientes enable row level security;
alter table transacciones enable row level security;

create policy "acceso_publico_clientes" on clientes for all using (true) with check (true);
create policy "acceso_publico_transacciones" on transacciones for all using (true) with check (true);
