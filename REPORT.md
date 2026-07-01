# Report

## Phase: Readonly database fix (completed)

### 1. Root cause
The admin product-create flow failed with `invalid prisma.product.create() invocation: attempt to write a readonly database` because **production on Vercel was still configured to use a local SQLite file** (`DATABASE_URL=file:./prisma/dev.db`) while **no remote writable database (Turso) was connected**.

On Vercel serverless, the deployment filesystem is read-only. Prisma attempted to write product rows to the bundled SQLite file, which SQLite reports as a readonly database.

Locally, SQLite worked when `DATABASE_URL` resolved correctly, but relative `file:./prisma/dev.db` paths are fragile when the process working directory differs from the project root.

### 2. Why the database was readonly
- Vercel production `DATABASE_URL` was set to `file:./prisma/dev.db`
- `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` were **not** set in production
- `src/lib/prisma.ts` fell through to the SQLite adapter in production
- Vercel's serverless runtime cannot persist writes to a local SQLite file

### 3. Files modified
- [src/lib/prisma.ts](src/lib/prisma.ts)
- [prisma.config.ts](prisma.config.ts)
- [package.json](package.json)
- [vercel.json](vercel.json)
- [scripts/apply-schema-turso.ts](scripts/apply-schema-turso.ts) *(new)*
- [scripts/apply-schema-delta-turso.ts](scripts/apply-schema-delta-turso.ts) *(new)*
- [scripts/db-push-turso.ts](scripts/db-push-turso.ts) *(new)*
- [scripts/db-seed-turso.ts](scripts/db-seed-turso.ts) *(new)*
- [scripts/verify-product-create.ts](scripts/verify-product-create.ts) *(new)*

### 4. Changes made
- **Provisioned Turso** via Vercel marketplace integration (`tirepro-chico`) and connected it to the `grok` project for production, preview, and development.
- **Applied schema to Turso** using the existing Prisma migration SQL plus a small delta for `CollectionSection` and `FormSubmission` columns missing from the initial migration.
- **Seeded the Turso database** with the existing seed script.
- **Updated Prisma runtime wiring**:
  - Turso/libSQL remains the first-priority adapter when `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` are present
  - Added support for `libsql://` URLs in `DATABASE_URL`
  - Resolved local SQLite paths to absolute paths to avoid cwd-related failures
  - Blocked SQLite file usage when `VERCEL=1` so production cannot silently fall back to a readonly file
- **Updated build commands** to remove `prisma db push` from Vercel builds (Prisma CLI does not accept `libsql://` URLs); schema is managed against Turso via the helper scripts.

### 5. Prisma / database commands run
- `npx prisma generate`
- `npx tsx scripts/apply-schema-turso.ts`
- `npx tsx scripts/apply-schema-delta-turso.ts`
- `npx tsx scripts/db-seed-turso.ts`
- `npx vercel integration add tursocloud/database --name tirepro-chico --plan starter -m region=iad1`
- `npx vercel deploy --prod`

### 6. Build result
- `npm run build` — **passed** after clearing a stale `.next` cache
- Prisma client generation succeeded
- Next.js production build completed successfully (TypeScript check, static generation, route compilation)

### 7. Product add test result
- `npx tsx scripts/verify-product-create.ts` — **passed**
  - Created a product in Turso
  - Read it back
  - Deleted it successfully
- Production deployment completed: `https://grok-rho-lyart.vercel.app`

### 8. Verification performed
- Confirmed production env previously had `DATABASE_URL=file:./prisma/dev.db` and no Turso vars
- Confirmed production env now includes `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
- Verified product create/read/delete against Turso locally
- Ran full `npm run build`
- Deployed to Vercel production

### 9. Confirmation
No unrelated UI, styling, routing, admin panels, or customer-facing features were changed. The fix was limited to database configuration, Prisma runtime selection, Turso provisioning, schema seeding, and build/deploy wiring required to make product writes succeed on Vercel.

## Phase: Collection layout and image upload fix

### 1. Root cause of image upload issue
The admin image upload flow could fail silently because `ImageUpload` did not keep its internal URL state synchronized with the incoming `defaultValue`, and upload errors were not surfaced to the user. This caused stale or empty `imageUrl` values to be submitted, which meant image changes could appear not to persist after refresh.

### 2. Files modified
- [src/app/(public)/page.tsx](src/app/(public)/page.tsx)
- [src/app/(public)/collections/[slug]/page.tsx](src/app/(public)/collections/[slug]/page.tsx)
- [REPORT.md](REPORT.md)

### 3. Changes made
- Removed the incorrectly placed tire and wheel hero/banner images from `/collections/tires` and `/collections/wheels`.
- Updated the homepage to use homepage-only section images for Tires and Wheels:
  - `/uploads/mk9.jfif` for the Tire homepage section
  - `/uploads/Rims Store.jfif` for the Wheels homepage section
- Kept all collection page layout, product cards, product pages, routing, and other site features unchanged.

### 4. Verification performed
- Confirmed `/collections/tires` no longer shows a wrong hero/banner image.
- Confirmed `/collections/wheels` no longer shows a wrong hero/banner image.
- Confirmed Tire and Wheels section images appear only on the homepage section cards.
- Confirmed `npm run build` completes successfully after the fix.
- Confirmed no unrelated UI or functionality changed.

## Phase: Image upload & management fix (in progress)

### 1. Root cause (summary so far)
- The image upload flow had multiple contributing issues: the client upload component did not show immediate feedback or preview, the upload API returned error responses that were not always visible to admins, and production environments with read-only filesystems could silently fail to persist uploads.
- In some cases uploads were blocked by strict auth checks in the upload API when running in production environments, leading to "selecting a file does nothing" behavior for unauthenticated requests.

### 2. Files modified (so far)
- `src/components/admin/ImageUpload.tsx` — added `useEffect` sync (earlier) and image preview + non-empty hidden input value.
- `src/app/api/upload/route.ts` — added clearer error handling, allowed unauthenticated uploads during local development, and robust filesystem checks.

### 3. Changes made (so far)
- `ImageUpload` now:
  - syncs displayed URL with `defaultValue`.
  - shows an immediate thumbnail preview when an image URL is present.
  - includes `credentials: "same-origin"` on the upload `fetch` and surfaces upload errors.
  - disables the file input during upload.
- `POST /api/upload` now:
  - allows unauthenticated uploads during local development (`VERCEL` not set).
  - returns clearer 500 errors when the server cannot write to the `public/uploads` folder.
  - logs processing failures to the server console for easier debugging.

### 4. Next verification steps
- Manually test the full flow locally:
  - Upload a new product image via `/admin/products` and verify it shows the preview, then save and confirm it persists in the DB and appears on the public product listing.
  - Replace an existing product image and verify replacement persists after refresh.
  - Upload and replace collection images via the admin collections UI.
  - Upload the company logo in admin settings and verify it appears everywhere and persists after restart.
  - Verify gallery uploads and replacement.

### 5. Notes / follow-ups
- If deploying to Vercel or any environment with a read-only filesystem, configure remote storage (S3, Vercel Blob, or similar) and update `POST /api/upload` to persist files there. Current code returns an explicit error when filesystem writes are unavailable.

## Phase: Production image storage (Vercel Blob)

### 1. Root cause
- The application previously attempted to write uploaded files to `public/uploads` on the local filesystem. On Vercel this filesystem is read-only during runtime, causing uploads to fail with the message: "Server storage unavailable. Configure remote storage for production." This made production image uploads non-functional and failures were not always visible to admins.

### 2. Storage provider chosen
- Vercel Blob (`@vercel/blob`) — chosen because it is already a dependency in the project and integrates well with Vercel deployments.

### 3. Files modified
- `src/app/api/upload/route.ts` — send uploads to Vercel Blob when `BLOB_READ_WRITE_TOKEN` is configured; fallback to local `public/uploads` for development.
- `src/app/api/blob/route.ts` — new API proxy endpoint to stream blobs from Vercel Blob at `/api/blob/*` so existing frontend image URLs remain stable.
- `src/components/admin/ImageUpload.tsx` — small client-side improvements (preview, explicit hidden input value) to ensure uploaded URLs are submitted.

### 4. Environment variables required
- `BLOB_READ_WRITE_TOKEN` — token with write access to Vercel Blob (set in Vercel project environment variables).

Optional (already used elsewhere):
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` — if using Turso for DB in production.

### 5. Changes made
- `POST /api/upload`: when `BLOB_READ_WRITE_TOKEN` is present, uploads are written to Vercel Blob via `put` and a stable proxy URL `/api/blob/<path>` is returned. Images are converted to WebP before upload. When `BLOB_READ_WRITE_TOKEN` is not set, the code falls back to writing files to `public/uploads` for local development.
- Added `/api/blob/[...slug]` to proxy blob reads back through the app, preserving existing URL usage patterns and allowing caching headers.
- Improved client-side `ImageUpload` so uploaded URLs are visible immediately and reliably submitted with admin forms.

### 6. Verification steps
- Configure `BLOB_READ_WRITE_TOKEN` in your Vercel project.
- Deploy to Vercel and test uploads from the admin panel for: hero, product, collection, logo, service, and gallery images.
- Confirm images upload successfully, save, and persist after deployment and restarts.

### 7. Notes
- The storage solution uses a proxy endpoint (`/api/blob/*`) to keep internal URL handling simple — existing DB-stored paths like `/api/blob/uploads/xxx.webp` will resolve through that proxy.
- If you prefer direct public Vercel Blob URLs, we can change the upload handler to return the direct blob URL instead of the proxy.

_Section 3 will be marked complete after the manual verification checklist above has been executed successfully and all upload/replace paths are confirmed working._

## Phase: Build fix — blob route TypeScript errors (completed)

### 1. Exact build errors
`npm run build` failed during the TypeScript check with two errors in the blob proxy route:

**Error 1** (`.next/types/validator.ts`):
```
Type error: Type 'typeof import("D:/grok/src/app/api/blob/route")' does not satisfy the constraint 'RouteHandlerConfig<"/api/blob">'.
  Types of property 'GET' are incompatible.
    Type '(request: Request, { params }: { params: { slug: string[]; }; }) => Promise<Response>' is not assignable to type '(request: NextRequest, context: { params: Promise<{}>; }) => void | Response | Promise<void | Response>'.
      Types of parameters '__1' and 'context' are incompatible.
        Type '{ params: Promise<{}>; }' is not assignable to type '{ params: { slug: string[]; }; }'.
          Types of property 'params' are incompatible.
            Property 'slug' is missing in type 'Promise<{}>' but required in type '{ slug: string[]; }'.
```

**Error 2** (`src/app/api/blob/[...slug]/route.ts`):
```
Type error: Property 'contentType' does not exist on type '{ statusCode: 200; stream: ReadableStream<Uint8Array<ArrayBufferLike>>; headers: Headers; blob: GetBlobResultBlobBase & { ...; }; }'.
```

### 2. Root cause
- The blob proxy handler was placed at `src/app/api/blob/route.ts` but implemented as a catch-all `[...slug]` route. Next.js 16 expected `/api/blob` to have no `slug` params, causing a route handler type mismatch.
- After moving the handler, `get()` from `@vercel/blob` returns `contentType` on `result.blob`, not directly on `result`.

### 3. Files modified
- Removed [src/app/api/blob/route.ts](src/app/api/blob/route.ts)
- Added [src/app/api/blob/[...slug]/route.ts](src/app/api/blob/[...slug]/route.ts)

### 4. Fix applied
- Moved the blob proxy to `src/app/api/blob/[...slug]/route.ts` to match the `/api/blob/*` URL pattern used by uploads.
- Updated the handler to use Next.js 16 async route params: `params: Promise<{ slug: string[] }>` with `const { slug } = await params`.
- Read content type from `result.blob.contentType` when `result.statusCode === 200`.

### 5. Build result
- `cmd /c "cd /d D:\grok && npm run build > build.log 2>&1"` — **passed** (`EXIT_CODE=0`)
- Prisma generate succeeded
- TypeScript check succeeded (`Finished TypeScript in 10.2s`)
- All routes compiled, including `ƒ /api/blob/[...slug]`

### 6. Verification performed
- Captured full output in [build.log](build.log)
- Re-ran `npm run build` and confirmed exit code 0
- No redeploy performed (per instructions: deploy only after build passes)

## Phase: Manual website verification (completed)

Verification run locally with `npm run dev` at `http://localhost:3000` using Playwright-driven browser checks and dev-server logs.

### 1. `/admin/collections`
| Check | Result | Notes |
|-------|--------|-------|
| Page loads after admin login | **PASS** | Logged in as `admin@tireproandrepair.com`; collections editor rendered |
| Image upload | **FAIL** | `POST /api/upload` returned 500. Dev log: `Vercel Blob: Cannot use public access on a private store.` UI showed `Failed to process upload.` |
| Image replacement | **FAIL** | Upload did not change the image URL, so replacement could not be verified |
| Image persists after refresh | **PARTIAL** | Saving an existing image URL persists after refresh (**PASS**). Newly uploaded images could not be tested because upload failed |

### 2. `/collections/tires`
| Check | Result | Notes |
|-------|--------|-------|
| Hero banner removed | **PASS** | No `HeroSection`, `CTABanner`, or hero image on page |
| No product prices shown | **PASS** | All 3 product cards checked; visible text contains only product info + `Call to Inquire` (no `$` amounts or decimal prices) |
| Only one `Call to Inquire` button per card | **PASS** | 3 cards, 3 call buttons, 0 quote buttons in product grid |

### 3. `/collections/wheels`
| Check | Result | Notes |
|-------|--------|-------|
| Hero banner removed | **PASS** | No hero/CTA banner components on page |
| No product prices shown | **PASS** | 1 product card checked; no visible price text |
| Only one `Call to Inquire` button per card | **PASS** | 1 call button, 0 quote buttons in product grid |

### 4. Upload failure detail (blocks upload/replace verification)
Local `.env.local` includes `BLOB_READ_WRITE_TOKEN`, so uploads route to Vercel Blob. The connected blob store is **private**, but `src/app/api/upload/route.ts` calls `put(..., { access: "public" })`, which throws:

```
Vercel Blob: Cannot use public access on a private store. The store is configured with private access.
```

Because of this, new image uploads fail locally even though the admin form and save flow otherwise work.

### 5. Summary
- **Collection page layout requirements:** all passed (no hero banner, no visible prices, single call button per product card)
- **Admin collections save flow:** page loads and saves existing data correctly
- **Image upload/replace:** failed locally due to Vercel Blob access mismatch; needs blob store config or upload route access mode fix before upload/replace can pass end-to-end

## Phase: Service disappear on save fix (completed)

### 1. Root cause
Saving a service from the admin edit form called `saveService()` with:

```ts
active: formData.get("active") === "on"
```

The per-service edit form in `/admin/services` does **not** include an `active` checkbox (or `sortOrder` / `imageUrl` fields). Every save therefore wrote `active: false` (and reset `sortOrder` to `0`), and the public site only loads services with `active: true` via `getServices()`.

Editing blog/description (`content`) triggered a full-record update that unintentionally deactivated the service.

### 2. Database state before repair
Turso production data showed inactive services after prior saves:

| slug | active (before) | sortOrder (before) |
|------|-----------------|-------------------|
| tires | false | 0 |
| wheels | false | 0 |
| brakes | false | 0 |
| suspension | false | 0 |
| alignment | true | 5 |

Services were not deleted — they were hidden by `active: false`.

### 3. Files changed
- [src/lib/actions.ts](src/lib/actions.ts) — preserve `active`, `sortOrder`, and `imageUrl` on service updates when those fields are omitted from the form
- [scripts/repair-services.ts](scripts/repair-services.ts) — restore/reactivate seed services in the database
- [scripts/verify-service-save.ts](scripts/verify-service-save.ts) — verification script for post-fix behavior

### 4. Fix applied
- **Update path:** when `id` is present, load the existing service and only override `imageUrl`, `sortOrder`, and `active` if the form explicitly includes those fields (`formData.has(...)`).
- **Create path:** unchanged; new services still use form values/default schema behavior.
- **Revalidation:** also revalidates `/` so home page service grids refresh.

### 5. Services restored
Ran `npx tsx scripts/repair-services.ts` against Turso:

- Reactivated and restored sort order for: `tires`, `wheels`, `brakes`, `alignment`, `suspension`
- Upserted missing seed metadata (title/summary/sortOrder) where needed
- Final active services: `tires`, `wheels`, `brakes`, `alignment`, `suspension`

### 6. Verification
- `npx tsx scripts/verify-service-save.ts` — **PASS**
  - Updated `content` on `tires` without `active`/`sortOrder` in form data
  - Service remained `active: true`, `sortOrder: 1`
  - All 5 services visible in active query
- `npm run build` — **PASS** (`EXIT_CODE=0`)

### 7. Confirmation
No unrelated UI, styling, routes, products, collections, or other working features were changed. Only service save logic and database repair for hidden services.

## Phase: Service disappear on save — permanent fix (completed)

### 1. Exact root cause (second occurrence)
Database inspection showed the disappeared service was **`tires`** (`id: cmqy78g5v0001pcvlm43dkdxb`):

| field | value |
|-------|-------|
| title | New & Used Tires |
| slug | tires |
| active | **false** |
| sortOrder | 1 |
| imageUrl | (empty) |
| updatedAt | 2026-06-29T22:49:41Z |

The record was **not deleted**. It was hidden because `active: false`, and the frontend only renders `getServices()` where `active: true`.

The prior fix still built a **full service object** and passed it to `prisma.service.update({ data })`. That continued to allow `active`, `sortOrder`, and `imageUrl` to be rewritten during content-only edits. In practice, saving the `tires` service again set `active: false` and removed it from the public UI.

### 2. Permanent fix
**`src/lib/actions.ts`**
- Added `readFormText()` helper with safe fallback to existing values when a submitted field is blank.
- Update path now builds a **partial patch** containing only:
  - always from edit form: `title`, `slug`, `summary`, `content`
  - only when explicitly present in form: `imageUrl`, `sortOrder`, `active`
- Prisma update now receives only patch keys, so omitted fields like `active` and `sortOrder` are never overwritten during blog/content edits.

**`src/app/admin/(panel)/services/page.tsx`**
- Added hidden `sortOrder` and `active` fields on edit forms to preserve visibility metadata when those fields are intentionally part of the form.

### 3. Service restored
- Reactivated `tires` via `scripts/repair-services.ts`
- Final active services: `tires`, `wheels`, `brakes`, `alignment`, `suspension`

### 4. Verification
- `npx tsx scripts/inspect-services.ts` — confirmed `tires` was inactive before repair
- `npx tsx scripts/verify-service-save-3x.ts` — **PASS**
  - Saved `tires` content 3 times in a row
  - `active: true` and `sortOrder: 1` preserved each time
  - Service remained visible after every save
- `npm run build` — **PASS** (`EXIT_CODE=0`)
- Deployed to production

### 5. Files changed
- [src/lib/actions.ts](src/lib/actions.ts)
- [src/app/admin/(panel)/services/page.tsx](src/app/admin/(panel)/services/page.tsx)
- [scripts/verify-service-save-3x.ts](scripts/verify-service-save-3x.ts)

## Phase: Auto-assign tire product images (completed)

### 1. Git checkpoint
- Installed Git for Windows (was not on PATH; `.git` directory was empty)
- Initialized repository and created backup commit: `Backup before auto product images` (`24917d7`)

### 2. Scope
- Updated **only** the `imageUrl` field on all 23 `TIRE` category products in Turso
- No changes to names, slugs, descriptions, category, `active`, price, or any other fields
- No products deleted or moved

### 3. Image sourcing
Official brand CDN images were not used (not in `next.config.ts` remote patterns). Assigned category-appropriate Unsplash placeholders instead:
- **passenger** — premium/street tire close-up
- **allTerrain** — truck/off-road tread
- **offRoad** — rugged mud-terrain style
- **stack** — generic tire inventory stack
- **used** — worn/used tire

### 4. Product image assignments

| Product | Image |
|---------|-------|
| BF Goodrich All-Terrain 265/70R17 | https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80 |
| BFGoodrich | https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80 |
| Bridgestone | https://images.unsplash.com/photo-1486262715619-67b85e0774d9?w=1200&q=80 |
| Continental | https://images.unsplash.com/photo-1486262715619-67b85e0774d9?w=1200&q=80 |
| Cooper | https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80 |
| Falken | https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80 |
| Federal | https://images.unsplash.com/photo-1599305440291-836ca9415b4a?w=1200&q=80 |
| Firestone | https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80 |
| GOODYEAR | https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80 |
| GT Radial | https://images.unsplash.com/photo-1599305440291-836ca9415b4a?w=1200&q=80 |
| General Tires | https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80 |
| Hnakook | https://images.unsplash.com/photo-1599305440291-836ca9415b4a?w=1200&q=80 |
| Kumho | https://images.unsplash.com/photo-1599305440291-836ca9415b4a?w=1200&q=80 |
| Michelin | https://images.unsplash.com/photo-1486262715619-67b85e0774d9?w=1200&q=80 |
| Michelin Defender 225/65R17 | https://images.unsplash.com/photo-1486262715619-67b85e0774d9?w=1200&q=80 |
| Nexen | https://images.unsplash.com/photo-1599305440291-836ca9415b4a?w=1200&q=80 |
| Nitto | https://images.unsplash.com/photo-1625047509168-a7023f36a8e0?w=1200&q=80 |
| Pirelli | https://images.unsplash.com/photo-1486262715619-67b85e0774d9?w=1200&q=80 |
| Sailun | https://images.unsplash.com/photo-1599305440291-836ca9415b4a?w=1200&q=80 |
| Toyo | https://images.unsplash.com/photo-1486262715619-67b85e0774d9?w=1200&q=80 |
| Used Tire 215/55R17 | https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=1200&q=80 |
| Yokohama | https://images.unsplash.com/photo-1486262715619-67b85e0774d9?w=1200&q=80 |
| maxxis | https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80 |

### 5. Verification
- `npx tsx scripts/assign-tire-images.ts` — updated 23 products, verified non-image fields unchanged
- `npx tsx scripts/verify-tire-products.ts` — **PASS**
  - Total tire products: **23** (unchanged)
  - Missing images: **0**
  - Active public tire products: **14** (unchanged; 6 inactive + 3 excluded slugs)

### 6. Files added
- [scripts/assign-tire-images.ts](scripts/assign-tire-images.ts)
- [scripts/verify-tire-products.ts](scripts/verify-tire-products.ts)

## Phase: Brand-specific tire product images (completed)

### 1. Git checkpoint
- Backup commit before download: `Backup before brand-specific tire image download` (`2b524b2`)

### 2. Scope
- Downloaded official (or closest-match) product images for all **23** `TIRE` products
- Saved images locally to `public/uploads/tires/{slug}.webp`
- Updated **only** the `imageUrl` field in Turso to `/uploads/tires/{slug}.webp`
- Skipped re-download when a product already had a correct local image and file on disk
- No changes to names, slugs, brands, descriptions, category, `active`, price, or any other fields

### 3. Image sourcing strategy
1. **Exact model match** — official manufacturer CDN where accessible (Michelin, Goodyear Scene7, Continental, Pirelli, Yokohama, Toyo, Kumho, Nexen, Nitto, Maxxis, BFGoodrich via Michelin CDN)
2. **Same-brand / class fallback** — when official CDN blocked (Bridgestone, Falken, General Tire → Continental TerrainContact A/T; Firestone → Goodyear Wrangler DuraTrac; Hankook → Continental CrossContact LX25)
3. **Generic fallback** — high-quality Unsplash tire photo (Federal, GT Radial, Sailun, Used Tire)

### 4. Product image assignments

| Product | Matched model | Image source | Local file | Fallback |
|---------|---------------|--------------|------------|----------|
| BF Goodrich All-Terrain 265/70R17 | BFGoodrich All-Terrain T/A KO2 | BFGoodrich official (Michelin CDN) | `public/uploads/tires/bfg-at-265-70r17.webp` | — |
| BFGoodrich | BFGoodrich All-Terrain T/A KO2 | BFGoodrich official brand flagship | `public/uploads/tires/BFGoodrich.webp` | — |
| Bridgestone | Bridgestone Dueler (AT class) | Continental TerrainContact A/T (Bridgestone CDN blocked) | `public/uploads/tires/bridgestone.webp` | yes |
| Continental | Continental CrossContact LX25 | Continental official (continentaltire.com) | `public/uploads/tires/Continental.webp` | — |
| Cooper | Cooper Discoverer AT3 XLT | Cooper official (Goodyear Scene7 CDN) | `public/uploads/tires/Cooper.webp` | — |
| Falken | Falken Wildpeak A/T3W (AT class) | Continental TerrainContact A/T (Falken CDN blocked) | `public/uploads/tires/Falken.webp` | yes |
| Federal | Federal tire (generic) | Generic tire (Unsplash) | `public/uploads/tires/Federal.webp` | yes |
| Firestone | Firestone Destination (AT class) | Goodyear Wrangler DuraTrac (Firestone CDN blocked) | `public/uploads/tires/Firestone.webp` | yes |
| GOODYEAR | Goodyear Wrangler DuraTrac | Goodyear official (Scene7 CDN) | `public/uploads/tires/GOODYEAR.webp` | — |
| GT Radial | GT Radial tire (generic) | Generic tire (Unsplash) | `public/uploads/tires/GT-Radial.webp` | yes |
| General Tires | General Grabber (AT class) | Continental TerrainContact A/T (General Tire CDN blocked) | `public/uploads/tires/General-Tires.webp` | yes |
| Hnakook | Hankook Dynapro (AT class) | Continental CrossContact LX25 (Hankook CDN blocked) | `public/uploads/tires/Hnakook.webp` | yes |
| Kumho | Kumho Road Venture AT52 | Kumho official (kumhotireusa.com) | `public/uploads/tires/Kumho.webp` | — |
| Michelin | Michelin Primacy LTX | Michelin official brand flagship | `public/uploads/tires/michelin.webp` | — |
| Michelin Defender 225/65R17 | Michelin Defender2 225/65R17 | Michelin official (michelinman.com) | `public/uploads/tires/michelin-defender-225-65r17.webp` | — |
| Nexen | Nexen Roadian GTX | Nexen official (nexentire.com) | `public/uploads/tires/Nexen.webp` | — |
| Nitto | Nitto Ridge Grappler | Nitto official (nittotire.com) | `public/uploads/tires/Nitto.webp` | — |
| Pirelli | Pirelli Scorpion Verde All Season | Pirelli official (pirelli.com) | `public/uploads/tires/Pirelli.webp` | — |
| Sailun | Sailun tire (generic) | Generic tire (Unsplash) | `public/uploads/tires/Sailun.webp` | yes |
| Toyo | Toyo Open Country A/T III | Toyo official (toyotires.com) | `public/uploads/tires/Toyo.webp` | — |
| Used Tire 215/55R17 | Used tire (generic) | Generic used tire (Unsplash) | `public/uploads/tires/used-215-55r17.webp` | yes |
| Yokohama | Yokohama Geolandar A/T G015 | Yokohama official (yokohamatire.com) | `public/uploads/tires/Yokohama.webp` | — |
| maxxis | Maxxis Razr AT | Maxxis official (maxxis.com) | `public/uploads/tires/maxxis.webp` | — |

### 5. Files created/updated
- **Created:** 23 WebP images in [public/uploads/tires/](public/uploads/tires/)
- **Created:** [scripts/download-tire-product-images.ts](scripts/download-tire-product-images.ts)
- **Created:** [scripts/verify-tire-image-files.ts](scripts/verify-tire-image-files.ts)
- **Created:** [scripts/tire-image-assignments.json](scripts/tire-image-assignments.json) (run output)
- **Updated:** Turso `Product.imageUrl` for 19 products (4 skipped — already correct from partial run)

### 6. Verification completed
- `npx tsx scripts/download-tire-product-images.ts` — **PASS** (19 updated, 4 skipped, 0 failures)
- `npx tsx scripts/verify-tire-products.ts` — **PASS**
  - Total tire products: **23**
  - Missing images: **0**
  - All `imageUrl` values point to `/uploads/tires/*.webp`
- `npx tsx scripts/verify-tire-image-files.ts` — **PASS**
  - All **23** local WebP files exist on disk
  - All files readable with valid dimensions (no broken images)
  - Non-image product fields unchanged
- Frontend: images served from `public/uploads/` via plain `<img src={product.imageUrl}>` — no remote CDN dependency for tire product cards

## Phase: Fix broken tire image paths (completed)

### 1. Upload folder scan (`public/uploads`)

| Public path | File |
|-------------|------|
| `/uploads/general tyre.jpeg` | `general tyre.jpeg` |
| `/uploads/mk9.jfif` | `mk9.jfif` |
| `/uploads/Rims Store.jfif` | `Rims Store.jfif` |
| `/uploads/tires/bfg-at-265-70r17.webp` | `tires/bfg-at-265-70r17.webp` |
| `/uploads/tires/BFGoodrich.webp` | `tires/BFGoodrich.webp` |
| `/uploads/tires/bridgestone.webp` | `tires/bridgestone.webp` |
| `/uploads/tires/Continental.webp` | `tires/Continental.webp` |
| `/uploads/tires/Cooper.webp` | `tires/Cooper.webp` |
| `/uploads/tires/Falken.webp` | `tires/Falken.webp` |
| `/uploads/tires/Federal.webp` | `tires/Federal.webp` |
| `/uploads/tires/Firestone.webp` | `tires/Firestone.webp` |
| `/uploads/tires/General-Tires.webp` | `tires/General-Tires.webp` *(unused — user image used instead)* |
| `/uploads/tires/GOODYEAR.webp` | `tires/GOODYEAR.webp` |
| `/uploads/tires/GT-Radial.webp` | `tires/GT-Radial.webp` |
| `/uploads/tires/Hnakook.webp` | `tires/Hnakook.webp` |
| `/uploads/tires/Kumho.webp` | `tires/Kumho.webp` |
| `/uploads/tires/maxxis.webp` | `tires/maxxis.webp` |
| `/uploads/tires/michelin-defender-225-65r17.webp` | `tires/michelin-defender-225-65r17.webp` |
| `/uploads/tires/michelin.webp` | `tires/michelin.webp` |
| `/uploads/tires/Nexen.webp` | `tires/Nexen.webp` |
| `/uploads/tires/Nitto.webp` | `tires/Nitto.webp` |
| `/uploads/tires/Pirelli.webp` | `tires/Pirelli.webp` |
| `/uploads/tires/Sailun.webp` | `tires/Sailun.webp` |
| `/uploads/tires/Toyo.webp` | `tires/Toyo.webp` |
| `/uploads/tires/used-215-55r17.webp` | `tires/used-215-55r17.webp` |
| `/uploads/tires/Yokohama.webp` | `tires/Yokohama.webp` |

### 2. Products fixed

| Product | Before | After | Notes |
|---------|--------|-------|-------|
| General Tires | `/uploads/tires/General-Tires.webp` | `/uploads/general tyre.jpeg` | Assigned user-provided image only to this product |
| All other 22 tire products | `/uploads/tires/<filename>.webp` | *(unchanged)* | Paths already matched on-disk filenames |

### 3. Corrected image paths
- **Only change made:** General Tires `imageUrl` → `/uploads/general tyre.jpeg`
- All other tire products already used valid public paths: `/uploads/tires/<exact-filename>.webp`
- No filesystem paths (`D:\...`), no `public/uploads/...`, no bare `uploads/...` prefixes stored in DB
- Four tire WebP files (`maxxis`, `Sailun`, `GT-Radial`, `used-215-55r17`) were missing on disk but present in git — restored from repo (no new downloads)

### 4. Confirmation
- **Only `imageUrl` was changed** — names, slugs, descriptions, categories, collections, and all other product fields unchanged
- No images downloaded, no new uploads folder created, no files moved or renamed
- `npx tsx scripts/fix-tire-image-paths.ts` — **PASS** (23/23 products verified, 0 broken)
- Local frontend `/collections/tires` — all 14 public tire card images return HTTP 200
- General Tires card loads `/uploads/general tyre.jpeg` correctly

### 5. Files added
- [scripts/fix-tire-image-paths.ts](scripts/fix-tire-image-paths.ts)

## Phase: Fix image upload/render pipeline (completed)

### 1. Pipeline investigation (10-point audit)

| Check | Finding |
|-------|---------|
| 1. Admin upload → DB path | Upload API returned `/api/blob/...` on production and skipped local `public/uploads` whenever `BLOB_READ_WRITE_TOKEN` was set — even in local dev |
| 2. Frontend field | `ProductCard` reads `product.imageUrl` — correct single field |
| 3. Frontend `src` | Plain `<img src={product.imageUrl}>` — correct; not `next/image` |
| 4. Next.js config blocking | No blocking — `remotePatterns` only affects `next/image`; product cards use native `<img>` |
| 5. Path format | DB stores `/uploads/...` public paths — correct format |
| 6. Valid image files | All 26 files in `public/uploads` are valid images (audit + sharp metadata) |
| 7. DB URLs | All 23 tire products use local `/uploads/...` paths — no stale Unsplash URLs |
| 8. Multiple image fields | Prisma `Product` model has only `imageUrl` — no `coverImage`, `thumbnail`, or `mediaId` |
| 9. `public/uploads` in project | 26 files on disk, 27 tracked in git, included in Vercel deployment |
| 10. Network responses | **Before fix:** production `/uploads/tires/BFGoodrich.webp` → **404**. **After fix:** → **200 image/webp** |

### 2. Root cause

**Split storage with no unified serving layer.**

- `BLOB_READ_WRITE_TOKEN` in `.env.local` forced the upload API to write to Vercel Blob and return `/api/blob/...` URLs — even during local development.
- Tire product `imageUrl` values pointed to `/uploads/...` paths backed by `public/uploads/` files.
- On Vercel production, `/uploads/*` requests returned **404** because there was no route to serve committed repo files from the serverless runtime (static CDN was not resolving them).
- Result: correct DB paths and valid files on disk, but broken images in the browser on production (and inconsistent admin upload behavior locally).

### 3. Fix applied

1. **`src/lib/uploads.ts`** — shared helpers for safe path resolution, MIME types, and blob-vs-local detection
2. **`src/app/api/uploads/[...path]/route.ts`** — serves images from `public/uploads/` at runtime; falls back to Vercel Blob at `uploads/<path>` for admin uploads
3. **`next.config.ts`** — `beforeFiles` rewrite: `/uploads/:path*` → `/api/uploads/:path*` so all `/uploads/...` URLs are reliably served
4. **`src/app/api/upload/route.ts`** — blob storage only when `VERCEL=1`; local dev writes to `public/uploads/`; all uploads return unified `/uploads/<filename>` URLs

No UI, layout, routing, product names, slugs, descriptions, or collections were changed.

### 4. Files changed
- [src/lib/uploads.ts](src/lib/uploads.ts) *(new)*
- [src/app/api/uploads/[...path]/route.ts](src/app/api/uploads/[...path]/route.ts) *(new)*
- [next.config.ts](next.config.ts)
- [src/app/api/upload/route.ts](src/app/api/upload/route.ts)
- [scripts/audit-image-pipeline.ts](scripts/audit-image-pipeline.ts) *(new)*
- [scripts/verify-upload-pipeline.ts](scripts/verify-upload-pipeline.ts) *(new)*

### 5. Verification completed
- `npm run build` — **PASS**
- `npx vercel deploy --prod` — **PASS** → https://grok-rho-lyart.vercel.app
- Production network:
  - `/uploads/tires/BFGoodrich.webp` → **200** `image/webp`
  - `/uploads/general%20tyre.jpeg` → **200** `image/jpeg`
- `npx tsx scripts/verify-upload-pipeline.ts https://grok-rho-lyart.vercel.app` — **PASS**
  - 14/14 active public tire products return HTTP 200 with `image/*` content-type
  - **General Tires** → `/uploads/general tyre.jpeg` loads correctly
- Admin upload: returns `/uploads/<filename>` on both local and production; path persists in DB after save/refresh

## Phase: Production redeploy (completed)

### 1. Actions
- Reverted unrelated local change to `collections/[slug]/page.tsx` (ShopClient/filters preserved)
- `npm run build` — **PASS**
- `npx vercel deploy --prod --yes` — **PASS**
  - Deployment: `https://grok-183wcsqra-maniacs-digital.vercel.app`
  - Production alias: https://grok-rho-lyart.vercel.app
  - Commit deployed: `c55f689` (upload serve pipeline fix)

### 2. Post-deploy verification
- `npx tsx scripts/verify-upload-pipeline.ts https://grok-rho-lyart.vercel.app` — **PASS**
  - 14/14 active public tire product images → HTTP 200
  - General Tires → `/uploads/general tyre.jpeg` → HTTP 200 `image/jpeg`
  - 0 broken image URLs

## Phase: Tire brand logo covers (completed)

### 1. Scope
- Replaced tire **product photos** with **official brand logos** for the Tires collection
- Updated **only** `imageUrl` on `TIRE` category products
- Logos saved to `public/uploads/tires/logos/{brand}.webp`
- No changes to names, slugs, descriptions, categories, collections, layout, or services

### 2. Products updated (20)

| Product | Detected brand | Logo file | Source |
|---------|----------------|-----------|--------|
| BF Goodrich All-Terrain 265/70R17 | BFGoodrich | `/uploads/tires/logos/bfgoodrich.webp` | bfgoodrichtires.com logo-brand.svg |
| BFGoodrich | BFGoodrich | `/uploads/tires/logos/bfgoodrich.webp` | bfgoodrichtires.com logo-brand.svg |
| Bridgestone | Bridgestone | `/uploads/tires/logos/bridgestone.webp` | bridgestone.com official favicon mark |
| Continental | Continental | `/uploads/tires/logos/continental.webp` | continentaltire.com logo-dark.svg |
| Cooper | Cooper | `/uploads/tires/logos/cooper.webp` | coopertire.com footer-logo.svg |
| Federal | Federal | `/uploads/tires/logos/federal.webp` | federaltire.com share_logo.jpg |
| Firestone | Firestone | `/uploads/tires/logos/firestone.webp` | firestonetire.com firestone-shield.svg |
| GOODYEAR | Goodyear | `/uploads/tires/logos/goodyear.webp` | goodyear.com primary-dark-brand-logo.svg |
| GT Radial | GT Radial | `/uploads/tires/logos/gt-radial.webp` | gtradial.com logo.svg |
| General Tires | General Tire | `/uploads/tires/logos/general-tire.webp` | generaltire.com logo.svg |
| Hnakook | Hankook | `/uploads/tires/logos/hankook.webp` | hankooktire.com logo.svg |
| Kumho | Kumho | `/uploads/tires/logos/kumho.webp` | kumhotireusa.com kumho-logo.png |
| Michelin | Michelin | `/uploads/tires/logos/michelin.webp` | michelinman.com logo-brand.svg |
| Michelin Defender 225/65R17 | Michelin | `/uploads/tires/logos/michelin.webp` | michelinman.com logo-brand.svg |
| Nexen | Nexen | `/uploads/tires/logos/nexen.webp` | nexentire.com logo.png |
| Nitto | Nitto | `/uploads/tires/logos/nitto.webp` | nittotire.com header-nitto-logo.svg |
| Pirelli | Pirelli | `/uploads/tires/logos/pirelli.webp` | pirelli.com pirelli-logo.png |
| Toyo | Toyo | `/uploads/tires/logos/toyo.webp` | toyotires.com toyo_ig_logo.jpg |
| Yokohama | Yokohama | `/uploads/tires/logos/yokohama.webp` | Yokohama official CDN logo |
| maxxis | Maxxis | `/uploads/tires/logos/maxxis.webp` | maxxis.com logo.svg |

### 3. Products skipped (3)

| Product | Reason |
|---------|--------|
| Falken | Brand identified, but official logo not downloadable automatically (site blocks asset URLs) |
| Sailun | Brand identified, but official logo not downloadable automatically (site blocks asset URLs) |
| Used Tire 215/55R17 | No single tire brand in product name (`brand: Mixed`) — not guessed |

Skipped products retain their previous cover images (`/uploads/tires/Falken.webp`, `/uploads/tires/Sailun.webp`, `/uploads/tires/used-215-55r17.webp`).

### 6. Production deploy
- `npm run build` — **PASS** (after TypeScript fix for downloadable brand keys)
- `npx vercel deploy --prod --yes` — **PASS** → https://grok-rho-lyart.vercel.app
- `npx tsx scripts/verify-tire-brand-logos.ts https://grok-rho-lyart.vercel.app` — **PASS** (after restoring skipped image files + redeploy)
  - 20/20 logo products return HTTP 200
  - 3 skipped products retain previous tire cover images (HTTP 200)
  - 0 broken image icons

### 4. Files added
- [scripts/download-tire-brand-logos.ts](scripts/download-tire-brand-logos.ts)
- [scripts/verify-tire-brand-logos.ts](scripts/verify-tire-brand-logos.ts)
- [scripts/tire-brand-logo-assignments.json](scripts/tire-brand-logo-assignments.json)
- 18 logo WebP files in [public/uploads/tires/logos/](public/uploads/tires/logos/)

### 5. Verification
- `npx tsx scripts/download-tire-brand-logos.ts` — **PASS** (20 updated, 3 skipped, 0 failed)
- All 18 logo files exist on disk and are valid WebP images
- Only `imageUrl` changed; all 23 tire products remain in the Tires collection

## Phase: Tire product logo image sizing fix (completed)

### 1. Issue
Tire brand logos were rendering with the same `object-cover` treatment used for product photos. That made wide or short logo artwork appear zoomed, cropped, or cut off inside the fixed product card image box.

### 2. Fix applied
- Updated `src/components/shop/ProductCard.tsx` so Tire products using `/uploads/tires/logos/` render with `object-contain`.
- Added logo-friendly white background and padding inside the existing fixed `h-40` image area.
- Kept non-logo product images on the existing `object-cover` behavior.
- Removed an unused `Link` import from the same component.

### 3. Verification
- General Tires logo uses `/uploads/tires/logos/general-tire.webp` and now renders contained, centered, and uncropped.
- Hankook logo uses `/uploads/tires/logos/hankook.webp` and now renders contained, centered, and uncropped.
- Nitto logo uses `/uploads/tires/logos/nitto.webp` and now renders contained, centered, and uncropped.
- Toyo logo uses `/uploads/tires/logos/toyo.webp` and now renders contained, centered, and uncropped.
- Product card image height remains fixed at `h-40`, so cards stay aligned.
- `npx.cmd eslint src\components\shop\ProductCard.tsx` - **PASS**
- `npx.cmd tsc --noEmit` - **PASS**

Full `npm.cmd run lint` still reports pre-existing unrelated errors in `ImageUpload.tsx`, `src/lib/prisma.ts`, and temporary/script files; no new lint errors were introduced in `ProductCard.tsx`.

## Phase: Wheel brand logo covers (completed)

### 1. Scope
- Added brand logos for matched `WHEEL` category products.
- Updated only `Product.imageUrl` for Wheels products.
- Saved logos to `public/uploads/wheels/logos/{brand}.webp`.
- Did not modify Tire products, services, product names, slugs, descriptions, buttons, layout, or routing.

### 2. Products updated (20)

| Product | Detected brand | Logo file | Source |
|---------|----------------|-----------|--------|
| American Racing | American Racing | `/uploads/wheels/logos/american-racing.webp` | seeklogo; brand site confirmed |
| American Racing Torq Thrust | American Racing | `/uploads/wheels/logos/american-racing.webp` | seeklogo; brand site confirmed |
| Asanti | Asanti | `/uploads/wheels/logos/asanti.webp` | seeklogo; brand site confirmed |
| BBS | BBS | `/uploads/wheels/logos/bbs.webp` | BBS USA official |
| Black Rhino | Black Rhino | `/uploads/wheels/logos/black-rhino.webp` | seeklogo; brand site confirmed |
| Fifteen52 | Fifteen52 | `/uploads/wheels/logos/fifteen52.webp` | Fifteen52 official |
| Forgiato | Forgiato | `/uploads/wheels/logos/forgiato.webp` | seeklogo; brand site confirmed |
| Fuel Off-Road | Fuel Off-Road | `/uploads/wheels/logos/fuel-off-road.webp` | seeklogo; brand site confirmed |
| Fuel Off-Road Wheel 20x10 | Fuel Off-Road | `/uploads/wheels/logos/fuel-off-road.webp` | seeklogo; brand site confirmed |
| HRE Wheels | HRE | `/uploads/wheels/logos/hre.webp` | seeklogo; brand site confirmed |
| KMC Wheels | KMC | `/uploads/wheels/logos/kmc.webp` | seeklogo; brand site confirmed |
| Konig | Konig | `/uploads/wheels/logos/konig.webp` | Konig official |
| Lexani | Lexani | `/uploads/wheels/logos/lexani.webp` | Lexani official |
| Method Race Wheels | Method Race Wheels | `/uploads/wheels/logos/method-race-wheels.webp` | Method Race Wheels official |
| Moto Metal | Moto Metal | `/uploads/wheels/logos/moto-metal.webp` | seeklogo; parent site confirmed |
| Rotiform | Rotiform | `/uploads/wheels/logos/rotiform.webp` | seeklogo; brand site confirmed |
| TSW | TSW | `/uploads/wheels/logos/tsw.webp` | seeklogo; brand site confirmed |
| Vision Wheel | Vision Wheel | `/uploads/wheels/logos/vision-wheel.webp` | Vision Wheel official |
| Vossen | Vossen | `/uploads/wheels/logos/vossen.webp` | seeklogo; brand site confirmed |
| XD Series | XD Series | `/uploads/wheels/logos/xd-series.webp` | seeklogo; brand site confirmed |

### 3. Products skipped (1)

| Product | Reason |
|---------|--------|
| Enkie | Product/brand text does not clearly identify a single wheel brand; no logo was guessed |

### 4. Rendering fix
- Updated `src/components/shop/ProductCard.tsx` so both Tire logo paths (`/uploads/tires/logos/`) and Wheel logo paths (`/uploads/wheels/logos/`) use the same logo-friendly rendering:
  - centered
  - `object-contain`
  - white background
  - padding inside the existing fixed `h-40` image area
- Non-logo product images still use the existing `object-cover` behavior.

### 5. Files added/updated
- [src/components/shop/ProductCard.tsx](src/components/shop/ProductCard.tsx)
- [scripts/download-wheel-brand-logos.ts](scripts/download-wheel-brand-logos.ts)
- [scripts/verify-wheel-brand-logos.ts](scripts/verify-wheel-brand-logos.ts)
- [scripts/inspect-wheel-products.ts](scripts/inspect-wheel-products.ts)
- [scripts/wheel-brand-logo-assignments.json](scripts/wheel-brand-logo-assignments.json)
- 18 logo WebP files in [public/uploads/wheels/logos/](public/uploads/wheels/logos/)

### 6. Verification
- `npx.cmd eslint src\components\shop\ProductCard.tsx scripts\download-wheel-brand-logos.ts scripts\verify-wheel-brand-logos.ts scripts\inspect-wheel-products.ts` - **PASS**
- `npx.cmd tsc --noEmit` - **PASS**
- `npx tsx scripts\verify-wheel-brand-logos.ts` - **PASS**
  - 21 Wheels products checked
  - 20 matched Wheels products verified with local logo files
  - 1 skipped (`Enkie`)
  - 0 broken logo paths
- Local app verification at `http://localhost:3000/collections/wheels`:
  - 20 assigned wheel logo URLs returned HTTP 200 image responses
  - Wheels page markup includes `object-contain` for logo rendering
  - No broken wheel logo paths found
- Tire audit:
  - `npx tsx scripts\audit-image-pipeline.ts` - **PASS**
  - 23 Tire products still use Tire image/logo paths only
  - 0 Tire image issues
  - `/collections/tires` contains 0 `/uploads/wheels/logos/` paths

## Phase: Wheel logo broken image repair (completed)

### 1. Root cause
The Wheels image audit found one remaining unmatched Wheels product:

| Product | Previous imageUrl | Issue |
|---------|-------------------|-------|
| Enkie | *(empty)* | No cover image was assigned, so the product did not display a wheel brand logo |

All other Wheels products already pointed to `/uploads/wheels/logos/*.webp` files that existed on disk. The missing assignment was caused by the stored product/brand text using `Enkie`, while the identifiable official wheel brand is `Enkei`.

### 2. Fix applied
- Downloaded the official Enkei logo from Enkei's own logo page.
- Saved it as `/uploads/wheels/logos/enkei.webp`.
- Assigned `/uploads/wheels/logos/enkei.webp` only to the `Enkie` Wheels product.
- Updated `scripts/download-wheel-brand-logos.ts` so the stored `Enkie` spelling maps to the official `Enkei` brand logo without changing the product name.
- Kept the existing logo rendering in `ProductCard.tsx`: centered, `object-contain`, padded, white background, fixed `h-40` image area.

### 3. Files modified
- [scripts/download-wheel-brand-logos.ts](scripts/download-wheel-brand-logos.ts)
- [scripts/wheel-brand-logo-assignments.json](scripts/wheel-brand-logo-assignments.json)
- [REPORT.md](REPORT.md)
- Added [public/uploads/wheels/logos/enkei.webp](public/uploads/wheels/logos/enkei.webp)

### 4. Products updated

| Product | Brand logo assigned | Logo file | Source |
|---------|---------------------|-----------|--------|
| Enkie | Enkei | `/uploads/wheels/logos/enkei.webp` | `https://enkei.com/enkei-logo/` |

The full Wheels logo assignment now covers all 21 Wheels products.

### 5. Verification
- `npx tsx scripts\verify-wheel-brand-logos.ts` - **PASS**
  - 21 Wheels products checked
  - 21 logo paths verified against local files
  - 0 skipped
  - 0 broken paths
- Local app verification at `http://localhost:3000/collections/wheels`:
  - 21 assigned wheel logo URLs returned HTTP 200 image responses
  - Refresh check kept 51 wheel logo path occurrences in page markup
  - Page markup includes `object-contain` for logo rendering
- Tire safety verification:
  - `npx tsx scripts\audit-image-pipeline.ts` - **PASS**
  - `/collections/tires` contains 0 `/uploads/wheels/logos/` paths
- Code checks:
  - `npx.cmd eslint src\components\shop\ProductCard.tsx scripts\download-wheel-brand-logos.ts scripts\verify-wheel-brand-logos.ts scripts\inspect-wheel-products.ts` - **PASS**
  - `npx.cmd tsc --noEmit` - **PASS**

No Tire products, services, product names, descriptions, slugs, collections, buttons, routing, or product-card design were changed.
