# Frontend Setup - Vendors Module Integration

## Quick Start

This guide walks you through setting up the Vendors module frontend integration in your React/TypeScript project.

## Prerequisites

- React 18+
- TypeScript 5+
- Tailwind CSS 3+
- Node.js 18+

## Installation & Configuration

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

Ensure your `package.json` includes:
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tailwindcss": "^3.0.0"
  }
}
```

### 2. Configure Tailwind for Dark Mode

Update your `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens from project-context.md
        emerald: {
          600: '#006837', // Primary color
          DEFAULT: '#006837',
        },
        gold: '#D4AF37',   // Accent
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Plus Jakarta Sans', 'serif'],
      },
      backgroundColor: {
        light: '#F8F9FA',
        dark: '#121826',
      },
    },
  },
  plugins: [],
};
```

### 3. Configure Environment Variables

Create `.env.local`:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api

# Optional: Set to 'development' for extra logging
REACT_APP_ENV=development
```

### 4. Import Global Styles

In your main `App.tsx` or root component:

```tsx
import './index.css';

function App() {
  return (
    // Your app content
  );
}
```

Ensure your `index.css` includes Tailwind directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Optional: Configure custom font stacks */
@layer base {
  html {
    @apply font-sans;
  }
  h1, h2, h3, h4, h5, h6 {
    @apply font-serif font-bold;
  }
}
```

## File Structure

After setup, your project should have:

```
src/
├── components/
│   ├── VendorCatalog.tsx
│   ├── VendorCard.tsx
│   ├── QuoteModal.tsx
│   └── README.md
├── hooks/
│   └── useVendors.ts
├── services/
│   └── vendor.api.ts
├── i18n/
│   └── vendors.ts
├── types/
│   └── vendors.ts
├── shared/
│   └── types.ts
├── App.tsx
├── index.css
└── index.tsx
```

## Usage Examples

### Basic Integration

In your main app or page:

```tsx
import { VendorCatalog } from './components/VendorCatalog';

export default function VendorsPage() {
  return <VendorCatalog />;
}
```

### Advanced: Custom Wrapper

```tsx
import { useState } from 'react';
import { VendorCatalog } from './components/VendorCatalog';

export default function VendorsSection() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <VendorCatalog />
    </div>
  );
}
```

### Custom API URL

The API URL defaults to `http://localhost:3000/api` but respects `REACT_APP_API_URL`:

```bash
# Run with custom API
REACT_APP_API_URL=https://api.example.com npm run dev
```

## Running the Application

### Development

```bash
npm run dev
# or
yarn dev
```

Your app should run on `http://localhost:5173` (Vite) or `http://localhost:3000` (CRA).

### Production Build

```bash
npm run build
npm run preview
```

## Testing

### Unit Tests (Jest + React Testing Library)

Example test file:

```tsx
// src/components/VendorCard.test.tsx
import { render, screen } from '@testing-library/react';
import { VendorCard } from './VendorCard';

describe('VendorCard', () => {
  it('displays vendor name and category', () => {
    const vendor = {
      id: '1',
      name: 'Test Caterer',
      category: 'caterer',
      city: 'Douala',
      priceRange: '100000 - 500000 XAF',
      rating: 4.5,
    };

    render(
      <VendorCard
        vendor={vendor}
        onQuoteClick={jest.fn()}
        language="fr"
      />
    );

    expect(screen.getByText('Test Caterer')).toBeInTheDocument();
  });
});
```

Run tests:

```bash
npm test
```

## API Integration

The `vendor.api.ts` client automatically:
- Constructs query parameters from filter objects
- Handles JSON serialization
- Throws descriptive errors
- Respects `REACT_APP_API_URL`

**Example API calls:**

```tsx
import { searchVendors, getVendorById, requestQuote } from './services/vendor.api';

// Search with filters
const result = await searchVendors({
  category: 'caterer',
  city: 'Douala',
  minPrice: 100000,
  maxPrice: 500000,
  page: 1,
  limit: 20,
});

// Get single vendor
const vendor = await getVendorById('vendor-id');

// Request quote
await requestQuote('vendor-id', {
  clientName: 'John Doe',
  contact: '+237612345678',
  message: 'Quote request for 100 guests',
  eventType: 'Wedding',
});
```

## Dark Mode Behavior

Dark mode is controlled locally in the `VendorCatalog` component. To integrate with a global theme provider:

```tsx
// context/ThemeContext.tsx
import { createContext, useContext } from 'react';

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        toggleDarkMode: () => setDarkMode(!darkMode),
      }}
    >
      <div className={darkMode ? 'dark' : ''}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

## Troubleshooting

### Tailwind styles not applying

1. Check `tailwind.config.js` includes your file paths
2. Ensure `@tailwind` directives in `index.css`
3. Restart dev server after config changes

### Dark mode not working

1. Verify `darkMode: 'class'` in `tailwind.config.js`
2. Check parent `<div>` has `class="dark"` attribute
3. Inspect CSS in browser DevTools

### API errors (CORS, 404, etc.)

1. Ensure backend server is running on correct port
2. Check `REACT_APP_API_URL` environment variable
3. Verify backend CORS policy allows frontend origin
4. Check network tab in DevTools for actual request/response

### TypeScript errors

1. Ensure `src/shared/types.ts` is accessible
2. Run `npm run type-check` to validate types
3. Check `tsconfig.json` includes `src` directory

## Performance Optimization

### Memoization (if needed)

```tsx
import { memo } from 'react';
import { VendorCard } from './VendorCard';

export const VendorCardMemo = memo(VendorCard, (prev, next) => {
  return prev.vendor.id === next.vendor.id && prev.language === next.language;
});
```

### Code Splitting

```tsx
import { lazy, Suspense } from 'react';

const VendorCatalog = lazy(() => import('./components/VendorCatalog'));

export default function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VendorCatalog />
    </Suspense>
  );
}
```

## Deployment

### Vercel

```bash
vercel deploy --prod
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## Support & Documentation

- **Backend API Docs**: See `src/modules/vendors/vendor.router.ts`
- **Component Docs**: See `src/components/README.md`
- **Type Definitions**: See `src/shared/types.ts`
- **Design Tokens**: See `.kiro/steering/project-context.md`

---

**Setup Version:** 1.0
**Last Updated:** 2024
**Status:** ✅ Ready for production
