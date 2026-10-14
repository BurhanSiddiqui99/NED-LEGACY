# LogiPulse — Courier & Last-Mile Delivery Platform

## Project Overview

**LogiPulse** is a courier platform that connects three stakeholders, **Customers**, **Riders** and **Admins**, through one shared Firestore database. A customer requests a delivery, a nearby rider accepts it, and every status change, chat message and rider GPS update reaches all three dashboards in real time. Deliveries work anywhere in Pakistan, from Karachi to Lahore, Islamabad, Peshawar and Quetta.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS, Lucide icons |
| Database & Auth | Firebase Cloud Firestore + Firebase Authentication |
| Realtime | Firestore `onSnapshot` listeners (no WebSockets needed) |
| Maps | Google Maps JS API (Places autocomplete, Distance Matrix, live markers) |
| Distance | Haversine formula (`lib/distance.ts`) |
| Notifications | Firestore notification inboxes + Sonner toasts + browser notifications |
| Charts | Recharts |
| Offline demo mode | LocalStorage mock store with cross-tab sync (`lib/firebase/mock-store.ts`) |
| Deployment | Vercel |

---

## Three Dashboard Architecture

```
  Customer (/customer)      Rider (/rider)      Admin (/admin)
          │                       │                   │
          └───────────────────────┼───────────────────┘
                                  │
          services/*.service.ts  (orders, riders, messages, notifications)
                                  │
                       lib/firebase/firestore.ts
                                  │
  Firestore: users · riders · orders · orders/{id}/messages · notifications
```

- **Login / Role selection** (`/login`) routes each user to their dashboard. `RoleGuard` blocks access to other roles' routes.
- **Customer**: create a courier request, see own orders and live status, see the assigned rider, track the rider on a map, chat with the rider.
- **Rider**: Smart Nearby Pickup feed, accept an order, update status (`Picked Up → In Transit → Delivered`), share live GPS, chat with the customer.
- **Admin**: platform statistics, priority analytics, manage users/riders/orders, escalate priority, broadcast alerts.

### Order workflow (shared data)

| Step | Who | What happens in the data layer |
|---|---|---|
| 1 | Customer | `createOrder()` writes `orders/{id}` with `status: "pending"`, `riderId: null` and notifies the admin and rider inboxes |
| 2 | Admin / Rider | Admin table (`subscribeToAllOrders`) and rider feed (`status == pending && riderId == null`) receive it through live listeners |
| 3 | Rider | `acceptOrder()` runs a **Firestore transaction**: it re-reads the order and only assigns it if it is still unassigned |
| 4 | Customer | The customer's order listener receives the rider's name, vehicle, phone and starting location |
| 5 | Customer ↔ Rider | Messages are stored in `orders/{id}/messages`, and both sides listen to that subcollection |
| 6 | Rider | `updateOrderStatus()` enforces `accepted → picked_up → in_transit → delivered` inside a transaction |
| 7 | Customer + Admin | Both dashboards update from their snapshot listeners and get a notification |

### Within-city vs. intercity delivery

Every city has a warehouse (`WAREHOUSES` in `lib/logistics.ts`). Each address belongs to its nearest warehouse. If pickup and drop-off map to the same warehouse the order is **intracity**; otherwise it is **intercity**.

Every verification works the same way. The **rider** taps "Email me the code" and receives a 6-digit OTP on their own email. The verifying party (**customer** or **warehouse admin**) asks the rider for the code and enters it in their own dashboard. A matching code proves the rider is physically there. **Entering the last required code completes the step immediately.** For example, the customer typing the pickup code marks the parcel Picked Up, and typing the delivery code marks it Delivered. The rider does not press anything else.

**Flow 1: within the city**

| Step | Who acts | Who verifies (enters the rider's code) |
|---|---|---|
| Request → appears in the nearby feed of that city's riders | Customer | – |
| Accept **or reject** | Rider | Rejections (with reason) are logged for the admin. The order stays open for other riders in the city. |
| Picked up | Rider | **Customer** (order page) |
| In transit → Delivered | Rider | **Customer** |

**Flow 2: between cities**

| Step | Who acts | Who verifies |
|---|---|---|
| Request → accept / reject | Rider in the **pickup city** | – |
| Picked up | First-mile rider | **Customer** |
| Dropped at origin warehouse | First-mile rider | **Customer** *and* **admin** (admin enters it on `/admin/warehouses` or the order page) |
| Dispatched → arrived at destination warehouse | Admin | Admin action on `/admin/warehouses` |
| Claimed from destination warehouse | Rider in the **destination city** | Accept / reject |
| Collected from warehouse | Last-mile rider | **Admin** |
| Delivered | Last-mile rider | **Customer** |

**How OTP works:** `/api/otp/send` generates the code and emails it to the rider with Nodemailer. The server returns an HMAC-signed token, and only that token is saved on the order, never the code. `/api/otp/verify` checks the code the customer or admin typed against the token. Codes expire after 15 minutes, resends are throttled to one per 30 s, and each code allows 5 attempts. Without SMTP settings in development, the API returns the code to the rider UI as a demo code.

> The OTP check runs on the server, but the final status write is made by the client and can only be enforced by Firestore rules, which cannot see OTPs. A Cloud Function (or `firebase-admin` in the verify route) that writes the status itself would close this gap.

### Pricing

Flat zone pricing (`ZONE_PRICES` in `lib/logistics.ts`). The zone depends on which city warehouse serves the pickup and the drop-off, and on each warehouse's province:

| Zone | Price |
|---|---|
| Pickup and drop-off in the same city | **PKR 250** |
| Different city, same province (e.g. Lahore → Multan) | **PKR 400** |
| Different province (e.g. Karachi → Lahore) | **PKR 600** |

HIGH (+100) and URGENT (+250) priority surcharges from the Day 2 feature are added on top. Islamabad is treated as its own territory (Islamabad Capital Territory), so Islamabad → Rawalpindi is priced as a different province.

### Riders see only their own city

Customers see the detected sender and receiver city on the order form and can correct either one. Riders choose their city when they register (admins can change it on `/admin/riders`). Riders created before this feature fall back to the city nearest their GPS location. The nearby feed and the dashboard counts only show jobs that **start** in that city: a new request picked up there, or an intercity parcel waiting at that city's warehouse for its last mile. New-job notifications go to a per-city inbox (`riders-<warehouseId>`), so riders in other cities are not alerted.

### Warehouses (admin)

`/admin/warehouses` shows every hub with live counts:
- **In stock:** at the hub now.
- **Incoming:** first-mile riders on the way, plus line-haul arriving.
- **Outgoing:** line-haul leaving.
- **To deliver:** waiting for or with a last-mile rider.
- **Delivered**

Each hub also shows its weight in stock and how much of its capacity is used. Admins dispatch and receive line-haul parcels from the same page.

---

## Smart Nearby Pickup

`/rider/available-orders` ranks every pending order by **real distance** from the rider:

1. The rider's position comes from device GPS or one of the city hubs (`components/rider/location-selector.tsx`).
2. For each order, `calculateDistance()` applies the **Haversine formula** to the rider's and the pickup's lat/lng.
3. Riders can filter by radius (2 / 5 / 10 / 25 km / all of Pakistan) and sort by nearest, priority, newest or **Smart** (distance + priority).
4. A Google Map view shows every pickup pin around the rider.

Each card shows labels like `Order #LP-10421 – 1.9 km`. The distance is recalculated from coordinates whenever the rider's location changes. None of these values are hard-coded.

### Live rider tracking

Once a rider accepts an order, the delivery page streams the rider's position onto the order (`currentRiderLocation`) using `navigator.geolocation.watchPosition`. Writes are throttled to one every 4 s or every 15 m of movement. Customer and admin maps move the rider pin as each update arrives. For demos without GPS, **Simulate Route** drives the rider toward the pickup and then the drop-off.

---

## Day 2 Priority Feature — "Peak Hours"

The existing order model was extended, not duplicated. Each order now has an optional `priority: "normal" | "high" | "urgent"` field. Orders created before Day 2 have no `priority` and are treated as **Normal** by `getOrderPriority()`, so no migration is needed.

| Requirement | Implementation |
|---|---|
| **1. Priority display** | `PriorityBadge` on every order card, table row, rider card and detail page. High orders get an orange ring, Urgent orders a pulsing red ring and tinted row |
| **2. Filtering** | Priority filter chips with counts on the rider feed and the admin/customer order tables, plus a "Highest priority first" sort |
| **3. Rider decision** | Rider Decision View table (Order · Distance · Priority · Score). **Smart sort** uses `score = distance ÷ weight` (Normal ×1, High ×1.6, Urgent ×2.5), so an Urgent order 2.5 km away ranks equal to a Normal order 1 km away |
| **4. Admin analytics** | `PriorityAnalytics` shows live NORMAL / HIGH / URGENT counts, with "awaiting rider" and "in progress" breakdowns, computed from the realtime orders snapshot |

Customers choose the priority when booking (High +PKR 100, Urgent +PKR 250). Admins can escalate an order's priority from the order detail page, which notifies the rider and the customer.

---

## Notifications

Every event writes to Firestore `notifications`, keyed by inbox:

- `<uid>`: personal notifications (order accepted, status changes, new chat message)
- `admin`: all admins (new requests, acceptances, status changes)
- `riders`: all riders (new delivery available, with an URGENT/HIGH tag)
- `all`: system-wide broadcasts from the admin

The header bell listens to the user's inboxes, shows a toast for each new item, and shows a browser notification when the tab is in the background.

---

## How to Run

```bash
npm install
cp .env.example .env.local   # then fill in the keys below
npm run dev                  # http://localhost:3000
```

`.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...   # enable Maps JavaScript, Places, Geocoding, Distance Matrix, Directions

# Email OTP (server only)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=you@gmail.com
SMTP_PASS=<Gmail App Password>
OTP_SECRET=<random 32 chars>
```

**Firestore security rules:** paste `firestore.rules` into *Firebase Console → Firestore → Rules → Publish*. The chat subcollection and live-location updates require these rules.

**No Firebase keys?** The app falls back to a LocalStorage demo store that has seeded orders at every priority. Changes sync across tabs, so you can open customer, rider and admin side by side.

**Deploy:** import the repo in Vercel, add the same environment variables, and deploy. Add the Vercel domain to the Google Maps API key's allowed referrers.

---

## Demo Sequence

1. **Login / Roles**: `/login`, demo accounts for customer, rider and admin
2. **Customer creates a request**: `/customer/create-order`, search any address in Pakistan and choose a priority
3. **Rider finds it**: `/rider/available-orders`, where it appears instantly
4. **Smart Nearby Pickup**: change the rider location and watch the distances and ranking update
5. **Rider accepts**: the transaction assigns the order
6. **Chat**: customer and rider message each other in real time
7. **Status updates**: Picked Up → In Transit → Delivered, with live GPS or Simulate Route on the map
8. **Admin dashboard**: stats, charts and the full order table
9. **Day 2 Priority**: badges, filters, Rider Decision View and priority analytics

---

## Judge Q&A Notes

- **How does User data reach the Rider dashboard?** Both read the same `orders` collection. The rider's `onSnapshot` query (`status == pending, riderId == null`) receives new documents as soon as they are written.
- **Two riders accept at once?** `acceptOrder` uses `runTransaction`. The second transaction re-reads `riderId`, finds it set, and fails with "already accepted". Security rules also only allow `riderId: null → self`.
- **Nearest pickup?** The Haversine great-circle distance between rider and pickup coordinates. Google Distance Matrix provides road distance for fare estimates.
- **Status propagation?** Each dashboard subscribes to the order (or order list). Firestore pushes every change to all listeners, so no polling is needed.
- **Day 2 changes?** One optional field (`priority`), one config map (`PRIORITY_CONFIG`) and a helper (`getOrderPriority`). Existing components gained a badge, a filter and a sort key.
- **10,000 riders?** Geohash-indexed pickup queries (e.g. geofire-common) instead of loading every pending order. Move notifications to Cloud Functions with FCM push. Run assignment server-side with a scoring queue. Shard live locations into a lightweight `riderLocations` collection or Realtime Database.
