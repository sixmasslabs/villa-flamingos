-- Ejecutar en Supabase > SQL Editor
-- PARTE 2: Eventos, PIN y Tiempo Real

-- Tabla de eventos
create table eventos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  artista text,
  descripcion text,
  fecha date not null default current_date,
  activo boolean not null default false,
  created_at timestamptz default now()
);

-- Tabla de configuración (guarda el PIN)
create table configuracion (
  clave text primary key,
  valor text not null
);

-- PIN inicial: 1234 (cámbialo desde el panel Admin)
insert into configuracion (clave, valor) values ('pin', '1234');

-- RLS
alter table eventos enable row level security;
alter table configuracion enable row level security;
create policy "publico_eventos" on eventos for all using (true) with check (true);
create policy "publico_config" on configuracion for all using (true) with check (true);

-- Activar tiempo real en la tabla clientes
alter publication supabase_realtime add table clientes;
