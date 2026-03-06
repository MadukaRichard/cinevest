# CineVest — Film Investment Platform

> Invest in films. Track your ROI. Connect with investors.

CineVest is a full-stack MERN application that lets users browse film investment opportunities, fund projects via card or crypto wallet, and manage their portfolio through a real-time VIP dashboard with investor chat.

---

## Features

### Core
- **Film Browse & Detail** — Search, filter by genre/status/sort, view full film details with funding progress
- **Featured Films** — Admin-curated carousel on the homepage with drag-reorder support
- **Investment Flow** — Invest via card or crypto with amount validation, payment method selection, and confirmation
- **Portfolio Dashboard** — Donut chart (recharts) showing investment allocation, stats cards, recent activity
- **Real-time Chat** — Socket.io powered investor chat with message persistence (MongoDB) and room history
- **Notification System** — In-app bell notifications with unread count badge, mark-read, 30s polling

### Authentication & Security
- **Email/Password Auth** — Register → OTP email verification → Login
- **Wallet Auth (EIP-6963)** — MetaMask / injected wallet sign-in via nonce challenge
- **Refresh Tokens** — 15-minute access tokens + 90-day refresh tokens with silent rotation
- **OTP Brute-Force Protection** — Account lockout after 5 failed attempts (15-min cooldown)
- **Rate Limiting** — Separate limiters for auth, OTP, admin, and form endpoints
- **Helmet & CORS** — Security headers and configurable origin whitelist
- **Input Validation** — express-validator on every route with sanitization

### Admin Panel
- **Platform Stats** — Users, investments, films, revenue at a glance
- **User Management** — List, search, promote/demote roles (with self-protection)
- **Film CMS** — Full CRUD for films + featured toggle + reorder
- **Investment Management** — View all investments, update statuses
- **Audit Logs** — Timestamped trail of all admin actions
- **Admin Re-auth** — Password re-confirmation for write operations (short-lived session tokens)

### Email System
- **Branded HTML Templates** — Shared layout with 4 templates:
  - Verification OTP
  - Password reset (button + fallback URL)
  - Investment confirmation (details table)
  - Welcome email (feature highlights)

### UI/UX
- **Dark/Light Mode** — CSS variable-based theming with Tailwind + toggle
- **SEO & Open Graph** — Per-page `<title>`, meta descriptions, OG + Twitter Card tags via react-helmet-async
- **Code Splitting** — React.lazy() for 9 pages with Suspense + skeleton loader
- **Error Boundaries** — Graceful crash recovery at page and section levels with themed fallback UI, dev-mode stack traces, and retry buttons
- **Responsive Design** — Mobile-first Tailwind layout
- **How It Works** — Animated 4-step explainer section
- **Static Pages** — About, Terms of Service, Privacy Policy
- **404 Page** — Cinema-themed "Scene Not Found"

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Zustand, React Router 6, recharts, react-helmet-async, Framer Motion |
| Backend | Node.js, Express 4, Mongoose 8, Socket.io 4 |
| Database | MongoDB Atlas |
| Auth | JWT (access + refresh), bcryptjs, ethers.js v6 (wallet) |
| Email | Nodemailer (Gmail SMTP) |
| Security | Helmet, express-rate-limit, express-validator, CORS |

---

## Project Structure

```
cinevest/
├── client/                       # React frontend (Vite)
│   ├── src/
│   │   ├── assets/               # Static asset exports
│   │   ├── components/
│   │   │   ├── admin/            # AdminLayout, Dashboard, FilmMgmt, UserMgmt, InvestmentMgmt
│   │   │   ├── chat/             # ChatWindow, ChatInput, ChatSidebar
│   │   │   ├── dashboard/        # DashboardHome, Portfolio, Investments, Settings, Layout
│   │   │   └── ui/               # Button, Card, Modal, Navbar, Footer, FilmCard, etc.
│   │   ├── context/              # ThemeContext (dark/light)
│   │   ├── hooks/                # useDebounce, useLocalStorage, useWallet
│   │   ├── pages/                # Home, Login, Signup, Films, FilmDetail, Dashboard,
│   │   │                         # Chat, Admin, About, Terms, Privacy, NotFound, etc.
│   │   ├── store/                # Zustand stores (authStore, chatStore)
│   │   └── utils/                # api.js (axios + refresh interceptor), formatters, validators
│   └── package.json
│
├── server/                       # Express backend
│   ├── config/db.js              # MongoDB connection
│   ├── controllers/              # Auth, Film, Investment, Chat, Admin, Notification, Waitlist
│   ├── middleware/
│   │   ├── authMiddleware.js     # protect, admin guards
│   │   ├── errorMiddleware.js    # Global error handler
│   │   ├── rateLimiter.js        # authLimiter, otpLimiter, adminLimiter, formLimiter
│   │   └── validate.js           # express-validator rules + validate middleware
│   ├── models/                   # User, Film, Investment, ChatMessage, Notification,
│   │                             # Waitlist, AuditLog
│   ├── routes/                   # auth, film, investment, chat, admin, notification, waitlist
│   ├── utils/
│   │   ├── generateToken.js      # Access token (15m) + refresh token (90d)
│   │   ├── sendEmail.js          # HTML email templates (OTP, reset, invest, welcome)
│   │   └── calculateROI.js       # ROI computation helper
│   └── server.js                 # Entry point (Express + Socket.io)
│
├── .env                          # Environment variables (git-ignored)
├── .env.example                  # Template with all required vars
├── package.json                  # Root scripts (concurrently)
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local or [Atlas](https://www.mongodb.com/atlas))
- **npm** or **yarn**

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/cinevest.git
cd cinevest

# 2. Install all dependencies (root + client + server)
npm run install-all

# 3. Create your environment file
cp .env.example .env
# Then edit .env with your real values (see Environment Variables below)

# 4. Start development (client + server concurrently)
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client + server concurrently |
| `npm run server` | Start server only (nodemon) |
| `npm run client` | Start client only (Vite) |
| `npm run build` | Build client for production |
| `npm run install-all` | Install root + client + server deps |

---

## Environment Variables

Create a `.env` file in the project root. See [.env.example](.env.example) for the template.

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `5001` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for access tokens | Random 32-byte base64 |
| `JWT_EXPIRE` | Access token lifetime | `15m` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Random 32-byte base64 |
| `JWT_REFRESH_EXPIRE` | Refresh token lifetime | `90d` |
| `CLIENT_URL` | Frontend URL (CORS + emails) | `http://localhost:5173` |
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | Email SMTP port | `587` |
| `SMTP_USER` | Email sender address | `you@gmail.com` |
| `SMTP_PASSWORD` | Email app password | Gmail app password |

---

## API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Register new user |
| POST | `/login` | — | Login (returns access + refresh tokens) |
| POST | `/verify` | — | Verify email with OTP code |
| POST | `/resend-otp` | — | Resend verification OTP |
| POST | `/forgot-password` | — | Request password reset email |
| POST | `/reset-password/:token` | — | Reset password with token |
| POST | `/refresh` | — | Get new access token using refresh token |
| POST | `/wallet-nonce` | — | Get nonce for wallet signature |
| POST | `/wallet-verify` | — | Verify wallet signature + login/register |
| GET | `/profile` | Bearer | Get current user profile |
| PUT | `/profile` | Bearer | Update profile (name, email) |
| PUT | `/change-password` | Bearer | Change password (requires current password) |
| PUT | `/wallet` | Bearer | Connect additional wallet address |

### Films — `/api/films`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | — | Get all films (with search, filter, sort, pagination) |
| GET | `/featured` | — | Get featured films (ordered) |
| GET | `/:id` | — | Get single film by ID |
| POST | `/` | Admin + Session | Create new film |
| PUT | `/:id` | Admin + Session | Update film |
| PUT | `/:id/featured` | Admin + Session | Toggle featured status |
| PUT | `/featured/reorder` | Admin + Session | Reorder featured films |
| DELETE | `/:id` | Admin + Session | Delete film |

### Investments — `/api/investments`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Bearer | Get user's investments |
| POST | `/` | Bearer | Create new investment |
| GET | `/roi` | Bearer | Get ROI statistics |
| GET | `/:id` | Bearer | Get single investment |
| GET | `/film/:filmId` | Admin | Get all investors for a film |

### Chat — `/api/chat`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/rooms` | Bearer | Get user's chat rooms |
| GET | `/:roomId` | Bearer | Get messages in a room |
| POST | `/` | Bearer | Send message (REST fallback) |
| PUT | `/:roomId/read` | Bearer | Mark messages as read |
| DELETE | `/:messageId` | Bearer | Delete a message |

**Socket.io Events**: `joinRoom`, `sendMessage`, `newMessage`, `roomHistory`

### Notifications — `/api/notifications`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Bearer | Get notifications (with `unreadOnly` & `limit` params) |
| PUT | `/read-all` | Bearer | Mark all notifications as read |
| PUT | `/:id/read` | Bearer | Mark single notification as read |
| DELETE | `/:id` | Bearer | Delete notification |

### Admin — `/api/admin`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/reauth` | Admin | Re-authenticate (get admin session token) |
| GET | `/stats` | Admin | Platform-wide statistics |
| GET | `/users` | Admin | List all users (paginated) |
| GET | `/users/:id` | Admin | Get user details |
| PUT | `/users/:id/role` | Admin + Session | Update user role |
| DELETE | `/users/:id` | Admin + Session | Delete user (self-protected) |
| GET | `/investments` | Admin | List all investments |
| PUT | `/investments/:id` | Admin + Session | Update investment status |
| GET | `/audit-logs` | Admin | View audit trail |

### Waitlist — `/api/waitlist`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | — | Join waitlist |
| POST | `/unsubscribe` | — | Unsubscribe from waitlist |
| GET | `/` | Admin | Get all waitlist entries |

---

## Architecture Highlights

### Token Flow
1. Login → server returns `token` (15min) + `refreshToken` (90 days)
2. Client attaches `token` to every request via axios interceptor
3. On 401 → client silently calls `POST /auth/refresh` with the refresh token
4. New access token is returned; the failed request is retried automatically
5. If refresh fails → user is logged out

### Chat Persistence
- Socket.io `joinRoom` loads last 50 messages from MongoDB
- `sendMessage` persists to DB on the server then broadcasts to the room
- Client has REST fallback if socket is disconnected

### Admin Security
- All admin routes behind `protect` + `admin` middleware + stricter rate limiter
- Write operations require `X-Admin-Token` header (obtained via password re-confirmation)
- Admin session tokens expire in 15 minutes
- Self-deletion and self-demotion are blocked
- All admin actions logged to AuditLog collection

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Contact

For questions or support, please open an issue on GitHub.
