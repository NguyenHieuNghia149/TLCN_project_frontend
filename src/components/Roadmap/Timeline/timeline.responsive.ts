/**
 * Responsive design constants for Timeline components
 * Using Tailwind breakpoints and arbitrary values where necessary
 */

export const TIMELINE_BREAKPOINTS = {
  mobile: {
    nodeSize: 'w-16 h-16', // 64px (Tailwind w-16)
    nodeTextSize: 'text-xs',
    gapBetweenNodes: 'gap-4',
    trackPadding: 'py-4 px-3',
    labelSize: 'text-xs',
    showDescriptions: false,
    showAnimations: false,
  },
  tablet: {
    nodeSize: 'w-[72px] h-[72px]', // 72px (arbitrary: Tailwind doesn't have w-18)
    nodeTextSize: 'text-sm',
    gapBetweenNodes: 'gap-6',
    trackPadding: 'py-6 px-4',
    labelSize: 'text-sm',
    showDescriptions: true, // show on hover
    showAnimations: true, // but reduced
  },
  desktop: {
    nodeSize: 'w-20 h-20', // 80px (Tailwind w-20)
    nodeTextSize: 'text-sm',
    gapBetweenNodes: 'gap-8',
    gapBetweenTracks: 'gap-12',
    trackPadding: 'py-8 px-4',
    labelSize: 'text-sm',
    showDescriptions: true, // always on hover
    showAnimations: true, // full animations
  },
} as const;

/**
 * Tailwind media query trigger values (pixels)
 */
export const BREAKPOINT_PIXELS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

/**
 * CSS custom properties (optional, for CSS-based approach)
 */
export const TIMELINE_CSS_VARS = {
  '--timeline-node-size': 'var(--timeline-node-size, 80px)',
  '--timeline-gap': 'var(--timeline-gap, 32px)',
  '--timeline-track-padding': 'var(--timeline-track-padding, 32px)',
} as const;
