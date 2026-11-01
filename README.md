# Karigar

**Hire trusted home service professionals in Pakistan.** Post a job, compare offers from verified plumbers, electricians, maids and more, and choose the one you like.

**Live demo:** https://karigar-inky.vercel.app

Karigar is a full-stack web app built as a portfolio project. It is designed around a real problem: many skilled workers in Pakistan have limited literacy and smartphone use. So customers use a modern web app, while professionals are reached through WhatsApp and phone, and an admin team dispatches the work.

![Karigar home page](docs/screenshots/01-home.png)

## How it works

1. A customer posts a request (service, problem, address, budget, optional map pin and photos).
2. The admin team sees it instantly on a live dashboard and contacts suitable professionals on WhatsApp.
3. Professionals reply with a price. The team records each offer.
4. The customer compares offers and accepts one.
5. The team updates the job status. The customer sees it live, then rates the professional.

## Features

**Customers**
- Sign up and log in
- Create requests with a map pin, current location and up to 3 photos (compressed in the browser before upload)
- See offers arrive in real time and accept one
- Live job timeline, ratings, reviews and complaints

**Admin and dispatchers**
- Live dashboard with request counts and filters
- Dispatch page: suggested verified professionals, pre-filled WhatsApp message, offer recording, status updates
- Professionals management: add, verify, suspend, mark available
- Complaints management
- Pinned location opens in Maps, private photos are viewable

**Professionals**
- Apply through a simple public form, no password or app needed
- Applications arrive as "pending" and are verified by the team

**Quality**
- Mobile-first responsive design with a mobile menu
- Loading skeletons, spinners and subtle animations (respecting reduced-motion settings)
- Privacy Policy, Terms of Service and Cookie Policy pages

## Screenshots

| New request | Offers |
|---|---|
| ![New request](docs/screenshots/02-new-request.png) | ![Offers](docs/screenshots/03-offers.png) |

| Admin dashboard | Dispatch |
|---|---|
| ![Dashboard](docs/screenshots/04-dashboard.png) | ![Dispatch](docs/screenshots/05-dispatch.png) |

<img src="docs/screenshots/06-mobile.png" alt="Mobile view" width="280" />

## Tech stack

| Area | Technology |
|---|---|
| Framework | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email and password) |
| Realtime | Supabase Realtime (live offers and status) |
| File storage | Supabase Storage (private bucket, signed URLs) |
| Maps | Leaflet with OpenStreetMap |
| Hosting | Vercel |

## Security

Security was treated as a feature, not an afterthought:

- **Row Level Security** on every table. A customer can only read their own requests, offers, reviews and complaints.
- **Roles** (customer, dispatcher, admin) are enforced in the database. A trigger blocks any attempt to change a role through the API.
- **Least privilege:** table and column level grants, so the public API can only write the fields the app actually uses.
- **Private photo storage:** files live in a private bucket, are limited to JPEG and 2 MB, and are shown through short-lived signed URLs. Each user can only upload into their own folder.
- **Server-side rate limits** (database triggers) on new requests, complaints and professional applications.
- **Validated inputs** both in the browser and with database constraints (length limits, formats, allowed values).
- **Safe offer acceptance:** done through a database function that checks the offer belongs to the customer's own request.
- **Browser protections:** Content Security Policy, HSTS, `X-Frame-Options`, `nosniff` and a strict referrer policy (production builds).
- Spam protection on the public professional form (hidden honeypot field plus rate limit).
- Secrets are never committed. Only the public (publishable) Supabase key is used in the browser.

## Known limitations

This is a portfolio project, so some things are intentionally simple:

- Payment is cash only. There is no online payment yet.
- Email confirmation on signup is switched off. Turning it on needs a custom email provider and a domain.
- Professionals do not log in. The admin team contacts them on WhatsApp and records their offers.
- The interface is in English.

## Project structure

```
app/            Pages (home, login, signup, join, requests, admin, legal pages)
components/     Navbar, Footer, Logo, MapPicker, PhotoPicker, RequestPhotos, ...
lib/            Supabase client, photo upload, status helpers, site details
public/         Static assets
docs/           SRS document and screenshots
```

## Getting started

You need Node.js 20 or newer and a free [Supabase](https://supabase.com) project.

```bash
git clone https://github.com/SyedAliKazmi7/karigar.git
cd karigar
npm install
```

1. Copy `.env.example` to `.env.local`.
2. In your Supabase project, open **Project Settings → API Keys**, then copy the project URL and the publishable key into `.env.local`.
3. Create the database: tables, Row Level Security policies, triggers, the `request-photos` storage bucket and the six service categories (the full SQL schema file is a planned addition to this repository).
4. Start the app:

```bash
npm run dev
```

Open http://localhost:3000. To make your own account an admin, run this once in the Supabase SQL editor:

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## Documentation

The full Software Requirements Specification (functional and non-functional requirements, data model, use cases, risks) is in [`docs/SRS.pdf`](docs/SRS.pdf).

## Roadmap

- Professional login and dashboard so providers can send offers themselves
- Online payments (JazzCash, Easypaisa)
- Email confirmation with a custom email provider
- Automated WhatsApp messages (WhatsApp Business API)
- Demo mode with sample data
- Urdu interface

## Author

Built by Ali kazmi as a portfolio project.