# Dashboard de Finanzas Personales

Aplicación web completa para gestión de finanzas personales con arquitectura preparada para SaaS multi-tenant.

## Stack Tecnológico

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router DOM
- Axios
- Chart.js + react-chartjs-2
- React Hook Form + Zod
- SweetAlert2, React Toastify
- jsPDF + SheetJS (xlsx)
- Lucide React

### Backend
- Node.js + Express.js
- MongoDB Atlas + Mongoose
- JWT (jsonwebtoken) + bcryptjs
- express-validator
- Nodemailer
- Helmet, CORS, express-rate-limit

## Estructura del Proyecto

```
proyecto/
├── docs/                 # Documentación SDD
│   ├── spec.md          # Especificación funcional y técnica
│   ├── architecture.md  # Arquitectura del sistema
│   ├── database.md      # Modelos MongoDB
│   ├── api.md           # Endpoints REST
│   ├── security.md      # Auth, RBAC, Multi-tenancy
│   └── implementation-plan.md  # Plan de fases
├── backend/             # API REST
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── templates/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── .env.example
│   └── package.json
└── frontend/            # SPA React
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── pages/
    │   ├── layouts/
    │   ├── hooks/
    │   ├── context/
    │   ├── services/
    │   ├── routes/
    │   ├── utils/
    │   ├── validators/
    │   ├── styles/
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.example
    └── package.json
```

## Funcionalidades Principales

- 🔐 **Autenticación completa**: Registro, login, logout, recuperación de contraseña por email
- 📊 **Dashboard financiero**: Saldo, ingresos/gastos, balance, comparativas, gráficos interactivos
- 💰 **Gestión de movimientos**: CRUD ingresos/gastos con categorías, cuentas, fechas, notas
- 🏷️ **Categorías**: Personalizables por tipo (ingreso/gasto), color, icono
- 🏦 **Cuentas**: Efectivo, banco, ahorros, tarjetas débito/crédito con saldos calculados
- 📈 **Historial y filtros**: Búsqueda, filtros múltiples, paginación, ordenamiento
- 🎯 **Presupuestos**: Mensuales por categoría con alertas visuales (80/90/100%)
- 📄 **Reportes y exportación**: PDF (jsPDF) y Excel (SheetJS) con filtros aplicados
- 📊 **Gráficos**: Barras, doughnut, líneas, comparativas mensuales
- 🛡️ **Seguridad**: JWT, RBAC (USER/ADMIN), rate limiting, validación, aislamiento multi-usuario
- 📱 **Responsive**: Mobile, tablet, desktop con dark mode

## Requisitos Previos

- Node.js 18+
- MongoDB Atlas account
- SMTP server para emails (Gmail, SendGrid, etc.)

## Instalación Rápida

```bash
# Backend
cd backend
cp .env.example .env
# Editar .env con tus credenciales
npm install
npm run dev

# Frontend (en otra terminal)
cd frontend
cp .env.example .env
# Editar VITE_API_URL
npm install
npm run dev
```

## Variables de Entorno

### Backend (`.env`)
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/finanzas
JWT_SECRET=tu-secret-256-bit
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password
EMAIL_FROM=Finanzas App <noreply@tudominio.com>
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3000/api/v1
```

## Scripts Disponibles

### Backend
```bash
npm run dev      # Desarrollo con nodemon
npm start        # Producción
npm test         # Tests (Jest + Supertest)
npm run lint     # ESLint
npm run format   # Prettier
```

### Frontend
```bash
npm run dev      # Vite dev server
npm run build    # Build producción
npm run preview  # Preview build
npm test         # Tests (Vitest)
npm run lint     # ESLint
```

## Documentación

Ver carpeta `docs/` para especificaciones completas:
- [Especificación](docs/spec.md)
- [Arquitectura](docs/architecture.md)
- [Base de Datos](docs/database.md)
- [API](docs/api.md)
- [Seguridad](docs/security.md)
- [Plan de Implementación](docs/implementation-plan.md)

## Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# E2E (cuando implementado)
cd frontend && npm run test:e2e
```

## Despliegue

### Backend
- Node.js process manager (PM2) o Docker
- Variables de entorno en plataforma
- MongoDB Atlas connection string
- Health checks: `GET /health`, `GET /health/ready`

### Frontend
- Build estático: `npm run build` → `dist/`
- Desplegar en Vercel, Netlify, Cloudflare Pages, Nginx
- Configurar `VITE_API_URL` a URL producción del backend

## Licencia

Proyecto académico - Dashboard de Finanzas Personales