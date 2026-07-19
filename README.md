# Quick Treat - Admin Panel (standalone)

This is a **completely separate Next.js app** from the main Quick Treat app.
It only connects to the same Supabase project (backend) using the service
role key — there is no shared frontend code, so you can deploy it privately
on its own domain (e.g. `admin.quicktreat.com` or a private Vercel project
with password/IP protection on top).

## Features

- Dashboard: total patients/doctors/hospitals, pending approvals, revenue
- Doctors: list, approve, reject (reject permanently deletes the account)
- Hospitals: list, approve, reject
- Users: list all patients/doctors/hospitals, delete any account
- Appointments: view all bookings across the platform
- Withdrawals: review doctor/hospital withdrawal requests, mark paid or reject
- Payments: full patient payment history across the platform

## Setup

1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` — same URL as the main app
   - `SUPABASE_SERVICE_ROLE_KEY` — same service role key as the main app
     (found in Supabase Dashboard → Project Settings → API). **Never**
     expose this key in the main patient-facing app's client code.
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — the one fixed admin login
   - `ADMIN_SESSION_SECRET` — any long random string (used to sign the
     admin session cookie; generate one with `openssl rand -hex 32`)
3. `npm run dev` and open `http://localhost:3000` (redirects to `/login`)

## Deploy privately

Deploy like any Next.js app (Vercel, Railway, your own server). Recommended
for a truly private admin tool:
- Deploy to its own project/domain, separate from the main app
- Add the same environment variables in your hosting provider's dashboard
- Consider adding Vercel's password protection / IP allowlist, or putting
  it behind a VPN, since this app can approve/delete accounts and touch
  wallet balances directly with the service role key

## How auth works

There's no user table for admin — just one fixed email/password from env
vars. On login, an httpOnly cookie is set to `ADMIN_SESSION_SECRET`.
`middleware.ts` checks that cookie on every request except `/login` and
`/api/login`. This is intentionally simple since there's only one admin.

## Notes on schema assumptions

These API routes assume the following tables/columns already exist in
Supabase (matching what the main app already uses):
- `profiles` (id, name, email, phone, role, district, upazila, created_at)
- `doctors` (id, bmdc_number, speciality, degree, experience,
  consultation_fee, is_approved, is_available) — `id` = the same UUID as
  the doctor's `profiles.id` / auth user id
- `hospitals` (id, dghs_license, whatsapp_number, address, total_beds,
  available_beds, has_oxygen, has_ot, is_approved) — same `id` convention
- `appointments` (id, patient_id, doctor_id, appointment_date,
  appointment_time, status, fee, symptoms, created_at)
- `payments` (id, patient_id, appointment_id, amount, payment_method,
  transaction_id, status, created_at)
- `withdrawal_requests` (id, user_id, role, amount, method,
  account_number, bank_name, account_holder_name, status, created_at)
- `doctor_wallets` (doctor_id, balance, total_earned, total_withdrawn,
  pending_withdrawal)
- `hospital_wallets` (hospital_id, balance, total_earned, total_withdrawn,
  pending_withdrawal)

If any of these column names differ in your actual database, the
corresponding route in `src/app/api/**/route.ts` will need a small tweak.

⚠️ One thing worth double-checking in the **main app**: some pages there
(doctor dashboard, wallet, pending-approval) query the `doctors` table by
`user_id`, but the current registration API (`/api/register-doctor`)
writes the row using `id` only and never sets `user_id`. If your `doctors`
table really has a separate `user_id` column, those pages may not find the
row. This admin panel uses `id` (matching what registration actually
writes), but it's worth reconciling which column your schema/pages should
standardize on.
"# Ueba-admin" 
