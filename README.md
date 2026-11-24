# Bakery Management System

Starter full-stack project using React + Vite, Node.js + Express, and MongoDB.

## Requirements
- Node.js LTS and npm
- MongoDB Community Server running locally, or a MongoDB Atlas connection string
- VS Code (recommended)

## Project structure
```text
BakeryManagementSystem/
├── frontend/
└── backend/
```

## 1. Configure the backend
Open a terminal in `backend`:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Edit `backend/.env` if needed. The default local MongoDB URL is:
`mongodb://127.0.0.1:27017/bakery_management`

Backend runs at `http://localhost:5000`.

Test it by opening `http://localhost:5000/api/health`.

## 2. Configure the frontend
Open a second terminal in `frontend`:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Notes
- This is the initial project starter: responsive bakery storefront UI, sample product data, Express health endpoint, and MongoDB connection configuration.
- The storefront includes product category filters, live product search, and a basket drawer with quantity controls. Basket contents are saved in the browser using localStorage.
- Checkout is currently a clearly marked placeholder: online orders, payment processing, product CRUD, and staff/admin dashboards are not yet connected to the frontend.
- Do not commit `.env` files or real secrets to GitHub.

## Authentication module (Phase 1)
The backend now includes customer registration/login, JWT-protected profile endpoints, role authorization middleware, and an admin bootstrap script.

### Configure the secret
In `backend/.env`, replace the sample `JWT_SECRET` with a long private random value. Do not share it or commit `.env` to GitHub. Keep the existing `MONGO_URI` and `CLIENT_URL` values if they are correct.

### Start backend
```powershell
cd backend
npm install
npm run dev
```

### Create the first administrator
Set `ADMIN_NAME`, `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `backend/.env`, then run this once:
```powershell
npm run create-admin
```
Public registration always creates a `CUSTOMER`; it cannot create staff/admin accounts by passing a role in the request. Staff/admin provisioning will be added to the protected admin module.

### Authentication API
Base URL: `http://localhost:5000/api/auth`

- `POST /register` — body: `{ "username", "email", "password", "fullName", "phoneNumber", "deliveryAddress" }`
- `POST /login` — body: `{ "email", "password" }`
- `GET /me` — requires `Authorization: Bearer <token>`
- `PATCH /profile` — requires token; accepts `username`, `fullName`, `phoneNumber`, `deliveryAddress`
- `POST /logout` — requires token; discard the token on the client (JWT is stateless)

Role authorization helper is available as `authorize("ADMIN")`, `authorize("STAFF", "ADMIN")` after `protect`. Passwords are hashed with bcryptjs and never returned by the API.

## Phase 2: Product, inventory and order APIs

The backend now includes these modules:

### Product catalogue — `/api/products`
- `GET /` — public product list; optional `?search=cake&category=Cakes`
- `GET /:id` — public product details
- `POST /` — Admin only; create a product
- `PATCH /:id` — Staff/Admin; update product details, stock or availability
- `DELETE /:id` — Admin only; soft-delete a product
- `GET /low-stock` — Staff/Admin; list products at or below their low-stock threshold

Product JSON fields: `name`, `description`, `category`, `price`, `image`, `stock`, `lowStockThreshold`, `isAvailable`.

### Orders — `/api/orders`
All order endpoints require a Bearer JWT.
- `POST /` — Customer places an order. Body: `{ "items": [{ "productId": "<MongoDB product id>", "quantity": 2 }], "deliveryAddress": "...", "paymentMethod": "COD" }`
- `GET /my` — Customer order history
- `PATCH /:id/cancel` — Customer cancels an eligible order (PLACED or CONFIRMED)
- `GET /` — Staff/Admin views all orders
- `PATCH /:id/status` — Staff/Admin updates status; accepted values: `CONFIRMED`, `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`

Payment is a project demonstration only: `COD` remains pending and `SIMULATED_ONLINE` is marked paid without contacting a payment provider. Do not use this for real payments. Order placement reserves stock and cancellation restores it.

### Postman quick checks
1. Register/login using `/api/auth`, then copy the returned `token`.
2. Add `Authorization: Bearer <token>` to protected requests.
3. Login as an Admin and `POST /api/products` to create sample products.
4. Register/login as a Customer and place an order using the product's MongoDB `_id`.
5. Login as Staff/Admin to view orders and update their status.
