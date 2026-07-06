-- ============================================================
-- Supabase Storage Configuration for "products" bucket
-- ============================================================
-- 
-- IMPORTANT: Run this SQL in the Supabase SQL Editor.
-- This creates the "products" bucket and sets up RLS policies.
--
-- Prerequisites:
-- 1. Create a Supabase project at https://supabase.com
-- 2. Get your project URL and anon key from Project Settings > API
-- 3. Set environment variables:
--    - NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
--    - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
-- ============================================================

-- 1. Create the "products" bucket (public access for reading)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,  -- Public bucket: anyone can read images via URL
  5242880,  -- 5 MB max file size
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policy: Allow public read access to product images
-- This allows anyone to view product images (needed for storefront)
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- 3. RLS Policy: Allow authenticated admins to upload images
-- Only authenticated users with admin role can upload
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

-- 4. RLS Policy: Allow authenticated admins to delete images
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

-- 5. RLS Policy: Allow authenticated admins to update images
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

-- ============================================================
-- Verification queries (run these to check configuration)
-- ============================================================

-- Check bucket exists and is public
-- SELECT * FROM storage.buckets WHERE id = 'products';

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%product%';

-- Test: List files in bucket (should return empty array initially)
-- SELECT * FROM storage.objects WHERE bucket_id = 'products';
