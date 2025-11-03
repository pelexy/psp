# PSP Dashboard - BuyPower Payment Service Provider

A modern, responsive dashboard for Payment Service Providers built with React, TypeScript, Vite, and Tailwind CSS v4.

## Features

- ✅ **Professional Login Page** - Split-screen design with brand showcase and stats
- ✅ **Forgot Password** - Complete password recovery flow with email confirmation
- ✅ **Sign Up Page** - Placeholder page for future registration
- ✅ **Responsive Layouts** - AuthLayout (split-screen) and AppLayout (dashboard)
- ✅ **BuyPower Green Theme** - Consistent brand colors matching the frontend app
- ✅ **TypeScript** - Full type safety
- ✅ **Modern UI Components** - Built with Radix UI and Tailwind CSS v4

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite 7** - Fast build tool and dev server
- **Tailwind CSS v4** - Next-generation CSS framework
- **React Router** - Client-side routing
- **Radix UI** - Accessible UI primitives
- **Lucide React** - Beautiful icons
- **Sonner** - Toast notifications

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start dev server (runs on http://localhost:5173)
npm run dev
```

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
psp/
├── src/
│   ├── components/
│   │   ├── layouts/     # Layout components
│   │   │   ├── AuthLayout.tsx    # Split-screen auth layout
│   │   │   └── AppLayout.tsx     # Dashboard layout with header
│   │   └── ui/          # Reusable UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── toaster.tsx
│   ├── pages/           # Page components
│   │   ├── Login.tsx           # Login with split-screen design
│   │   ├── SignUp.tsx          # Sign up placeholder
│   │   ├── ForgotPassword.tsx  # Password recovery
│   │   └── Dashboard.tsx       # Main dashboard
│   ├── lib/             # Utility functions
│   │   └── utils.ts     # cn() helper for classnames
│   ├── App.tsx          # Main app with routing
│   ├── main.tsx         # App entry point
│   └── index.css        # Global styles and design system
├── public/              # Static assets
├── index.html
├── package.json
├── vite.config.ts       # Vite + Tailwind v4 configuration
└── tsconfig.json
```

## Available Routes

- `/` - Login page (split-screen design)
- `/signup` - Sign up page (placeholder)
- `/forgot-password` - Password recovery
- `/dashboard` - Main dashboard (with AppLayout)

## Design System

The application uses BuyPower's brand colors:

### Primary Colors
- **Primary Green**: `hsl(82 50% 35%)` - Main brand color
- **Primary Hover**: `hsl(82 55% 30%)` - Darker shade for hover states
- **Primary Light**: `hsl(82 45% 45%)` - Lighter shade for accents

### Color Palette
- Background: White (`hsl(0 0% 100%)`)
- Foreground: Dark green (`hsl(140 10% 15%)`)
- Muted: Light gray (`hsl(0 0% 96%)`)
- Border: Light gray (`hsl(0 0% 90%)`)
- Destructive: Red for errors (`hsl(0 84% 60%)`)

## Next Steps

### API Integration
Connect the login and forgot password forms to your backend API:

1. **Login API** - Update `src/pages/Login.tsx`:
```typescript
const response = await fetch('YOUR_API_URL/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
```

2. **Forgot Password API** - Update `src/pages/ForgotPassword.tsx`:
```typescript
const response = await fetch('YOUR_API_URL/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email }),
});
```

### Authentication Context
Create an authentication context to manage user state across the application.

### Dashboard Features
Implement the full dashboard with:
- Customer management
- Invoice tracking
- Revenue analytics
- Transaction history
- Reports and exports

## Contributing

When adding new features:
1. Follow the existing code structure
2. Use TypeScript for type safety
3. Maintain the BuyPower design system colors
4. Ensure responsive design for all screen sizes

## License

Private - BuyPower Internal Project
