# LoadingAnimation Component

A modern, animated loading component with multiple variants for different use cases.

## Features

- 🎨 **4 Variants**: Default spinner, Sparkle, Pulse, and Dots
- 📏 **3 Sizes**: Small, Medium, and Large
- 🎭 **Smooth Animations**: Built with Framer Motion
- 🎯 **Flexible**: Works inline, in sections, or as full-screen overlay
- 💅 **Beautiful**: Gradient backgrounds and modern design

## Installation

The component is already set up in your project. Just import it:

```tsx
import {
  LoadingAnimation,
  LoadingOverlay,
  LoadingSection,
} from '@/components/ui/loading-animation';
```

## Variants

### 1. Default (Spinner)

Simple rotating loader - good for generic loading states.

```tsx
<LoadingAnimation message="Loading..." variant="default" size="md" />
```

### 2. Sparkle ✨ (Recommended)

Rotating gradient circle with sparkle icon - best for important operations.

```tsx
<LoadingAnimation message="Checking system status..." variant="sparkle" size="lg" />
```

### 3. Pulse

Expanding rings animation - great for background operations.

```tsx
<LoadingAnimation message="Syncing..." variant="pulse" size="md" />
```

### 4. Dots

Bouncing dots - minimal and perfect for inline loading.

```tsx
<LoadingAnimation message="Processing..." variant="dots" size="sm" />
```

## Sizes

- `sm`: Small (w-6 h-6) - For inline or compact spaces
- `md`: Medium (w-10 h-10) - Default, works in most cases
- `lg`: Large (w-16 h-16) - For full-page or prominent loading states

## Components

### LoadingAnimation

Basic loading animation component.

```tsx
<LoadingAnimation message="Loading data..." variant="sparkle" size="md" />
```

**Props:**

- `message?: string` - Optional loading message
- `variant?: 'default' | 'sparkle' | 'pulse' | 'dots'` - Animation style (default: 'default')
- `size?: 'sm' | 'md' | 'lg'` - Size of the animation (default: 'md')

### LoadingOverlay

Full-screen loading overlay with backdrop blur.

```tsx
<LoadingOverlay message="Loading your workspace..." variant="sparkle" />
```

**Props:**

- `message?: string` - Optional loading message
- `variant?: 'default' | 'sparkle' | 'pulse' | 'dots'` - Animation style (default: 'sparkle')

### LoadingSection

Loading state for content sections.

```tsx
<LoadingSection message="Loading content..." variant="dots" className="min-h-[400px]" />
```

**Props:**

- `message?: string` - Optional loading message
- `variant?: 'default' | 'sparkle' | 'pulse' | 'dots'` - Animation style (default: 'dots')
- `className?: string` - Additional CSS classes

## Usage Examples

### Full-Page Loading (Initial Load)

```tsx
if (isLoading) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/30">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/60 p-12">
        <LoadingAnimation message="Loading settings..." variant="sparkle" size="lg" />
      </div>
    </div>
  );
}
```

### Section Loading

```tsx
<div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm">
  {isLoading ? (
    <LoadingAnimation message="Checking system status..." variant="sparkle" size="md" />
  ) : (
    <YourContent />
  )}
</div>
```

### Modal/Overlay Loading

```tsx
{
  isProcessing && <LoadingOverlay message="Processing your request..." variant="pulse" />;
}
```

### Inline Loading

```tsx
<div className="flex items-center gap-3">
  <LoadingAnimation variant="dots" size="sm" />
  <span>Saving changes...</span>
</div>
```

## When to Use Each Variant

### Sparkle ✨

- Initial page loads
- Authentication checks
- Important system operations
- Configuration loading
- **Example**: Settings page, Dashboard session check

### Pulse

- Background sync operations
- Real-time updates
- Continuous monitoring
- Long-running processes
- **Example**: File uploads, Data synchronization

### Dots

- Inline loading states
- Form submissions
- Quick operations
- Button loading states
- **Example**: Save buttons, Search inputs

### Default

- Generic loading states
- When you need a simple spinner
- Fallback option
- **Example**: Generic data fetching

## Styling

The component uses Tailwind CSS and follows your design system:

- Gradient colors: `from-indigo-600 to-purple-600`
- Border radius: `rounded-2xl`, `rounded-3xl`
- Shadows: `shadow-lg`, `shadow-2xl`
- Background: Matches your app's gradient theme

## Animation Details

All animations are built with Framer Motion and include:

- Smooth transitions
- Infinite loops
- Optimized performance
- Reduced motion support (respects user preferences)

## Accessibility

- Animations respect `prefers-reduced-motion`
- Semantic HTML structure
- Proper ARIA labels (can be added if needed)
- Screen reader friendly messages

## Browser Support

Works in all modern browsers that support:

- CSS transforms
- CSS animations
- Framer Motion (React 18+)

## Performance

- Lightweight (~2KB gzipped with Framer Motion)
- GPU-accelerated animations
- No layout thrashing
- Optimized re-renders
