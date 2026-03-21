# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fitness e-commerce backend API built with NestJS, TypeORM, and PostgreSQL. The platform sells fitness supplements and equipment with features for customers, warehouse workers, and admins.

## Common Commands

```bash
npm run start:dev       # Development with hot reload
npm run build           # Production build
npm run start:prod      # Run production build
npm run lint            # ESLint with auto-fix
npm run format          # Prettier formatting
npm run test            # Run unit tests (Jest)
npm run test:e2e        # Run e2e tests
```

## Architecture

### Module Structure
Each feature follows NestJS module pattern in `src/modules/`:
- `*.module.ts` - Module definition with imports/providers/exports
- `*.controller.ts` - HTTP endpoints
- `*.service.ts` - Business logic
- `entities/*.entity.ts` - TypeORM entities
- `dto/*.dto.ts` - Request/response DTOs with class-validator decorators

### Core Modules
- **auth**: JWT authentication with Passport, login/register endpoints
- **user**: User CRUD, linked to profiles/orders/cart/addresses/wishlist
- **product**: Product catalog with categories (many-to-many), tags, images
- **order**: Order lifecycle (pending → confirmed → shipped → delivered/cancelled)
- **cart**: Shopping cart with cart items per user
- **coupon**: Discount codes (percentage or fixed amount)
- **admin**: Statistics/revenue reporting (admin-only)
- **payment**: VietQR payment with MB Bank integration and Redis transaction tracking

### Authentication & Authorization
- JWT strategy in `src/modules/auth/strategies/jwt.strategy.ts`
- Role-based guard in `src/modules/auth/guards/roles.guard.ts`
- Three roles: `customer`, `admin`, `warehouse_worker` (see `src/common/enums/user-role.enum.ts`)
- Use `@Roles(UserRole.ADMIN)` decorator + `RolesGuard` for protected endpoints
- Use `@CurrentUser()` decorator to get authenticated user in controllers

### Database
- PostgreSQL with TypeORM (auto-sync enabled in non-production)
- Entities auto-loaded via `autoLoadEntities: true`
- Data seeding runs on startup via `SeedModule` when database is empty
- Config in `src/config/database.config.ts`, env vars: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`

### API Structure
- Global prefix: `/api`
- Swagger docs: `/api/docs`
- ValidationPipe enabled globally with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`

### External Services
- **Cloudinary**: Image uploads (`src/modules/cloudinary/`)
- **Nodemailer**: Email service (`src/modules/mail/`)
- **Redis**: Transaction code caching for payment verification
- **VietQR**: QR code generation for bank transfers
- **MB Bank API**: Transaction history verification

## Environment Variables

Copy `.env.example` to `.env`. Key variables:
- `DB_*`: PostgreSQL connection
- `JWT_SECRET`, `JWT_EXPIRATION`: Auth tokens
- `APP_PORT`: Server port (default 3000)
- `NODE_ENV`: development/production
- `REDIS_*`: Redis connection for payment transaction caching
- `MB_USERNAME`, `MB_PASSWORD`, `MB_ACCOUNT_NO`, `MB_CODE`: MB Bank API credentials
- `WEBHOOK_SECRET`: Secret for validating payment webhooks

## Seeded Test Accounts

When database is empty, seeder creates:
- Admin: `admin@fitness.com` / `Admin@123456` (configurable via `ADMIN_EMAIL`, `ADMIN_PASSWORD` env vars)
- Warehouse: `warehouse@fitness.com` / `Warehouse@123`
- Customers: `nguyenvana@gmail.com`, `tranthib@gmail.com`, `levanc@gmail.com` / `Customer@123`
