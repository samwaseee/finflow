# FinFlow — Invoice & Finance Management

A modern, full-stack SaaS application for freelancers and growing businesses to manage invoices, track expenses, monitor cash flow, and handle team billing — all in one place.

![FinFlow Dashboard](./public/og-image.png)

---

## ✨ Features

### Core
- **Invoice Management** — Create, send, and track invoices with line items, status flow (Draft → Sent → Paid → Overdue), and one-click PDF download
- **Client Management** — Manage your client roster with contact details and invoice history
- **Expense Tracking** — Log and categorize business expenses across 8 categories with filters
- **PDF Generation** — Server-side branded invoice PDFs using `@react-pdf/renderer`

### Analytics & AI
- **Finance Dashboard** — KPI cards for revenue, outstanding, drafts, and client count with month-over-month growth
- **Revenue Charts** — 6-month area chart comparing revenue vs expenses powered by Recharts
- **Reports Page** — Invoice aging, top clients, expense breakdown, status pie chart, and CSV export
- **AI Cash Flow Forecast** — 3-month projection with health score and AI insights powered by Gemini API (cached for 7 days)

### SaaS Architecture
- **Multi-tenancy** — Every query is scoped by `orgId` — complete data isolation between organizations
- **Multi-org Switcher** — Create and switch between multiple organizations from the sidebar
- **Role-Based Access Control** — Owner, Accountant, and Viewer roles with permission enforcement
- **Stripe Billing** — Subscription management with Free, Pro ($29/mo), and Enterprise ($99/mo) plans
- **Stripe Webhooks** — Real-time subscription status sync via webhook events
- **Team Members** — Invite team members by email and assign roles

### UI & Polish
- **Dark Mode** — Full app dark mode with Light / Dark / System toggle
- **Floating Sidebar** — Frosted glass sidebar with top/bottom glow effects
- **Loading States** — Skeleton loaders and spinners on every page
- **Error States** — Error boundaries with retry buttons throughout
- **Empty States** — Welcoming onboarding experience for new organizations
- **Mobile Responsive** — Hamburger menu sidebar for mobile viewports

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma v7 |
| Auth | NextAuth.js + Google OAuth |
| Payments | Stripe (Checkout, Webhooks, Customer Portal) |
| AI | Google Gemini API |
| Charts | Recharts |
| PDF | @react-pdf/renderer |
| Theme | next-themes |
| Icons | Lucide React |
| Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Google Cloud](https://console.cloud.google.com) project with OAuth enabled
- A [Stripe](https://stripe.com) account (test mode)
- A [Google AI Studio](https://aistudio.google.com) API key (free tier)

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/finflow.git
cd finflow

# Install dependencies
npm install

# Set up Prisma
npx prisma generate
npx prisma migrate dev --name init
```

### Environment Variables

Create a `.env` file in the root:

```env
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?sslmode=require"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"  # openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="price_..."
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID="price_..."

# AI
GEMINI_API_KEY="AIza..."
```

### Running Locally

```bash
# Start the dev server
npm run dev

# In a separate terminal, forward Stripe webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Visit `http://localhost:3000` — you'll be redirected to the login page.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                  # API routes (backend)
│   │   ├── ai/forecast/      # Gemini AI forecast
│   │   ├── clients/          # Client CRUD
│   │   ├── dashboard/charts/ # Chart data
│   │   ├── expenses/         # Expense CRUD
│   │   ├── invoices/         # Invoice CRUD + PDF
│   │   ├── members/          # Team management
│   │   ├── orgs/             # Org management + switcher
│   │   ├── profile/          # User profile
│   │   ├── reports/          # Reports data
│   │   └── stripe/           # Checkout, portal, webhook
│   ├── dashboard/            # Protected dashboard pages
│   │   ├── clients/
│   │   ├── expenses/
│   │   ├── invoices/
│   │   ├── reports/
│   │   └── settings/
│   ├── login/                # Login page
│   └── onboarding/           # Org creation page
├── components/
│   ├── ui/                   # Reusable UI (EmptyState, ErrorState, LoadingState)
│   ├── CashFlowForecast.tsx  # AI forecast widget
│   ├── DashboardCharts.tsx   # Revenue/expense charts
│   ├── InvoicePDF.tsx        # PDF template
│   ├── OrgSwitcher.tsx       # Multi-org dropdown
│   ├── Sidebar.tsx           # Navigation sidebar
│   ├── ThemeToggle.tsx       # Dark mode toggle
│   └── providers.tsx         # SessionProvider + ThemeProvider
├── lib/
│   ├── api-helpers.ts        # Shared org session helper
│   ├── auth.ts               # NextAuth config
│   ├── config.ts             # Client-side config
│   ├── prisma.ts             # Prisma client singleton
│   ├── session.ts            # Server session helpers
│   └── stripe.ts             # Stripe client singleton
└── types/
    └── next-auth.d.ts        # Session type extensions
prisma/
└── schema.prisma             # Database schema
```

---

## 🗄 Database Schema

The app uses 9 core models with full multi-tenant isolation:

```
User → Membership → Organization
Organization → Client → Invoice → InvoiceItem
Organization → Expense
Organization → Subscription
Organization → ForecastCache
```

Every data model includes `orgId` ensuring complete tenant isolation at the query level.

---

## 💳 Stripe Setup

1. Create two products in your Stripe dashboard: **Pro** ($29/mo) and **Enterprise** ($99/mo)
2. Copy their `price_...` IDs into your `.env`
3. Enable the Stripe Customer Portal in your Stripe dashboard
4. For production, create a webhook endpoint pointing to `https://your-domain.com/api/stripe/webhook` with these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`

---

## 🤖 AI Forecast

The cash flow forecast uses Google's Gemini API to analyze the last 6 months of financial data and generate:

- A 3-month revenue/expense projection
- A financial health score (0–100)
- Actionable insights (positive, warning, suggestion)

Results are cached per organization for 7 days to minimize API calls. Click **Refresh** in the forecast card to force a new generation.

> The forecast is designed to be swappable — replace the Gemini fetch call in `src/app/api/ai/forecast/route.ts` with any other AI provider (OpenAI, Anthropic, etc.)

---

## 🚢 Deployment

The app is deployed on Vercel with Supabase as the database. To deploy your own:

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add all environment variables from `.env` to Vercel's environment settings
4. Add your production Stripe webhook endpoint
5. Update `NEXTAUTH_URL` and `metadataBase` in `layout.tsx` to your production URL

---

## 📋 What This Project Demonstrates

This project was built to showcase fullstack SaaS engineering skills:

- **Multi-tenant SaaS architecture** with complete data isolation using Prisma row-level filtering
- **Stripe Connect-style billing** with Checkout, Webhooks, and Customer Portal integration
- **Role-Based Access Control (RBAC)** enforced at the API level with three permission tiers
- **Server-side PDF generation** with `@react-pdf/renderer` served as downloadable files
- **AI integration** with Gemini API including prompt engineering and response caching
- **Real-time financial analytics** with aggregated Prisma queries and Recharts visualizations
- **Next.js App Router** patterns including server components, client components, and API routes
- **Production-ready UX** with dark mode, loading states, error boundaries, and empty states

---