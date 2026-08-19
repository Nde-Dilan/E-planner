# Frontend Integration - Quick Reference

## 🚀 Quick Start (5 mins)

### 1. Import Component
```tsx
import { VendorCatalog } from './components/VendorCatalog';

export default function App() {
  return <VendorCatalog />;
}
```

### 2. Configure Tailwind
```js
// tailwind.config.js
export default {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  // ... rest of config
};
```

### 3. Set Environment
```bash
REACT_APP_API_URL=http://localhost:3000/api
```

### 4. Run
```bash
npm run dev
```

## 📦 File Locations

```
src/
├── components/
│   ├── VendorCatalog.tsx    ← Main component (use this)
│   ├── VendorCard.tsx
│   ├── QuoteModal.tsx
│   └── README.md
├── hooks/
│   └── useVendors.ts         ← For custom integrations
├── services/
│   └── vendor.api.ts         ← API client
├── i18n/
│   └── vendors.ts            ← Translations
└── types/
    └── vendors.ts            ← Frontend types
```

## 🎨 Design Tokens

```
Primary:    #006837 (Emerald Green)
Accent:     #D4AF37 (Gold)
Light BG:   #F8F9FA
Dark BG:    #121826
Font:       Plus Jakarta Sans (titles), Inter (body)
```

## 💻 Component Props

### VendorCatalog
```tsx
// No props required - self-contained
<VendorCatalog />
```

### VendorCard
```tsx
<VendorCard
  vendor={vendor}
  onQuoteClick={(vendorId) => { ... }}
  language="fr"  // or "en"
/>
```

### QuoteModal
```tsx
<QuoteModal
  isOpen={true}
  vendorId="vendor-uuid"
  vendorName="Restaurant Name"
  onClose={() => { ... }}
  language="fr"
  onSuccess={() => { ... }}
/>
```

## 🪝 useVendors Hook

```tsx
const { vendors, loading, error, pagination, search, reset } = useVendors();

// Search with filters
await search({
  category: 'caterer',
  city: 'Douala',
  minPrice: 100000,
  maxPrice: 500000,
  page: 1,
  limit: 20,
});

// Reset to default
reset();
```

## 🌐 API Functions

```tsx
import { searchVendors, getVendorById, requestQuote } from './services/vendor.api';

// Search
const result = await searchVendors({ city: 'Douala', limit: 20 });
// Returns: { items: Vendor[], pagination: PaginationMeta }

// Get one vendor
const vendor = await getVendorById('vendor-id');
// Returns: Vendor

// Request quote
await requestQuote('vendor-id', {
  clientName: 'John',
  contact: '+237612345678',
  message: 'Need catering for 100 guests',
  eventType: 'Wedding',
});
// Returns: { success: true }
```

## 🌙 Dark Mode

```tsx
// In VendorCatalog, toggle with button:
// Button state controls: className={darkMode ? 'dark' : ''}

// In your app, wrap with provider:
<div className={darkMode ? 'dark' : ''}>
  <VendorCatalog />
</div>

// In CSS, use dark: prefix
<div className="bg-white dark:bg-gray-900">Content</div>
```

## 🌍 Translations

```tsx
import { vendorTranslations } from './i18n/vendors';

const t = vendorTranslations['fr'];
console.log(t.catalog.title);        // "Nos Prestataires"
console.log(t.quote.submit);         // "Envoyer la demande"
console.log(t.categories.caterer);   // "Traiteur"

// Sections available:
// - t.catalog
// - t.filters
// - t.categories
// - t.card
// - t.quote
// - t.controls
```

## ✅ Validation Rules

### Phone Format
```
Must start with +237
Exactly 13 characters total
Example: +237612345678 ✅
```

### Email Format
```
Standard RFC 5322
Example: user@example.com ✅
```

### Quote Form Fields
```
clientName:  2-100 chars
contact:     Email or +237 phone
message:     10-1000 chars
eventType:   1-100 chars (non-empty)
```

## 🛠️ Common Tasks

### Add to Page/Route
```tsx
// App.tsx or route file
import { VendorCatalog } from './components/VendorCatalog';

export function VendorsPage() {
  return (
    <div>
      <h1>Event Vendors</h1>
      <VendorCatalog />
    </div>
  );
}
```

### Fetch Specific Vendor
```tsx
import { getVendorById } from './services/vendor.api';

async function loadVendor(id: string) {
  try {
    const vendor = await getVendorById(id);
    console.log(vendor.name); // "Caterername"
  } catch (error) {
    console.error('Failed to load vendor:', error.message);
  }
}
```

### Filter by Category Only
```tsx
const { search } = useVendors();
await search({ category: 'caterer' });
```

### Switch Language
```tsx
const [language, setLanguage] = useState<'fr' | 'en'>('fr');

// Toggle on button click
<button onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}>
  {language === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
</button>
```

### Handle Quote Submission Error
```tsx
try {
  await requestQuote(vendorId, formData);
} catch (error) {
  if (error.message.includes('429')) {
    console.log('Rate limited - too many requests');
  } else if (error.message.includes('404')) {
    console.log('Vendor not found');
  } else {
    console.log('Error:', error.message);
  }
}
```

## 📱 Responsive Breakpoints

Components use Tailwind breakpoints:
- **Mobile:** Default (< 640px)
- **Tablet:** `md:` (640px - 1024px)
- **Desktop:** `lg:` (1024px+)

```tsx
// Example responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {vendors.map(v => <VendorCard key={v.id} {...} />)}
</div>
```

## 🎯 Feature Matrix

| Feature | Implemented | Notes |
|---------|------------|-------|
| Search & filter | ✅ | By category, city, price, rating |
| Pagination | ✅ | Smart page buttons |
| Bilingual (FR/EN) | ✅ | Language toggle |
| Dark mode | ✅ | Theme toggle in header |
| Form validation | ✅ | Client-side, field-level errors |
| Phone/email validation | ✅ | +237 and RFC 5322 support |
| Rate limit handling | ✅ | 429 error with friendly message |
| Responsive design | ✅ | Mobile-first, tested on tablet/desktop |
| Accessibility | ✅ | ARIA labels, semantic HTML, WCAG AA |
| TypeScript | ✅ | Full strict mode typing |
| Error handling | ✅ | API, validation, network errors |

## 🚨 Troubleshooting

### Styles not showing
```
1. Check Tailwind config darkMode: 'class'
2. Ensure @tailwind directives in CSS
3. Restart dev server
```

### Dark mode not working
```
1. Verify parent div has class="dark"
2. Check Tailwind darkMode config
3. Inspect CSS in DevTools
```

### API errors
```
1. Check REACT_APP_API_URL in .env.local
2. Verify backend running on correct port
3. Check Network tab in DevTools
```

### Type errors
```
1. Run: npm run type-check
2. Check tsconfig.json includes src/
3. Verify src/shared/types.ts exists
```

## 📚 Documentation Files

- **`FRONTEND_SETUP.md`** - Complete setup guide
- **`FRONTEND_INTEGRATION.md`** - Implementation summary
- **`src/components/README.md`** - Component documentation
- **`QUICK_REFERENCE.md`** - This file

## 🔗 API Endpoints

```
GET  /api/vendors                    List vendors with filters
GET  /api/vendors/:id                Get single vendor
POST /api/vendors/:id/quote          Submit quote request
```

## 🎁 Bonus: Theme Provider Pattern

```tsx
// context/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';

type ThemeContextType = {
  darkMode: boolean;
  language: 'fr' | 'en';
  toggleDarkMode: () => void;
  setLanguage: (lang: 'fr' | 'en') => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  return (
    <ThemeContext.Provider value={{ darkMode, language, toggleDarkMode: () => setDarkMode(!darkMode), setLanguage }}>
      <div className={darkMode ? 'dark' : ''}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

Then use in VendorCatalog:
```tsx
const { darkMode, toggleDarkMode, language, setLanguage } = useTheme();
```

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** ✅ Production Ready
