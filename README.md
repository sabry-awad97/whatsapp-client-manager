# Template App

A modern, full-stack TypeScript application for template app with a clean architecture following Domain-Driven Design principles.

## 🚀 Tech Stack

### Frontend

- **React 19** - Latest React with concurrent features
- **TanStack Router** - Type-safe file-based routing
- **TailwindCSS 4** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible component library
- **Tauri** - Native desktop application support
- **TanStack Query** - Powerful data synchronization

### Backend

- **Hono** - Ultra-fast web framework
- **tRPC** - End-to-end type-safe APIs
- **Prisma** - Next-generation TypeScript ORM
- **SQLite** - Lightweight, embedded database

### Development

- **Bun** - Fast all-in-one JavaScript runtime
- **Turborepo** - High-performance monorepo build system
- **TypeScript** - Type safety across the stack

## 📁 Project Structure

```
template-app/
├── apps/
│   ├── web/              # React web application
│   │   ├── src/
│   │   │   ├── routes/   # File-based routing
│   │   │   ├── components/
│   │   │   └── utils/
│   │   └── package.json
│   └── server/           # Hono + tRPC API server
│       ├── src/
│       │   └── index.ts
│       └── package.json
├── packages/
│   ├── api/              # tRPC routers & procedures
│   │   └── src/
│   │       └── routers/
│   ├── auth/             # Authentication logic
│   │   └── src/
│   ├── db/               # Prisma schema & client
│   │   ├── prisma/
│   │   └── src/
│   └── [shared packages]
└── package.json          # Workspace root
```

## 🛠️ Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.2.19 or higher
- Node.js 18+ (for compatibility)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd template-app
```

2. **Install dependencies**

```bash
bun install
```

3. **Set up environment variables**

Create `.env` files in the required directories:

**`apps/server/.env`**

```env
DATABASE_URL="file:./dev.db"
PORT=3000
```

**`apps/web/.env`**

```env
VITE_SERVER_URL=http://localhost:3000
```

4. **Initialize the database**

```bash
bun run db:push
```

5. **Start development servers**

```bash
bun run dev
```

This will start:

- Web app: [http://localhost:3001](http://localhost:3001)
- API server: [http://localhost:3000](http://localhost:3000)

## 📜 Available Scripts

### Root Commands

| Command               | Description                        |
| --------------------- | ---------------------------------- |
| `bun run dev`         | Start all apps in development mode |
| `bun run build`       | Build all applications             |
| `bun run check-types` | Type-check all packages            |

### Workspace-Specific Commands

| Command              | Description                      |
| -------------------- | -------------------------------- |
| `bun run dev:web`    | Start web app only               |
| `bun run dev:server` | Start API server only            |
| `bun run dev:native` | Start native app (if configured) |

### Database Commands

| Command               | Description                     |
| --------------------- | ------------------------------- |
| `bun run db:push`     | Push schema changes to database |
| `bun run db:studio`   | Open Prisma Studio              |
| `bun run db:generate` | Generate Prisma Client          |
| `bun run db:migrate`  | Run database migrations         |

### Desktop App (Tauri)

```bash
cd apps/web
bun run desktop:dev    # Development mode
bun run desktop:build  # Production build
```

## 🏗️ Architecture

This project follows **SOLID principles** and **Domain-Driven Design**:

- **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
- **Type Safety**: End-to-end TypeScript with tRPC
- **Workspace Organization**: Monorepo structure with shared packages
- **Dependency Injection**: Loose coupling via interfaces

### Package Responsibilities

- **`@template-app/api`** - Business logic, tRPC routers
- **`@template-app/auth`** - Authentication & authorization
- **`@template-app/db`** - Database schema, queries, migrations

## 🔧 Development Workflow

1. **Make changes** to your code
2. **Type-check** with `bun run check-types`
3. **Test locally** with `bun run dev`
4. **Build** with `bun run build`

## 📦 Building for Production

```bash
# Build all packages
bun run build

# Start production server
cd apps/server
bun run start
```

## 🤝 Contributing

Follow the coding standards defined in the project:

- Use TypeScript strict mode
- Follow SOLID principles
- Write clean, maintainable code
- Add types for all public APIs

## 📄 License

[Your License Here]
