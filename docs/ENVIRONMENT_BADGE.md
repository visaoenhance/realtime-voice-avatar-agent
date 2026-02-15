# Environment Badge Implementation

## Overview

A visual indicator in the header showing whether the app is using local or remote Supabase.

## Visual Design

### Local Environment
```
┌────────────────────────┐
│  🏠 LOCAL              │  ← Blue background (bg-blue-50)
└────────────────────────┘     Blue border (border-blue-200)
                               Blue text (text-blue-700)
```

### Remote Environment  
```
┌────────────────────────┐
│  ☁️ REMOTE             │  ← Purple background (bg-purple-50)
└────────────────────────┘     Purple border (border-purple-200)
                               Purple text (text-purple-700)
```

## Header Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Food Court   🏠 Local   📍 Orlando, FL   🎙️ Concierge   [Cart] │
│  ^^^^^^^^^^^  ^^^^^^^^^                                           │
│  Logo         Badge                                               │
└──────────────────────────────────────────────────────────────────┘
```

## Implementation

### Architecture

```
Server Component (page.tsx)
    ↓ reads process.env.SUPABASE_ENV
EnvironmentBadgeServer.tsx
    ↓ passes env prop
EnvironmentBadge.tsx (client)
    ↓ renders UI
Header
```

### Files

1. **components/EnvironmentBadge.tsx**
   - Client component
   - Receives `env` prop ('local' | 'remote')
   - Renders styled badge with emoji + text
   - Includes hover tooltip

2. **components/EnvironmentBadgeServer.tsx**
   - Server component
   - Reads `currentEnv` from `lib/supabaseConfig`
   - Passes env to client component

3. **app/food/components/LandingPageHeader.tsx**
   - Accepts `environmentBadge` prop (ReactNode)
   - Renders badge in header layout

4. **app/food/page.tsx**
   - Server page component
   - Imports `EnvironmentBadgeServer`
   - Passes badge to `LandingPageHeader`

## Usage

### Viewing Current Environment

The badge automatically displays based on `SUPABASE_ENV` in `.env.local`:

- **SUPABASE_ENV=local** → Shows "🏠 Local" (blue)
- **SUPABASE_ENV=remote** → Shows "☁️ Remote" (purple)

### Switching Environments

```bash
# Switch to remote
./scripts/switch-env.sh remote

# Restart dev server
npm run dev

# Badge now shows "☁️ Remote" in purple
```

```bash
# Switch back to local
./scripts/switch-env.sh local

# Restart dev server
npm run dev

# Badge now shows "🏠 Local" in blue
```

## Technical Details

### Styling

```tsx
// Local (blue)
className="bg-blue-50 text-blue-700 border border-blue-200"

// Remote (purple)
className="bg-purple-50 text-purple-700 border border-purple-200"
```

### Hover States

Both badges include tooltips:
- **Local**: "Using local Docker Supabase"
- **Remote**: "Using remote Supabase Cloud"

### Responsive Behavior

- Badge is always visible on all screen sizes
- Uses uppercase text with wide tracking for consistency with other header elements
- Compact size (10px font) to not dominate the header

## Benefits

✅ **Instant Visual Feedback** - Know which database you're using at a glance  
✅ **Prevents Mistakes** - Avoid accidentally modifying production data  
✅ **Demo-Friendly** - Clearly show which environment during presentations  
✅ **Debug Aid** - Quickly identify environment-related issues  

## Testing

Visit homepage and verify:
1. Badge appears in header next to logo
2. Badge shows correct environment (check `.env.local`)
3. Badge changes when switching environments
4. Tooltip appears on hover

## Future Enhancements

- [ ] Add badge to all pages (concierge, store pages, etc.)
- [ ] Add click handler to quickly copy environment details
- [ ] Show additional metadata (database URL, connection status)
- [ ] Add animation when switching environments
- [ ] Support more environments (staging, preview, etc.)

---

**Quick Reference**: The badge provides at-a-glance confirmation of which Supabase instance your app is connected to, preventing accidental production modifications during development.
