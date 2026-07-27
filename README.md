# FC 26 Tournament (Road to Glory)

Modern view-only football tournament site with a Supabase-backed admin dashboard.

## Local Setup

If Node is not installed globally on this machine, enable the project-local Node install:

```bash
source env.sh
```

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Add environment variables from `.env.example` to `.env.local`.
4. Install dependencies with `npm install`.
5. Start the app with `npm run dev`.

## Admin Setup

Create an admin user and register them in the `admins` table with:

```bash
npm run admin:create -- --email admin@example.com --password 'use-a-strong-password'
```

Only authenticated users present in `admins` can write fixtures, scores, kickoff times, and knockout matches.

You can also do this manually in Supabase Auth, then insert the Auth user UUID into `admins`:

```sql
insert into public.admins (user_id, email)
values ('AUTH_USER_UUID', 'admin@example.com')
on conflict (user_id) do update set email = excluded.email;
```

## Deployment To Vercel

1. Push the project to GitHub.
2. Import the repo in Vercel.
3. Add these environment variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Use the default install command: `npm install`.
5. Use the default build command, or `npm run build`.
6. Deploy.

After deployment, add the production URL to Supabase Auth:

1. Supabase dashboard -> Authentication -> URL Configuration.
2. Set Site URL to your Vercel URL.
3. Add your Vercel URL to Redirect URLs.

The public site is read-only. Admins use `/admin/login`.
