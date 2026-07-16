create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  uploader text default '匿名',
  chapter_count int default 0,
  moment_count int default 0,
  file_content text not null,
  created_at timestamptz default now()
);
alter table books enable row level security;
create policy "anyone can read" on books for select using (true);
create policy "anyone can insert" on books for insert with check (true);
