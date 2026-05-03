# FarmFresh

FarmFresh is a full-stack marketplace that connects customers with local farmers. It includes product browsing, farmer profiles, ordering, reviews, favorites, messaging, and a farmer dashboard experience, all powered by Next.js, MongoDB, and Tailwind CSS.

## Features

- Customer and farmer authentication with NextAuth.
- Product catalog with categories, reviews, and ratings.
- Farmer profiles with listings and performance insights.
- Cart, checkout, and order management flows.
- Favorites and saved items.
- Messaging between customers and farmers.
- Analytics and dashboards for farmer operations.

## Tech Stack

- **Framework:** Next.js (App Router), React 18
- **Styling:** Tailwind CSS
- **Data:** MongoDB + Mongoose
- **Auth:** NextAuth
- **Data fetching:** React Query (@tanstack/react-query)
- **Email:** Resend
- **Charts:** Chart.js, Recharts, Nivo

## Getting Started

Install dependencies and run the dev server:

```powershell
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Scripts

```powershell
npm run dev
npm run build
npm run start
npm run lint
```

## Environment Variables

Create a `.env.local` file in the project root and provide the following values:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `MONGODB_URI`
- `JWT_SECRET`
- `RESEND_API_KEY`

> Keep `.env.local` private and rotate any exposed secrets.

## Project Structure

```
app/                # App Router pages and API routes
  api/              # REST endpoints (auth, products, orders, etc.)
components/         # Shared UI components
contexts/           # React context providers
hooks/              # React Query and domain hooks
lib/                # API helpers, DB, cache, utils
models/             # Mongoose models
providers/          # App-wide providers
utils/              # Small utilities
```

## Key Pages

- `/` Home page with highlights, featured products, and top farmer.
- `/products` Product listing with search and filters.
- `/farmers` Farmer listing and profiles.
- `/cart` Cart and checkout flow.
- `/orders` Orders management.
- `/messages` Messaging inbox.
- `/profile` User profile.
- `/dashboard` Farmer dashboard and analytics.

## API Routes (App Router)

- `GET /api/home` Aggregated data for the home page.
- `GET/POST /api/products` Product search and creation.
- `GET/POST /api/farmers` Farmer listing and updates.
- `GET/POST /api/orders` Order creation and status updates.
- `GET/POST /api/reviews` Reviews and rating updates.
- `GET /api/categories` Category counts for the home and filters.
- `GET/POST /api/cart` Cart operations.
- `GET/POST /api/favorites` Favorites management.
- `GET/POST /api/messages` Messaging endpoints.
- `GET/POST /api/auth/*` Auth handlers (NextAuth).

## Data Models

- `User`
- `Farmer`
- `Product`
- `Order`
- `Review`
- `Cart`
- `Favorite`
- `Conversation`
- `Message`

## Notes

- Some API routes use lightweight in-memory caching for repeated requests.
- Linting uses `next lint` with the project ESLint config.

## Deployment

Build and start the app:

```powershell
npm run build
npm run start
```

Deploy to any Node.js hosting that supports Next.js. Vercel provides first-class support.
