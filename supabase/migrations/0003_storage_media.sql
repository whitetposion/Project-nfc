-- ============================================================
-- Media storage: replaces Cloudinary with a single Supabase Storage
-- bucket, organized by folder per media purpose:
--   products/                admin writes, public reads
--   templates/                admin writes, public reads
--   experiences/{user_id}/    owner writes, public reads
-- Run in Supabase SQL Editor.
-- ============================================================

-- ---------- BUCKET ----------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- ---------- STORAGE POLICIES ----------
-- All folders are public read — every asset here (product photos,
-- template previews, published experience media) is meant to be seen
-- by anyone with the URL.
create policy "public reads media"
  on storage.objects for select
  using (bucket_id = 'media');

-- Admin manages products/ and templates/. Owners manage their own
-- experiences/{user_id}/ folder. Nothing else is writable.
create policy "admin or owner writes media"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and (
      is_admin()
      or (
        (storage.foldername(name))[1] = 'experiences'
        and (storage.foldername(name))[2] = auth.uid()::text
      )
    )
  );

create policy "admin or owner updates media"
  on storage.objects for update
  using (
    bucket_id = 'media'
    and (
      is_admin()
      or (
        (storage.foldername(name))[1] = 'experiences'
        and (storage.foldername(name))[2] = auth.uid()::text
      )
    )
  );

create policy "admin or owner deletes media"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and (
      is_admin()
      or (
        (storage.foldername(name))[1] = 'experiences'
        and (storage.foldername(name))[2] = auth.uid()::text
      )
    )
  );

-- ---------- CLEAN UP CLOUDINARY-SPECIFIC COLUMN ----------
-- assets.cloudinary_public_id isn't wired into any app code yet;
-- rename it now so nothing has to migrate data later.
alter table assets rename column cloudinary_public_id to storage_path;

comment on column products.media is '[{url, type, alt}] — Supabase Storage public URLs under products/';
comment on column templates.preview_image is 'Supabase Storage public URL under templates/';
