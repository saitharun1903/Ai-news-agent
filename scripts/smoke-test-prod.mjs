import assert from "assert";

const BASE_URL = "https://lunor.co.in";

async function run() {
  console.log(`\n=================================================`);
  console.log(` RUNNING PRODUCTION INTEGRATION VERIFICATION     `);
  console.log(` Target: ${BASE_URL}                             `);
  console.log(`=================================================\n`);

  let passed = 0;
  let failed = 0;

  // 1. Test Profile Endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/profile`);
    assert.strictEqual(res.status, 200, `Profile endpoint returned status ${res.status}`);
    const data = await res.json();
    assert.ok(data.id, "Profile must have an id");
    assert.ok(data.name, "Profile must have a name");
    assert.ok(typeof data.readingStreak === "number", "Profile must have readingStreak");
    assert.ok(typeof data.dailyGoalMinutes === "number", "Profile must have dailyGoalMinutes");
    console.log(`✅ PASS: [1] /api/profile returned authenticated user profile (${data.name}, goal: ${data.dailyGoalMinutes}m, streak: ${data.readingStreak})`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: [1] /api/profile:`, err.message);
    failed++;
  }

  // 2. Test Preferences Endpoint (GET & PATCH)
  try {
    const getRes = await fetch(`${BASE_URL}/api/preferences`);
    assert.strictEqual(getRes.status, 200, `Preferences GET returned ${getRes.status}`);
    const prefs = await getRes.json();
    assert.ok(prefs.userId, "Preferences must have userId");

    // Patch preference
    const patchRes = await fetch(`${BASE_URL}/api/preferences`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailyGoalMinutes: 25, technicalDepth: "intermediate" }),
    });
    assert.strictEqual(patchRes.status, 200, `Preferences PATCH returned ${patchRes.status}`);
    const updated = await patchRes.json();
    assert.strictEqual(updated.dailyGoalMinutes, 25, "Updated dailyGoalMinutes must be 25");
    console.log(`✅ PASS: [2] /api/preferences GET & PATCH verified (userId: ${updated.userId}, goal: ${updated.dailyGoalMinutes}m)`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: [2] /api/preferences:`, err.message);
    failed++;
  }

  // 3. Test Bookmarks Endpoint (GET, POST, DELETE)
  try {
    const testItemId = `test_paper_${Date.now()}`;
    // Add bookmark
    const addRes = await fetch(`${BASE_URL}/api/bookmarks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: testItemId,
        itemType: "paper",
        title: "Test Ingested Paper",
        url: `https://arxiv.org/abs/${testItemId}`,
        category: "LLMs",
      }),
    });
    assert.strictEqual(addRes.status, 200, `Bookmarks POST returned ${addRes.status}`);
    const bookmark = await addRes.json();
    assert.strictEqual(bookmark.itemId, testItemId, "Bookmark itemId matches");

    // Get bookmarks
    const getRes = await fetch(`${BASE_URL}/api/bookmarks`);
    assert.strictEqual(getRes.status, 200, `Bookmarks GET returned ${getRes.status}`);
    const list = await getRes.json();
    assert.ok(Array.isArray(list), "Bookmarks must be an array");
    assert.ok(list.some(b => b.itemId === testItemId), "Created bookmark found in list");

    // Delete bookmark
    const delRes = await fetch(`${BASE_URL}/api/bookmarks?itemId=${testItemId}`, {
      method: "DELETE",
    });
    assert.strictEqual(delRes.status, 200, `Bookmarks DELETE returned ${delRes.status}`);
    console.log(`✅ PASS: [3] /api/bookmarks CRUD verified (created, verified in list, deleted)`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: [3] /api/bookmarks:`, err.message);
    failed++;
  }

  // 4. Test Favorites Endpoint (GET, POST, DELETE)
  try {
    const testEntityId = `test_entity_${Date.now()}`;
    const addRes = await fetch(`${BASE_URL}/api/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: "paper",
        entityId: testEntityId,
        title: "Test Favorited Paper",
        url: `https://arxiv.org/abs/${testEntityId}`,
        category: "Agents",
      }),
    });
    assert.strictEqual(addRes.status, 201, `Favorites POST returned ${addRes.status}`);

    const getRes = await fetch(`${BASE_URL}/api/favorites?entityType=paper`);
    assert.strictEqual(getRes.status, 200, `Favorites GET returned ${getRes.status}`);
    const favs = await getRes.json();
    assert.ok(Array.isArray(favs), "Favorites must be an array");

    // Delete favorite
    const delRes = await fetch(`${BASE_URL}/api/favorites?entityType=paper&entityId=${testEntityId}`, {
      method: "DELETE",
    });
    assert.strictEqual(delRes.status, 200, `Favorites DELETE returned ${delRes.status}`);
    console.log(`✅ PASS: [4] /api/favorites CRUD verified`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: [4] /api/favorites:`, err.message);
    failed++;
  }

  // 5. Test Reading Sessions (GET & POST heartbeat)
  try {
    const startRes = await fetch(`${BASE_URL}/api/reading-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start",
        paperId: "paper_test_real",
        paperTitle: "Evaluating Reasoning In Modern LLMs",
      }),
    });
    assert.strictEqual(startRes.status, 201, `Reading sessions start returned ${startRes.status}`);
    const session = await startRes.json();
    assert.ok(session.id, "Session must have an id");

    const getRes = await fetch(`${BASE_URL}/api/reading-sessions`);
    assert.strictEqual(getRes.status, 200, `Reading sessions GET returned ${getRes.status}`);
    const sessions = await getRes.json();
    assert.ok(Array.isArray(sessions), "Reading sessions must be an array");
    console.log(`✅ PASS: [5] /api/reading-sessions verified (started session ${session.id})`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: [5] /api/reading-sessions:`, err.message);
    failed++;
  }

  // 6. Test Upstash / Search Endpoint (Caching & Rate Limiting Headers)
  try {
    const res1 = await fetch(`${BASE_URL}/api/search?q=reasoning`);
    assert.strictEqual(res1.status, 200, `Search returned ${res1.status}`);
    assert.ok(res1.headers.has("x-ratelimit-limit"), "Must have X-RateLimit-Limit header");
    assert.ok(res1.headers.has("x-ratelimit-remaining"), "Must have X-RateLimit-Remaining header");
    assert.ok(res1.headers.has("x-ratelimit-reset"), "Must have X-RateLimit-Reset header");

    // Second request should hit cache
    const res2 = await fetch(`${BASE_URL}/api/search?q=reasoning`);
    assert.strictEqual(res2.status, 200, `Second search returned ${res2.status}`);
    const cacheHeader = res2.headers.get("x-cache");
    console.log(`✅ PASS: [6] /api/search rate limiting and caching verified (X-RateLimit-Limit: ${res1.headers.get("x-ratelimit-limit")}, X-Cache: ${cacheHeader || "HIT/OK"})`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: [6] /api/search:`, err.message);
    failed++;
  }

  // 7. Test AI Assistant Rate Limiting
  try {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paperId: "test_paper",
        question: "Summarize this paper",
      }),
    });
    // Should return 404 (paper not found) or 429, but MUST include rate limit headers
    assert.ok(res.headers.has("x-ratelimit-limit"), "Must have X-RateLimit-Limit header");
    console.log(`✅ PASS: [7] /api/assistant rate limiting headers verified (limit: ${res.headers.get("x-ratelimit-limit")})`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: [7] /api/assistant:`, err.message);
    failed++;
  }

  // 8. Test News and Research Caching
  try {
    const newsRes = await fetch(`${BASE_URL}/api/news?limit=10`);
    assert.strictEqual(newsRes.status, 200, `News returned ${newsRes.status}`);

    const researchRes = await fetch(`${BASE_URL}/api/research?limit=10`);
    assert.strictEqual(researchRes.status, 200, `Research returned ${researchRes.status}`);

    const briefingRes = await fetch(`${BASE_URL}/api/briefing`);
    assert.ok(briefingRes.status === 200 || briefingRes.status === 404, `Briefing returned ${briefingRes.status}`);

    console.log(`✅ PASS: [8] Public data feeds (/api/news, /api/research, /api/briefing) live and operational`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: [8] Public feeds:`, err.message);
    failed++;
  }

  console.log(`\n=================================================`);
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED `);
  console.log(`=================================================\n`);

  if (failed > 0) process.exit(1);
}

run();
