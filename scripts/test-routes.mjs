const today = new Date().toISOString().split('T')[0];

const routes = [
  '/',
  '/today',
  '/archive',
  `/archive/${today}`,
  '/favorites',
  '/news',
  '/research',
  '/insights',
  '/topics',
  '/topics/llms',
  '/reading-list',
  '/notes',
  '/search',
  '/admin',
  '/settings',
  '/profile',
  '/research/paper_1706_03762',
  '/reader/paper_1706_03762',
  '/api/briefing',
  '/api/profile',
  '/api/archive',
  '/api/favorites',
  '/api/cron/daily'
];

async function checkRoutes() {
  console.log('--- Verifying Lunor HTTP Endpoints ---');
  let failures = 0;
  for (const r of routes) {
    try {
      const res = await fetch(`http://localhost:3000${r}`);
      console.log(`${r.padEnd(35)} -> HTTP ${res.status}`);
      if (res.status !== 200) {
        failures++;
        const text = await res.text();
        console.error(`   Error details: ${text.slice(0, 150)}`);
      }
    } catch (e) {
      console.error(`${r.padEnd(35)} -> FAILED: ${e.message}`);
      failures++;
    }
  }

  // Test POST to /api/favorites
  try {
    console.log('--- Testing POST /api/favorites ---');
    const favRes = await fetch('http://localhost:3000/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: 'research',
        entityId: 'paper_1706_03762',
        title: 'Attention Is All You Need',
        category: 'Transformers',
        url: '/research/paper_1706_03762',
        description: 'Transformers test bookmark'
      })
    });
    const favData = await favRes.json();
    console.log(`POST /api/favorites                -> HTTP ${favRes.status} (id: ${favData.id || favData.entityId})`);
    if (favRes.status !== 201 && favRes.status !== 200) failures++;

    // Test DELETE to /api/favorites
    console.log('--- Testing DELETE /api/favorites ---');
    const delRes = await fetch('http://localhost:3000/api/favorites?entityType=research&entityId=paper_1706_03762', {
      method: 'DELETE'
    });
    const delData = await delRes.json();
    console.log(`DELETE /api/favorites              -> HTTP ${delRes.status} (success: ${delData.success})`);
    if (delRes.status !== 200) failures++;

  } catch (e) {
    console.error(`Favorites API test failed: ${e.message}`);
    failures++;
  }

  if (failures === 0) {
    console.log('\n=============================================');
    console.log('✅ ALL 23 ROUTES & APIS RESPONDED WITH HTTP 200/201 OK');
    console.log('=============================================\n');
  } else {
    console.error(`\n❌ ${failures} routes failed`);
    process.exit(1);
  }
}

checkRoutes();
