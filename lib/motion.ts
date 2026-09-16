/**
 * Centralized Motion Tokens & Transition System for Lunor
 * Designed for calm, fast, connected, and premium interactions.
 * Respects prefers-reduced-motion and avoids heavy GPU recalculations.
 */

import { Variants, Transition } from "framer-motion";


// 1. LIGHTWEIGHT RESPONSIVE MOTION TOKENS (Requirements 3 & 49)
export const MOTION_TOKENS = {
  MOBILE_FAST: 0.14,    // 140ms: instant tap responses
  MOBILE_NORMAL: 0.18,  // 180ms: mobile page entrance
  TABLET_NORMAL: 0.20,  // 200ms: tablet transitions
  DESKTOP_NORMAL: 0.25, // 250ms: desktop page transitions
  DESKTOP_RICH: 0.32,   // 320ms: complex desktop layouts
} as const;

// 1. DURATION TOKENS (in seconds)
export const duration = {
  instant: 0.001,
  fast: 0.15,         // 150ms: tooltips, badges, small toggles
  normal: 0.22,       // 220ms: standard interactions, dropdowns, tabs
  route: 0.26,        // 260ms: normal route page transition
  contentHeavy: 0.32, // 320ms: dense lists, table transitions
  reader: 0.38,       // 380ms: reader expansion & focus modes
  modal: 0.20,        // 200ms: modals, command palette
  sheet: 0.28,        // 280ms: mobile bottom sheets and slide-overs
} as const;

// 2. EASING CURVES
export const easing = {
  // Natural deceleration without bounce
  standard: [0.22, 1, 0.36, 1] as const,
  // Snappy enter
  decelerate: [0, 0, 0.2, 1] as const,
  // Crisp exit
  accelerate: [0.4, 0, 1, 1] as const,
  // Smooth symmetric
  smooth: [0.25, 0.1, 0.25, 1] as const,
} as const;

// 3. SPRINGS
export const spring = {
  gentle: {
    type: "spring",
    stiffness: 340,
    damping: 30,
    mass: 0.8,
  } as Transition,
  snappy: {
    type: "spring",
    stiffness: 420,
    damping: 32,
  } as Transition,
  sheet: {
    type: "spring",
    stiffness: 320,
    damping: 34,
    mass: 0.9,
  } as Transition,
  tap: {
    type: "spring",
    stiffness: 500,
    damping: 25,
  } as Transition,
} as const;

// 4. ROUTE PAGE VARIANTS
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 6,
    scale: 0.995,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: duration.route,
      ease: easing.standard,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.995,
    transition: {
      duration: 0.18,
      ease: easing.accelerate,
    },
  },
};

// Reduced motion page variant
export const reducedPageVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.12 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.08 },
  },
};


// Mobile page variant: fast 180ms entrance, 4px translateY, fast ease-out (Requirement 2)
export const mobilePageVariants: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_TOKENS.MOBILE_NORMAL,
      ease: [0, 0, 0.2, 1], // snappy decelerate
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.08 },
  },
};

// Tablet page variant: 200ms
export const tabletPageVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_TOKENS.TABLET_NORMAL,
      ease: easing.standard,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
};

// Desktop page variant: 250ms
export const desktopPageVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_TOKENS.DESKTOP_NORMAL,
      ease: easing.standard,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
};

// 5. MODAL & DIALOG VARIANTS
export const modalVariants: Variants = {
  closed: {
    opacity: 0,
    scale: 0.98,
    y: 8,
    transition: { duration: 0.15, ease: easing.accelerate },
  },
  open: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: duration.modal, ease: easing.standard },
  },
};

export const backdropVariants: Variants = {
  closed: { opacity: 0, transition: { duration: 0.15 } },
  open: { opacity: 1, transition: { duration: 0.2 } },
};

// 6. MOBILE BOTTOM SHEET VARIANTS
export const bottomSheetVariants: Variants = {
  closed: {
    opacity: 0,
    y: "100%",
    transition: { duration: 0.22, ease: easing.accelerate },
  },
  open: {
    opacity: 1,
    y: 0,
    transition: spring.sheet,
  },
};

// 7. DROPDOWN MENU VARIANTS
export const dropdownVariants: Variants = {
  closed: {
    opacity: 0,
    scale: 0.96,
    y: -4,
    transition: { duration: 0.12, ease: easing.accelerate },
  },
  open: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: duration.normal, ease: easing.standard },
  },
};

// 8. STAGGER CONTAINERS & ITEMS
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.standard,
    },
  },
};

// 9. CARD HOVER TOKENS (Only for desktop @media hover:hover)
export const cardHoverAnimation = {
  y: -2,
  transition: { duration: 0.2, ease: easing.standard },
};

export const cardTapAnimation = {
  scale: 0.985,
  transition: spring.tap,
};
