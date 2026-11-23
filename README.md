# Camping Lodge
Next.js App Router + TypeScript + Tailwind + Framer Motion + Supabase. This is an implementation starter with a read-only demo catalogue when no Supabase URL is configured. It is not independently production-tested.

## Local setup (Windows PowerShell)
1. Install Node.js 22 LTS and extract this ZIP.
2. Open the project folder in VS Code. Run `npm install` then `Copy-Item .env.example .env.local`.
3. Run `npm run dev`, browse http://localhost:3000. Demo data is visible without credentials; real submissions require Supabase.
4. Create a Supabase project. In SQL Editor run `supabase/schema.sql` once, then `supabase/seed.sql` once on the empty schema. These scripts are not migrations for an existing database.
5. Copy Project URL, anon (legacy) key and service role key into `.env.local`. Never share or commit the service role key. Restart Next.js.
6. In Supabase Authentication create a user (or register through the website and verify email). Copy its UUID. In SQL Editor run:

```sql
insert into public.roles(user_id, role) values ('REPLACE-WITH-AUTH-USER-UUID','Owner');
```

7. Sign in at `/account` and open `/admin`. Staff accounts must first exist in Supabase Auth; the Owner can assign their UUID in Users.
8. Set Auth Site URL and permitted redirect URLs to localhost and production domain `/account`. Optional Google sign-in requires enabling Google provider and entering OAuth client credentials in Supabase.

## Email
Enable two-step verification on the Gmail sender account and create an app password (if eligible). Set SMTP_USER and SMTP_PASSWORD; set host smtp.gmail.com, port 465. Contact messages are stored before email is attempted; the UI explicitly reports if notification failed. The recipient is read from site settings. Test with a real message.

## Google Places and map
Enable Places API (New) and billing in Google Cloud, restrict the server API key to Places API, set GOOGLE_PLACES_API_KEY in the environment and the business Place ID in Admin Settings. API returns a limited selection of reviews, not all reviews. Review requests have a one-hour Next.js fetch revalidation interval; verify applicable Google Maps Platform terms before enabling caching in production. Hidden reviews are a JSON array of review resource names. For the map use Google Maps Share > Embed a map and paste the iframe src into `map_embed`; the supplied short URL is used for directions. No Place ID or embed source was supplied.

## Booking behavior
The server recalculates rates and expands packages into individual stock lines. SQL advisory lock serializes bookings and status changes. Pending, Confirmed and Picked up orders hold stock for half-open date ranges [pickup, return). Same-day rentals are not supported. Pending requests must be cancelled manually if abandoned. Cart dates apply to the whole order. WhatsApp opens from confirmation via explicit click to avoid popup blocking; saving does not send the WhatsApp message automatically. Deposits are included in order totals; returned order value is not accounting revenue. Staff can alter status, not order line details.

## Deploy to Vercel
Push the extracted folder to a private Git repository, import it in Vercel as Next.js, set all environment variables, and set NEXT_PUBLIC_SITE_URL to your final HTTPS domain. Run `npm run typecheck` and `npm run build` locally before deploying. Update Supabase Auth redirect URLs. Configure production email and reviews. Verify guest and customer checkout, concurrent overlapping bookings, package stock, admin authorization, email failure handling, mobile rendering, storage uploads, and sitemap before launch.

## Known limitations / launch checklist
- Original logo was not attached; the included SVG and illustrated hero are placeholders. Upload actual gear photos and approved brand assets. Sample prices, stock and terms must be reviewed.
- Dependency installation and full build could not be verified in the creation environment. No live Supabase, Gmail, Google or Vercel credentials were provided. Do not use this for real customers until integration and security tests pass.
- Public page content is rendered client-side; metadata/sitemap exist but richer server-rendered SEO is a follow-up. Admin page routing is a shared catch-all screen; APIs enforce roles. Admin forms are basic, not a full rich text editor. PDF printing uses the browser print dialog. Date-specific stock is enforced at checkout, not previewed per item. Buy live mode is an enquiry catalogue, not a payment shop. Popularity uses featured ordering. No bilingual mode, independent gallery manager, automatic pending expiry, email retry queue or distributed rate limiter. Add rate limiting/CAPTCHA and idempotency before public launch. Reorder bundle quantity and invoice accounting need further refinement. No independent automated test suite.

## Expedition UI update
The original application now uses a dark premium visual system, CSS 3D liquid sculpture, pointer-responsive Framer Motion perspective, responsive cards and accessible line-art placeholders. No extra dependencies or SQL changes are required. Product images remain editable in admin; placeholders are not actual product photos. Replace the hero in Settings to use your own photography. The sculpture is CSS 3D, not a WebGL model. For a user who prefers reduced motion the CSS loops are disabled. The original logo remains a temporary asset until the real logo is supplied.

## Expedition 3D update
Run `npm install` again to install Three.js and its TypeScript types. The homepage uses a procedural WebGL tent model (drag to orbit, or use the rotation buttons). The contact page uses an illustrative landscape, not a photograph of the actual business. Configure the exact Google Maps embed under Settings; the directions button uses the saved map URL. About, Privacy and Refund pages are available at `/about`, `/privacy`, `/refund`; the policy text is a draft requiring business/legal review before publication. The original booking, authentication and admin APIs are unchanged.

### Realistic tent refinement
The homepage uses a procedural curved dome with woven fabric, seams, open entrance, lantern and rocky terrain. The supplied badge is cropped from the original uploaded image, used as the default logo and on the tent. Existing settings pointing to `/logo.svg` automatically use the new badge; if you previously uploaded a custom logo, select the new `public/logo.png` via Admin Settings. No database migration or new dependencies are required. This is a real-time stylized model, not a scanned photorealistic model.

## External PBR tent
See `public/models/README.md`. This release replaces procedural geometry with a GLB viewer. The third-party GLB itself is not included; the reference poster is the fallback.

## Cinematic photo slideshow edition
The homepage now uses three locally stored AI-generated camping concept images in `public/hero/` with automatic transitions, manual controls and reduced-motion support. The Settings hero image, if configured, is included as the first slide. No 3D model or Three.js dependency is required. These are promotional concept visuals, not photographs of the actual rental inventory or premises. Replace images with your own licensed photos if desired. Existing database and environment setup are unchanged.
