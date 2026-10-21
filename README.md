# FreshBasket — Online Grocery Market Platform

A hyperlocal multi-vendor e-commerce platform designed to digitize local market commerce (Final Year Computer Science Project, University of Nigeria, Nsukka).

## Architecture

This repository contains both the client application and server:

* **[`Frontend/`](./Frontend)** — React 19, Vite, Tailwind CSS v4, React Router, Lucide Icons
* **[`Backend/`](./Backend)** — Node.js, Express, PostgreSQL (`pg`), JWT, Cloudinary, Paystack

## Quick Setup

### 1. Backend Setup
```bash
cd Backend
npm install
cp .env.example .env
# Configure DATABASE_URL, JWT_SECRET, and optionally CLOUDINARY_* & PAYSTACK_SECRET_KEY in .env

# Initialize DB schema and seed initial admin
npm run db:init
npm run db:seed-admin

# Start development server
npm run dev
```

### 2. Frontend Setup
```bash
cd Frontend
npm install
cp .env.example .env
# Set VITE_API_BASE_URL (defaults to http://localhost:5000)

# Start Vite development server
npm run dev
```

