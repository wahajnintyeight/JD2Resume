/**
 * LoadingAnimation Component Examples
 * 
 * This file demonstrates different variants and use cases for the LoadingAnimation component.
 * You can use these examples as reference when implementing loading states in your app.
 */

import { LoadingAnimation, LoadingOverlay, LoadingSection } from './loading-animation';

// Example 1: Default spinner variant
export function DefaultSpinner() {
  return (
    <LoadingAnimation 
      message="Loading data..." 
      variant="default" 
      size="md" 
    />
  );
}

// Example 2: Sparkle variant (recommended for important loading states)
export function SparkleLoader() {
  return (
    <LoadingAnimation 
      message="Checking system status..." 
      variant="sparkle" 
      size="lg" 
    />
  );
}

// Example 3: Pulse variant (good for background operations)
export function PulseLoader() {
  return (
    <LoadingAnimation 
      message="Syncing..." 
      variant="pulse" 
      size="md" 
    />
  );
}

// Example 4: Dots variant (minimal, good for inline loading)
export function DotsLoader() {
  return (
    <LoadingAnimation 
      message="Processing..." 
      variant="dots" 
      size="sm" 
    />
  );
}

// Example 5: Full-screen overlay (for page transitions)
export function FullScreenLoader() {
  return (
    <LoadingOverlay 
      message="Loading your workspace..." 
      variant="sparkle" 
    />
  );
}

// Example 6: Section loading (for content areas)
export function SectionLoader() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8">
      <LoadingSection 
        message="Loading content..." 
        variant="dots" 
      />
    </div>
  );
}

// Example 7: Without message
export function MinimalLoader() {
  return (
    <LoadingAnimation 
      variant="sparkle" 
      size="md" 
    />
  );
}

// Example 8: Different sizes comparison
export function SizeComparison() {
  return (
    <div className="flex gap-8 items-center">
      <LoadingAnimation variant="sparkle" size="sm" />
      <LoadingAnimation variant="sparkle" size="md" />
      <LoadingAnimation variant="sparkle" size="lg" />
    </div>
  );
}

// Example 9: All variants comparison
export function VariantsComparison() {
  return (
    <div className="grid grid-cols-2 gap-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-sm font-bold mb-4">Default</h3>
        <LoadingAnimation variant="default" size="md" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-sm font-bold mb-4">Sparkle</h3>
        <LoadingAnimation variant="sparkle" size="md" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-sm font-bold mb-4">Pulse</h3>
        <LoadingAnimation variant="pulse" size="md" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-sm font-bold mb-4">Dots</h3>
        <LoadingAnimation variant="dots" size="md" />
      </div>
    </div>
  );
}

/**
 * Usage Guidelines:
 * 
 * 1. Use 'sparkle' variant for:
 *    - Initial page loads
 *    - Important system operations
 *    - Authentication checks
 * 
 * 2. Use 'pulse' variant for:
 *    - Background sync operations
 *    - Real-time updates
 *    - Continuous monitoring
 * 
 * 3. Use 'dots' variant for:
 *    - Inline loading states
 *    - Form submissions
 *    - Quick operations
 * 
 * 4. Use 'default' variant for:
 *    - Generic loading states
 *    - When you need a simple spinner
 * 
 * 5. Use LoadingOverlay for:
 *    - Full-page transitions
 *    - Modal loading states
 *    - Blocking operations
 * 
 * 6. Use LoadingSection for:
 *    - Content area loading
 *    - Card/panel loading
 *    - Section-specific states
 */
