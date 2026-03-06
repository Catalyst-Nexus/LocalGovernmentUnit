# Supabase Setup Guide

This application uses Supabase for image storage. Follow these steps to configure Supabase:

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up/login
2. Click "New Project"
3. Fill in your project details
4. Wait for the project to be ready

## 2. Create Storage Buckets

1. In your Supabase project dashboard, navigate to **Storage** in the left sidebar
2. Click "Create a new bucket"
3. Create two public buckets with the following names:
   - `system_logo` (for application logo)
   - `profile_picture` (for user profile pictures)
4. Make sure both buckets are set to **Public** by:
   - Selecting the bucket
   - Going to "Configuration"
   - Setting "Public bucket" to ON

## 3. Set Up Storage Policies

For each bucket, you need to set up policies to allow uploads and reads:

### For `system_logo` bucket:

Go to Storage → system_logo → Policies and create these policies:

**Policy 1: Allow public read access**

```sql
DROP POLICY IF EXISTS "system_logo Public Access" ON storage.objects;
CREATE POLICY "system_logo Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'system_logo');
```

**Policy 2: Allow authenticated uploads**

```sql
DROP POLICY IF EXISTS "system_logo Authenticated users can upload" ON storage.objects;
CREATE POLICY "system_logo Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'system_logo');
```

**Policy 3: Allow authenticated updates**

```sql
DROP POLICY IF EXISTS "system_logo Authenticated users can update" ON storage.objects;
CREATE POLICY "system_logo Authenticated users can update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'system_logo');
```

### For `profile_picture` bucket:

Go to Storage → profile_picture → Policies and create these policies:

> **Note:** Policy names must be unique across all buckets on `storage.objects`.
> These use `profile_picture` prefixed names to avoid conflicts with `system_logo` policies.

**Policy 1: Allow public read access**

```sql
DROP POLICY IF EXISTS "profile_picture Public Access" ON storage.objects;
CREATE POLICY "profile_picture Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_picture');
```

**Policy 2: Allow authenticated uploads**

```sql
DROP POLICY IF EXISTS "profile_picture Authenticated users can upload" ON storage.objects;
CREATE POLICY "profile_picture Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile_picture');
```

**Policy 3: Allow authenticated updates**

```sql
DROP POLICY IF EXISTS "profile_picture Authenticated users can update" ON storage.objects;
CREATE POLICY "profile_picture Authenticated users can update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile_picture');
```

## 4. Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy your:
   - Project URL
   - Anon/public key

## 5. Configure Environment Variables

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## 6. Restart Your Development Server

After configuring the environment variables, restart your development server:

```bash
npm run dev
```

## Demo Mode

If you don't configure Supabase, the application will run in demo mode:

- Images will be stored temporarily in browser memory
- Images will be lost on page refresh
- You'll see a warning message when uploading

## Usage

Once configured:

- Go to **Settings** to upload your system logo
- Go to **User Profile** to upload your profile picture
- The logo will appear in the header and sidebar
- Profile pictures will appear in the header dropdown and profile page

## Troubleshooting

### Images not uploading?

- Check that your Supabase URL and API key are correct
- Verify that the storage buckets exist and are public
- Check that the policies are correctly set up

### Images not displaying?

- Check browser console for errors
- Verify that the bucket names match exactly: `system_logo` and `profile_picture`
- Ensure the buckets are set to public

### Need help?

Consult the [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
