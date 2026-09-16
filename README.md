# 🛒 Real-Time E-Commerce Platform

A production-oriented **real-time e-commerce backend** built with Node.js, Express, MongoDB, and modern backend technologies.

This project goes beyond basic CRUD by implementing real-world e-commerce concerns such as **authentication, authorization, inventory management, cart and order workflows, payment processing, webhooks, real-time updates, concurrency handling, caching, background jobs, validation, testing, and production hardening**.

The project is being developed incrementally, with each module introducing a specific backend engineering concept.

---

## 📌 Project Description

This platform provides a complete backend for an e-commerce application supporting both **customers and administrators**.

Customers can create accounts, browse products, manage their carts, place orders, make payments, track order status in real time, and review purchased products.

Administrators can manage products, categories, inventory, orders, and receive real-time updates about customer activity.

The system is designed around a modular architecture so that features such as **Redis, WebSockets, payment gateways, queues, and background workers** can be introduced where they provide real-world value rather than being added unnecessarily.

---

## ✨ Key Features

### 👤 Authentication & Authorization

* User registration and login
* JWT-based authentication
* Access and refresh token system
* HTTP-only cookies
* Logout and token invalidation
* Password hashing with bcrypt
* Change password
* Forgot/reset password
* Email verification
* Google authentication
* Role-based access control
* Admin authorization
* Protected routes

---

### 📦 Product Catalog

* Product CRUD
* Category management
* Product-category relationship
* Product search
* Filtering
* Sorting
* Pagination
* Product activation/deactivation
* Stock management
* Multiple product images
* Cloudinary image storage
* Add/remove product images independently
* Image cleanup and rollback handling

---

### 🛍️ Shopping Cart

Customers can:

* Add products to cart
* Increase/decrease product quantities
* Set product quantity
* Remove individual products
* Clear cart
* View their cart
* Prevent quantities greater than available stock
* Prevent inactive products from being added

Each user has a single persistent cart.

Cart data stores the product reference and quantity, while **product price is resolved from the product catalog until checkout**.

---

### 📋 Order Management

The order system converts a mutable cart into a permanent purchase record.

Orders maintain a snapshot of:

* Product
* Product name
* Purchase price
* Quantity
* Subtotal
* Total amount
* Shipping address

This ensures historical orders remain accurate even when the original product changes later.

Order and payment states are handled separately.

#### Order Status

```text
pending
confirmed
processing
shipped
delivered
cancelled
```

#### Payment Status

```text
pending
paid
failed
refunded
```

---

### 💳 Payments

The payment system will support:

* Payment gateway integration
* Server-side payment verification
* Payment failure handling
* Webhook processing
* Webhook signature verification
* Idempotent payment processing
* Payment/order state synchronization

The server remains the source of truth rather than trusting payment information supplied directly by the client.

---

### 📦 Inventory & Concurrency

Inventory management focuses on real-world race conditions.

The system will handle:

* Stock validation
* Atomic stock updates
* Concurrent purchase attempts
* Preventing overselling
* Inventory consistency
* Transaction-based operations where required

Example problem:

```text
User A ──┐
         ├──> Product Stock = 1
User B ──┘
```

Both users attempting to purchase the final item must not result in the product being sold twice.

---

### ⚡ Real-Time Features

Real-time functionality will be implemented using WebSockets / Socket.IO.

Customers can receive events such as:

```text
Order confirmed
Order processing
Order shipped
Order delivered
```

Administrators can receive real-time events such as:

```text
New order
Order status changed
Inventory changed
```

The system will also support targeted events and notifications rather than broadcasting every event to every connected client.

---

### 🚀 Redis

Redis will be introduced where it solves an actual system problem.

Potential uses include:

* Product caching
* Temporary data
* User/socket presence
* Rate limiting
* Frequently accessed data
* Short-lived state

The goal is not simply to "use Redis", but to understand **why Redis is appropriate for a particular workload**.

---

### 🔄 Background Jobs & Queues

Long-running or asynchronous operations will be moved away from the request-response cycle.

Potential jobs include:

* Email notifications
* Order notifications
* Payment-related processing
* Image cleanup
* Retryable external-service operations

The queue architecture will support:

```text
API Server
    ↓
Queue
    ↓
Worker
    ↓
Background Job
```

with retry and failure handling.

---

### ⭐ Reviews & Ratings

Customers will be able to:

* Review purchased products
* Rate products
* Prevent reviews from users who haven't purchased
* Manage their own reviews

This introduces business-level authorization rather than relying only on simple authentication.

---

### 🛡️ Security

Security measures include:

* Password hashing
* JWT authentication
* HTTP-only cookies
* Role-based authorization
* Request validation
* CORS configuration
* Helmet security headers
* Rate limiting
* Secure environment variables
* Ownership checks
* Payment webhook verification
* Centralized error handling

---

### ✅ Validation & Error Handling

The API uses structured request validation and centralized error handling.

Validation is responsible for checking whether incoming data has the correct shape and type.

Business logic remains inside the appropriate controller/service layer.

The application uses a consistent API response and error structure.

---

## 🏗️ Architecture

The project follows a modular backend architecture:

```text
Client
  │
  ▼
Routes
  │
  ▼
Middleware
  │
  ├── Authentication
  ├── Authorization
  ├── Validation
  └── Request processing
  │
  ▼
Controllers
  │
  ▼
Business Logic
  │
  ├── MongoDB / Mongoose
  ├── Redis
  ├── Payment Gateway
  ├── Cloudinary
  ├── Queue
  └── WebSocket Server
```

---

## 📁 Project Structure

```text
e-commerce/
│
├── src/
│   ├── config/
│   │
│   ├── controllers/
│   │
│   ├── middleware/
│   │
│   ├── models/
│   │
│   ├── routes/
│   │
│   ├── utils/
│   │
│   ├── app.js
│   └── index.js
│
├── public/
│   └── temp/
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

The structure may evolve as advanced modules such as queues, services, WebSockets, and Redis are introduced.

---

## 🧰 Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

### Authentication & Security

* JWT
* bcrypt
* HTTP-only cookies
* Helmet
* CORS

### Validation

* Zod

### File & Media Management

* Multer
* Cloudinary

### Real-Time Communication

* Socket.IO / WebSockets

### Caching & Distributed State

* Redis

### Background Processing

* Queue / Worker architecture

### Payments

* Payment Gateway
* Webhooks

### Testing

* API integration testing
* Unit testing
* Database testing

### Deployment

* Docker
* Environment-based configuration
* CI/CD

---

## 🔐 User Roles

### Customer

```text
Register
Login
Manage profile
Browse products
Search/filter products
Manage cart
Checkout
Create orders
View orders
Cancel eligible orders
Make payments
Track orders
Review purchased products
```

### Admin

```text
Manage products
Manage categories
Manage inventory
Manage product images
View/manage orders
Update order status
Receive real-time order events
Monitor inventory
```

---

## 🔄 Order Lifecycle

The expected order lifecycle is:

```text
Cart
  │
  ▼
Checkout
  │
  ▼
Order Created
  │
  ▼
Payment
  │
  ├── Failed ──> Payment Failed
  │
  └── Success
        │
        ▼
     Confirmed
        │
        ▼
     Processing
        │
        ▼
      Shipped
        │
        ▼
     Delivered
```

Cancellation and refund flows will depend on the current order/payment state.

---

## ⚡ Real-Time Architecture

The real-time layer separates normal HTTP operations from event delivery.

```text
Customer
   │
   │ HTTP
   ▼
Express API
   │
   ├── Order created
   ├── Order updated
   └── Inventory changed
            │
            ▼
       Event Layer
            │
            ▼
       Socket.IO
        /       \
       /         \
Customer        Admin
```

Targeted rooms/events will be used where appropriate so users receive only events relevant to them.

---

## 🗄️ Database Design

Core entities include:

```text
User
 │
 ├── Cart
 │     └── Cart Items
 │
 └── Orders
       └── Order Items


Category
   │
   └── Products
          │
          ├── Images
          └── Reviews
```

Orders preserve historical purchase information rather than depending entirely on current product data.

---

## 🔄 External Service Failure Handling

The application considers failures from external services such as Cloudinary and payment providers.

For example:

```text
Upload Image
     │
     ▼
Cloudinary
     │
     ├── Success
     │     ↓
     │   Save Product
     │
     └── Failure
           ↓
      Cleanup / Rollback
```

This prevents partially completed operations from leaving unnecessary external resources behind.

---

## 📡 API Design

The API follows REST-oriented resource naming.

Example endpoints:

```text
/api/auth
/api/categories
/api/products
/api/cart
/api/orders
/api/payments
/api/reviews
```

Example cart operations:

```text
POST   /api/cart/items
GET    /api/cart
PATCH  /api/cart/items/:id
DELETE /api/cart/items/:id
DELETE /api/cart
```

Authentication-protected resources require a valid authenticated user.

Administrative resources additionally require admin authorization.

---

## 🧪 Testing Strategy

The project will include tests for:

### Authentication

* Registration
* Login
* Logout
* Token refresh
* Protected routes
* Authorization

### Products

* CRUD
* Validation
* Search
* Filtering
* Pagination
* Image handling

### Cart

* Add item
* Update quantity
* Remove item
* Clear cart
* Stock validation
* Ownership

### Orders

* Checkout
* Order creation
* Price snapshot
* Stock handling
* Cancellation

### Payments

* Successful payment
* Failed payment
* Webhook verification
* Duplicate webhook handling

### Advanced Features

* Concurrent inventory updates
* Redis behavior
* Queue failures/retries
* Real-time events

---

## ⚙️ Environment Variables

Create a `.env` file:

```env
PORT=

MONGO_URI=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

ACCESS_TOKEN_EXPIRY=
REFRESH_TOKEN_EXPIRY=

GOOGLE_CLIENT_ID=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

REDIS_URL=

PAYMENT_SECRET=
PAYMENT_WEBHOOK_SECRET=
```

Only variables required by the currently implemented modules need to be configured.

**Never commit `.env` to GitHub.**

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Rohit1752003/E-Commarce
cd e-commerce
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create:

```text
.env
```

and provide the required credentials.

### 4. Start the development server

```bash
npm run dev
```

The API will start on the configured port.

---

## 📚 Engineering Concepts Demonstrated

This project is designed to demonstrate practical backend engineering rather than only CRUD implementation.

### Fundamentals

* REST APIs
* Express routing
* Middleware
* Controllers
* Mongoose models
* MongoDB relationships
* Request validation
* Error handling

### Authentication

* JWT
* Refresh tokens
* Cookies
* Password hashing
* OAuth / Google authentication
* RBAC

### Data & Business Logic

* Ownership authorization
* Soft deletion
* Pagination
* Filtering
* Sorting
* Search
* Data snapshots
* Inventory management

### Distributed Systems

* Redis
* WebSockets
* Event-driven architecture
* Queues
* Workers
* Retries
* Idempotency
* Webhooks
* Concurrency control

### Production Engineering

* Security hardening
* Logging
* Environment configuration
* Testing
* Docker
* Deployment
* CI/CD
* Failure handling

---

## 🎯 Project Goals

The primary goal of this project is to understand how a backend evolves from:

```text
Simple CRUD API
       ↓
Business Logic
       ↓
Authentication
       ↓
Transactions & Concurrency
       ↓
External Services
       ↓
Real-Time Communication
       ↓
Caching
       ↓
Background Processing
       ↓
Testing
       ↓
Production System
```

Rather than adding technologies for the sake of the tech stack, each technology is introduced to solve a specific engineering problem.

---

## 📈 Development Roadmap

* [x] Project foundation
* [x] Authentication & authorization
* [x] Category management
* [x] Product catalog
* [x] Product image management
* [x] Cart system
* [ ] Checkout & order creation
* [ ] Inventory concurrency
* [ ] Customer order management
* [ ] Real-time order updates
* [ ] Admin real-time dashboard events
* [ ] Payment integration
* [ ] Payment webhooks
* [ ] Reviews & ratings
* [ ] Redis
* [ ] Background jobs & queues
* [ ] Automated testing
* [ ] Docker
* [ ] Production deployment
* [ ] CI/CD
* [ ] Monitoring & logging improvements

---

## 🔮 Future Improvements

Potential future improvements include:

* Advanced product recommendations
* Distributed locking where justified
* Advanced analytics
* Search engine integration
* Order history optimization
* Notification service
* Email/SMS notification pipelines
* More granular inventory reservations
* Observability and metrics
* Horizontal scaling

---

## 👨‍💻 Author

**Rohit**

Backend-focused developer building projects to understand real-world software engineering concepts through implementation.

---

## ⭐ Project Philosophy

> **Build the feature. Understand the problem. Introduce the technology only when it solves that problem.**

This project is being developed incrementally to understand not only **how to build an e-commerce backend**, but also **how backend systems behave under real-world conditions.**
