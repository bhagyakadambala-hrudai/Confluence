# Confluence Wiki

A fully functional Confluence-like wiki application built with Next.js 14, Supabase, and Tiptap.

## Features

- **Auth** — Email/password + Google OAuth, protected routes
- **Spaces** — Create, manage, invite members, settings
- **Pages** — Rich text editor (Tiptap), nested pages (3 levels), auto-save every 3s
- **History** — Version snapshots, preview & restore
- **Comments** — Threaded, edit/delete your own
- **Search** — Global Cmd+K search, debounced real-time results
- **Labels** — Colored labels per page/space
- **Dark Mode** — Persisted toggle

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Setup

1. Open your Supabase project's SQL Editor
2. Run the entire contents of `supabase-schema.sql`
3. This creates all tables, RLS policies, triggers, and storage buckets

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploying to Vercel

1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

## Tech Stack

- **Next.js 14** — App Router, TypeScript, Server Components
- **Supabase** — PostgreSQL, Auth, Storage, Realtime
- **Tiptap** — Rich text editor with 15+ extensions
- **Tailwind CSS + shadcn/ui** — UI components
- **sonner** — Toast notifications
- **next-themes** — Dark mode
