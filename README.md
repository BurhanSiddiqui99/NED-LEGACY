# LogiPulse — Full-Stack Courier & Last-Mile Delivery Platform

**LogiPulse** is an enterprise-grade, full-stack last-mile courier and delivery operations management platform built for high-throughput urban logistics in Karachi. It interconnects **Customers**, **Delivery Riders**, and **Logistics Administrators** in real-time through Firebase Cloud Firestore, reactive state streaming, dynamic Haversine proximity calculations, and encrypted role-based access.

---

## 🌟 Key Features

### 1. Three Interconnected Role Dashboards
- **Customer Portal (`/customer/dashboard`)**:
  - Instant dispatch request booking with verified Karachi landmarks (NED University, Saddar, Clifton, Gulshan-e-Iqbal, North Nazimabad, etc.) or device GPS.
  - Automated Haversine distance pricing calculation.
  - Realtime visual step-by-step milestone delivery timeline.
  - One-to-one courier chat with assigned riders.
  - Pending order cancellation with confirmation protection.

- **Rider Fleet Partner Portal (`/rider/dashboard`)**:
  - **Smart Nearby Pickup**: Live radar ranking available orders dynamically by distance in kilometers from rider's current coordinates using the Haversine formula.
  - Distance radius filters (*All Karachi*, *Within 2 km*, *Within 5 km*, *Within 10 km*).
  - Online/Off-Duty status toggle.
  - Atomic order acceptance using Firestore transactions to prevent race conditions.
  - Sequential milestone advancement: `Accepted` ➔ `Picked Up` ➔ `In Transit` ➔ `Delivered` with canvas celebration.

- **Admin Operations Control Center (`/admin/dashboard`)**:
  - 7 Core system metrics: Total Customers, Total Riders, Available Riders, Total Orders, Pending Orders, Active Deliveries, and Completed Orders.
  - Recharts analytics: Daily delivery activity trends and status breakdown donut chart.
  - Comprehensive order manifests with search, status filters, and CSV export.
  - Fleet and customer account management (activation, deactivation, and verification).
  - System-wide broadcast alerts center.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js App Router (14.2) |
| Language | TypeScript (Strict mode) |
| Styling | Tailwind CSS |
| UI & Icons | Lucide React |
| Database | Firebase Cloud Firestore (Modular SDK) |
| Authentication | Firebase Authentication |
| Real-Time Synchronization | Firestore `onSnapshot` listeners |
| Notifications | In-app Firestore notification center + Sonner toasts + optional FCM |
| Data Analytics | Recharts |
| Geolocation / Distance | Browser Geolocation API + Mathematical Haversine formula |
| Deployment | Vercel |

---

## 🚀 Quick Start (Local Setup)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/BurhanSiddiqui99/NED-LEGACY.git
cd NED-LEGACY
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **💡 Zero-Config Live Mode for Hackathon Evaluators:**
> If you launch the application without specifying Firebase credentials, LogiPulse automatically activates its **Hackathon Local Live Mode**. It provides instant cross-tab reactivity and pre-seeded Karachi orders, allowing you to test the entire 9-step workflow immediately!

---

## ☁️ Firebase Cloud Configuration

To connect LogiPulse directly to your Google Cloud Firebase project:

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Email/Password Authentication** under *Build > Authentication > Sign-in method*.
3. Enable **Cloud Firestore** in test or production mode under *Build > Firestore Database*.
4. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
5. Populate your Firebase project config keys inside `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-app
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
   NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:...
   ```
6. Deploy the included security rules and indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

---

## 🏆 Hackathon Workflow Demonstration (9 Steps)

You can demonstrate the complete delivery lifecycle across multiple browser tabs:

1. **Step 1 — Customer Login**:
   - Navigate to `/login` and click **"Customer"** on the 1-Click Demo Launcher (`customer@logipulse.demo`).
2. **Step 2 — Create Order**:
   - Click **"New Courier Delivery"** (`/customer/create-order`).
   - Select pickup from *NED University* and destination *Saddar Downtown*.
   - Click **"Request Delivery Now"**. Status is set to **Pending**.
3. **Step 3 — Rider Login**:
   - In a second browser tab (or using the role switcher), sign in as **Rider** (`rider@logipulse.demo`).
4. **Step 4 — Smart Nearby Pickup**:
   - Open **Available Orders** (`/rider/available-orders`).
   - Notice the order appears in real-time, dynamically ranked by distance from the rider's position in kilometers.
5. **Step 5 — Rider Accepts Order**:
   - Rider clicks **"Accept Order"**. An atomic transaction locks the order and marks it **Accepted**.
6. **Step 6 — Customer Receives Update**:
   - In the Customer tab, the assigned rider name (*Tariq Mahmood*), motorcycle specs, and an in-app notification instantly update.
7. **Step 7 — Customer and Rider Chat**:
   - Customer clicks **"Chat with Rider"** and sends a message.
   - Rider opens **Chat** in their tab and replies in real-time.
8. **Step 8 — Rider Advances Delivery Milestones**:
   - In **My Deliveries**, rider advances status sequentially:
     `Accepted` ➔ `Picked Up` ➔ `In Transit` ➔ `Delivered` 🎉.
   - The customer tracking timeline synchronizes instantaneously.
9. **Step 9 — Admin Monitoring**:
   - Sign in as **Admin** (`admin@logipulse.demo`) to view updated revenue, fulfillment metrics, and Recharts daily volume curves.

---

## 🔒 Security Architecture

- **Least-Privilege Security Rules (`firestore.rules`)**:
  - Unauthenticated requests are blocked.
  - Customers can read and create only their own records.
  - Riders can only read unassigned pending orders or orders assigned to their UID.
  - Only the assigned rider can update milestone states in sequential order.
  - Chat messages are isolated exclusively to the sender, receiver, and admin.
  - Prevents client-side privilege escalation to Admin.

---

## 🚢 Vercel Deployment

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your `NED-LEGACY` repository.
4. Add the Firebase environment variables from `.env.local` to the Vercel Project Settings.
5. Click **Deploy**. Vercel will build and host the Next.js App Router project globally.
