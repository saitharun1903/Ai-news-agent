import assert from "node:assert/strict";
import fs from "node:fs";

console.log("=================================================");
console.log(" RUNNING LUNOR MOBILE NAVIGATION VERIFICATION    ");
console.log("=================================================\n");

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`✅ PASS: [Test ${total}] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: [Test ${total}] ${name}`);
    console.error(err);
  }
}

// Test 1: No window.location.href internal route navigation in app shell
runTest("No full-page window.location.href reloads in app shell", () => {
  const appShell = fs.readFileSync("components/layout/app-shell.tsx", "utf8");
  assert.equal(appShell.includes("window.location.href"), false, "Found window.location.href in app-shell.tsx");
  assert.equal(appShell.includes("router.push"), true, "Expected router.push in app-shell.tsx");
});

// Test 2: MOTION_TOKENS defined and adhering to specifications
runTest("MOTION_TOKENS adhere to responsive duration specifications", () => {
  const motionContent = fs.readFileSync("lib/motion.ts", "utf8");
  assert.equal(motionContent.includes("MOBILE_FAST: 0.14"), true);
  assert.equal(motionContent.includes("MOBILE_NORMAL: 0.18"), true);
  assert.equal(motionContent.includes("TABLET_NORMAL: 0.20"), true);
  assert.equal(motionContent.includes("DESKTOP_NORMAL: 0.25"), true);
  assert.equal(motionContent.includes("DESKTOP_RICH: 0.32"), true);
});

// Test 3: Hardware-accelerated GPU transitions in app/globals.css
runTest("Hardware-accelerated CSS transitions present in globals.css", () => {
  const css = fs.readFileSync("app/globals.css", "utf8");
  assert.equal(css.includes("lunorPageEnterMobile"), true);
  assert.equal(css.includes("160ms"), true);
  assert.equal(css.includes("translateY(4px)"), true);
  assert.equal(css.includes("prefers-reduced-motion"), true);
});

// Test 4: PageTransition does NOT use blocking mode="wait"
runTest("PageTransition mounts immediately without blocking mode='wait'", () => {
  const pt = fs.readFileSync("components/motion/page-transition.tsx", "utf8");
  assert.equal(pt.includes('mode="wait"'), false, "Found blocking mode='wait' in page-transition.tsx");
  assert.equal(pt.includes("page-enter-mobile"), true);
  assert.equal(pt.includes("page-enter-desktop"), true);
});

// Test 5: Instant route skeletons exist for all primary routes
runTest("Instant route skeletons exist (loading.tsx)", () => {
  assert.equal(fs.existsSync("app/loading.tsx"), true, "Missing app/loading.tsx");
  assert.equal(fs.existsSync("app/research/loading.tsx"), true, "Missing app/research/loading.tsx");
  assert.equal(fs.existsSync("app/today/loading.tsx"), true, "Missing app/today/loading.tsx");
  assert.equal(fs.existsSync("app/news/loading.tsx"), true, "Missing app/news/loading.tsx");
  assert.equal(fs.existsSync("app/topics/loading.tsx"), true, "Missing app/topics/loading.tsx");
  assert.equal(fs.existsSync("app/favorites/loading.tsx"), true, "Missing app/favorites/loading.tsx");
  assert.equal(fs.existsSync("app/profile/loading.tsx"), true, "Missing app/profile/loading.tsx");
});

// Test 6: Mobile nav provides instant feedback state and network-aware prefetch
runTest("Mobile bottom nav has network-aware prefetch and instant pendingPath feedback", () => {
  const mobileNav = fs.readFileSync("components/layout/mobile-nav.tsx", "utf8");
  assert.equal(mobileNav.includes("pendingPath"), true, "Missing optimistic pendingPath");
  assert.equal(mobileNav.includes("shouldPrefetch"), true, "Missing network-aware prefetch on mobile nav");
});

// Test 7: 3D tilt disabled on mobile screens (<768px)
runTest("MotionCard3D strictly disabled on mobile screens (<768px)", () => {
  const card3d = fs.readFileSync("components/motion/motion-card-3d.tsx", "utf8");
  assert.equal(card3d.includes("window.innerWidth >= 768"), true);
});

// Test 8: SharedSurfaceTransition layoutId disabled on mobile screens
runTest("SharedSurfaceTransition bypasses layoutId animation on mobile", () => {
  const shared = fs.readFileSync("components/motion/shared-surface-transition.tsx", "utf8");
  assert.equal(shared.includes("window.innerWidth < 768"), true);
});

// Test 9: Responsive motion profiles for Desktop, Tablet, and Mobile
runTest("Responsive motion profiles for Mobile, Tablet, and Desktop in PageTransition", () => {
  const pt = fs.readFileSync("components/motion/page-transition.tsx", "utf8");
  assert.equal(pt.includes("page-enter-mobile"), true);
  assert.equal(pt.includes("page-enter-tablet"), true);
  assert.equal(pt.includes("page-enter-desktop"), true);
});

// Test 10: Image optimization configured for AVIF and WebP
runTest("Image optimization configured with AVIF and WebP", () => {
  const config = fs.readFileSync("next.config.ts", "utf8");
  assert.equal(config.includes('"image/avif"'), true);
  assert.equal(config.includes('"image/webp"'), true);
});

// Test 11: Data fetching parallelized with Promise.all across routes
runTest("Server-side data fetching parallelized with Promise.all", () => {
  const todayPage = fs.readFileSync("app/today/page.tsx", "utf8");
  const newsPage = fs.readFileSync("app/news/page.tsx", "utf8");
  const researchPage = fs.readFileSync("app/research/page.tsx", "utf8");
  assert.equal(todayPage.includes("Promise.all"), true);
  assert.equal(newsPage.includes("Promise.all"), true);
  assert.equal(researchPage.includes("Promise.all"), true);
});

console.log("\n=================================================");
console.log(` RESULT: ${passed} / ${total} TESTS PASSED`);
console.log("=================================================\n");

if (passed !== total) {
  process.exit(1);
}
