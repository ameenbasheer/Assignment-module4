# E-commerce Backend

A secure, scalable e-commerce REST API built with **Node.js, Express & MongoDB**.
It features JWT authentication, role-based access control (RBAC), full CRUD for
products / orders / user profiles, product search & filtering, and an
**AI-powered product recommendation system using the Hugging Face Inference API**
(used in place of RapidMiner).

## Features

- **Authentication & Authorization** — JWT tokens + `bcryptjs` password hashing.
- **RBAC** — `admin`, `user`, `guest` roles enforced by middleware.
- **CRUD APIs** — Products, Orders and User Profiles with validation & centralized error handling.
- **Search / Filter / Sort** — products by name, category and price range, with pagination.
- **Predictive Analytics** — content-based product recommendations powered by
  Hugging Face sentence-similarity, with a graceful category-based fallback.
- **Security** — password hashing, JWT lifecycle, `select:false` on passwords,
  server-side validation and admin-only protected routes.

## Tech Stack

Node.js · Express · MongoDB (Mongoose) · JWT · bcryptjs · Hugging Face Inference API

## Project Structure

```
.
├── server.js                 # Entry point (loads env, connects DB, starts server)
├── app.js                    # Express app, middleware & route mounting
├── config/
│   └── db.js                 # MongoDB connection
├── models/                   # Mongoose schemas: user, product, order
├── controllers/              # Request handlers (auth, product, order, profile, analytics)
├── routes/                   # Route definitions per resource
├── middlewares/
│   ├── authMiddleware.js     # protect (JWT) + authorize (RBAC)
│   └── errorHandler.js       # 404 + centralized error handler
├── services/
│   ├── huggingfaceService.js # Hugging Face Inference API wrapper
│   └── recommendationService.js # Recommendation logic + fallback
└── utils/                    # asyncHandler, generateToken
```

## Setup

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev            # start with nodemon
# or
npm start
```

### Environment variables (`.env`)

| Variable              | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `PORT`                | Server port (default 5000)                             |
| `MONGO_URI`           | MongoDB connection string                              |
| `JWT_SECRET`          | Secret used to sign JWTs                                |
| `JWT_EXPIRES_IN`      | Token lifetime (e.g. `1d`)                             |
| `HUGGINGFACE_API_KEY` | Hugging Face token — get one free at huggingface.co    |
| `HF_MODEL`            | Embedding model (default `all-MiniLM-L6-v2`)           |

> If `HUGGINGFACE_API_KEY` is empty, recommendations still work using a
> category-overlap heuristic fallback.

## API Endpoints

### Auth — `/api/auth`
| Method | Path      | Access | Description                |
| ------ | --------- | ------ | -------------------------- |
| POST   | `/signup` | Public | Register (returns JWT)     |
| POST   | `/login`  | Public | Login (returns JWT)        |

> Self-registration as `admin` is blocked; admins are promoted by an existing admin.

### Products — `/api/products`
| Method | Path     | Access | Description                        |
| ------ | -------- | ------ | ---------------------------------- |
| GET    | `/`      | Public | List + search/filter/sort/paginate |
| GET    | `/:id`   | Public | Get one product                    |
| POST   | `/`      | Admin  | Create product                     |
| PUT    | `/:id`   | Admin  | Update product                     |
| DELETE | `/:id`   | Admin  | Delete product                     |

**Query params:** `search`, `category`, `minPrice`, `maxPrice`, `sort` (e.g. `-price`), `page`, `limit`.
Example: `GET /api/products?search=phone&category=electronics&minPrice=100&sort=-price&page=1&limit=10`

### Orders — `/api/orders` (all require auth)
| Method | Path           | Access        | Description                       |
| ------ | -------------- | ------------- | --------------------------------- |
| POST   | `/`            | User/Admin    | Place order (validates stock)     |
| GET    | `/`            | User/Admin    | List own orders (admin: all)      |
| GET    | `/:id`         | Owner/Admin   | Get one order                     |
| PUT    | `/:id/status`  | Admin         | Update order status               |
| DELETE | `/:id`         | Owner/Admin   | Delete/cancel order               |

### Users — `/api/users`
| Method | Path           | Access  | Description            |
| ------ | -------------- | ------- | ---------------------- |
| GET    | `/profile`     | Private | Get own profile        |
| PUT    | `/profile`     | Private | Update own profile     |
| DELETE | `/profile`     | Private | Delete own account     |
| GET    | `/`            | Admin   | List all users         |
| GET    | `/:id`         | Admin   | Get a user             |
| PUT    | `/:id/role`    | Admin   | Change a user's role   |
| DELETE | `/:id`         | Admin   | Delete a user          |

### Analytics — `/api/analytics`
| Method | Path                            | Access  | Description                          |
| ------ | ------------------------------- | ------- | ------------------------------------ |
| GET    | `/recommendations`              | Private | Personalised recommendations         |
| GET    | `/recommendations/product/:id`  | Public  | Similar products to a given product   |

Send the JWT as `Authorization: Bearer <token>` on protected routes.

## How the recommendation engine works

1. Builds a "preference" sentence from the products a user has ordered.
2. Sends it with all candidate products to the Hugging Face
   `sentence-transformers/all-MiniLM-L6-v2` model, which returns a semantic
   similarity score per candidate.
3. Returns the top-N highest-scoring products the user hasn't bought yet.

Fallbacks: no purchase history → newest products; no API key / API error →
category-overlap heuristic. The response includes an `engine` field
(`huggingface` | `category-fallback` | `popular` | `none`) so you can see which path was used.
# Assignment-module4
