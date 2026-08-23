# Vendors Module - Frontend Integration Guide

## Overview

Complete frontend implementation for the E-Planner CMR Vendors module with full TypeScript support, bilingual i18n (FR/EN), and dark/light mode themes.

## Design Tokens

```
Primary: Emerald Green (#006837)
Accent: Gold (#D4AF37)
Dark BG: #121826
Light BG: #F8F9FA
Typography: Plus Jakarta Sans (titles), Inter (body)
```

## File Structure

```
src/
├── components/
│   ├── VendorCatalog.tsx      # Main catalog with filters & controls
│   ├── VendorCard.tsx         # Individual vendor card
│   ├── QuoteModal.tsx         # Quote request form modal
│   └── README.md              # This file
├── hooks/
│   └── useVendors.ts          # State management hook
├── services/
│   └── vendor.api.ts          # Typed API client
├── i18n/
│   └── vendors.ts             # FR/EN translations
├── types/
│   └── vendors.ts             # Frontend type definitions
└── shared/
    └── types.ts               # Backend types (imported)
```

## Component Usage

### 1. VendorCatalog (Main Component)

Entry point for the vendors module. Manages all state including filters, language, theme, and modal states.

**Features:**
- Dynamic filtering by category, city, price range, and rating
- Pagination with smart page buttons
- Language toggle (FR/EN)
- Dark/Light mode toggle
- Quote modal integration
- Error and loading states

**Usage:**
```tsx
import { VendorCatalog } from './components/VendorCatalog';

export default function VendorsPage() {
  return <VendorCatalog />;
}
```

### 2. VendorCard (Reusable)

Displays a single vendor with rating, price range, and quote button.

**Props:**
```tsx
interface VendorCardProps {
  vendor: Vendor;
  onQuoteClick: (vendorId: string) => void;
  language: Language;
}
```

**Features:**
- Category icon display
- Star rating visualization
- Price range highlight
- Responsive design
- Dark mode support

### 3. QuoteModal (Reusable)

Form modal for requesting quotes with full validation.

**Props:**
```tsx
interface QuoteModalProps {
  isOpen: boolean;
  vendorId: string;
  vendorName: string;
  onClose: () => void;
  language: Language;
  onSuccess: () => void;
}
```

**Features:**
- Client-side validation
- Phone number (+237) and email validation
- Field-level error messages
- Rate limit error handling (429)
- Bilingual error messages
- Loading state

## Hooks

### useVendors

Custom hook for managing vendor search state and API calls.

**Returns:**
```tsx
{
  vendors: Vendor[];
  loading: boolean;
  error: string | null;
  pagination: PaginationMeta | null;
  search: (params?: Partial<VendorExtendedSearchParams>) => Promise<void>;
  reset: () => void;
}
```

**Usage:**
```tsx
const { vendors, loading, error, search } = useVendors();

// Apply filters
await search({ category: 'caterer', city: 'Douala' });
```

## Services

### vendor.api.ts

Typed API client with three main functions:

#### searchVendors(params?)

```tsx
const result = await searchVendors({
  category: 'caterer',
  city: 'Douala',
  minPrice: 100000,
  maxPrice: 500000,
  page: 1,
  limit: 20,
});
// Returns: PaginatedResponse<Vendor>
```

#### getVendorById(vendorId)

```tsx
const vendor = await getVendorById('uuid-here');
// Returns: Vendor
```

#### requestQuote(vendorId, payload)

```tsx
await requestQuote('vendor-uuid', {
  clientName: 'John Doe',
  contact: '+237612345678',
  message: 'I need catering for 100 guests',
  eventType: 'Wedding',
});
// Returns: { success: boolean }
```

## i18n (Translations)

### vendorTranslations Object

Structure:
```tsx
vendorTranslations = {
  fr: {
    catalog: { ... },
    filters: { ... },
    categories: { ... },
    card: { ... },
    quote: { ... },
    controls: { ... },
  },
  en: {
    // Same structure as fr
  },
};
```

### Usage

```tsx
import { vendorTranslations } from '../i18n/vendors';

const t = vendorTranslations['fr'];
console.log(t.catalog.title); // "Nos Prestataires"
```

## Dark Mode Implementation

Dark mode uses Tailwind's `dark:` prefix classes. The theme state is managed locally in VendorCatalog.

**Tailwind Config Required:**
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  // ... rest of config
};
```

**Example:**
```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>
```

## Form Validation

### Phone Validation
- Format: `+237` followed by exactly 9 digits
- Example: `+237612345678` ✅

### Email Validation
- Standard RFC 5322 pattern
- Example: `user@example.com` ✅

### Quote Form Fields
- `clientName`: 2-100 characters
- `contact`: Valid email or +237 phone
- `message`: 10-1000 characters
- `eventType`: Non-empty, max 100 characters

## Error Handling

### API Errors

The API client throws descriptive errors:
- **400 VALIDATION_ERROR**: Form validation failed (field details in response)
- **404 VENDOR_NOT_FOUND**: Vendor doesn't exist
- **429 RATE_LIMIT_EXCEEDED**: Quote rate limit (20 per 15 min)
- **401 UNAUTHORIZED**: Missing auth token (admin routes only)

**Handling:**
```tsx
try {
  await requestQuote(vendorId, formData);
} catch (err) {
  if (err.message.includes('429')) {
    setError('Too many requests. Try again later.');
  } else {
    setError(err.message);
  }
}
```

## Styling Guide

### Color Usage

**Primary (Emerald Green #006837):**
- Main buttons
- Header backgrounds
- Active states
- Hover effects on key elements

**Accent (Gold #D4AF37):**
- Highlights (currently not used in default theme, available for future use)
- Rating stars (using amber-400 for better contrast)

**Backgrounds:**
- Light mode: #F8F9FA (via Tailwind `slate-50`)
- Dark mode: #121826 (via Tailwind `slate-900`)

### Typography

**Titles:** Plus Jakarta Sans (applies via CSS class or global font config)
**Body:** Inter (applies via CSS class or global font config)

```tsx
<h1 className="font-bold text-4xl">Title</h1>  // Plus Jakarta Sans
<p className="text-base">Body text</p>           // Inter
```

## Environment Variables

**Required in `.env.local` or `.env`:**
```
REACT_APP_API_URL=http://localhost:3000/api
```

## Performance Considerations

1. **useVendors Hook**: Caches initial load and only fetches on filter changes
2. **VendorCard**: Memoizable with React.memo if needed for large lists
3. **Pagination**: Client-side filtering + server-side pagination
4. **Lazy Loading**: QuoteModal is only rendered when needed

## Testing Examples

### Unit Test - useVendors Hook
```tsx
it('should fetch vendors on mount', async () => {
  const { result } = renderHook(() => useVendors());
  await waitFor(() => {
    expect(result.current.vendors.length).toBeGreaterThan(0);
  });
});
```

### Integration Test - VendorCatalog
```tsx
it('should filter vendors by category', async () => {
  render(<VendorCatalog />);
  const categorySelect = screen.getByDisplayValue('Toutes les catégories');
  await userEvent.selectOption(categorySelect, 'caterer');
  // Assert filtered results appear
});
```

## Accessibility

All components include:
- Proper ARIA labels on buttons
- Semantic HTML (form, button, input)
- Keyboard navigation support
- High contrast colors (WCAG AA compliant)
- Error message associations with form fields

## Future Enhancements

1. **Favorites**: Add vendor favorites/wishlist
2. **Analytics**: Track view and quote request events
3. **Reviews**: Display vendor reviews inline
4. **Maps**: Integrate location map for vendor cities
5. **Notifications**: Toast notifications for form success
6. **Search**: Full-text search across vendor names/descriptions

---

**Module Status:** ✅ Complete with full backend API integration
**Last Updated:** 2024
**Compatibility:** React 18+, TypeScript 5+, Tailwind CSS 3+
