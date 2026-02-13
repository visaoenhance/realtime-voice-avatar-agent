// Database check via debug endpoint
const API_BASE = 'http://localhost:3000';

async function checkDatabase() {
  try {
    console.log('🔍 Checking actual database contents...');
    
    const response = await fetch(`${API_BASE}/api/debug-db`);

    if (!response.ok) {
      console.log('❌ API request failed:', response.status);
      const text = await response.text();
      console.log('Response:', text);
      return;
    }

    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Database error:', data.error);
      console.log('Details:', data.details);
      return;
    }

    console.log(`\n✅ Found ${data.totalRestaurants} total restaurants in database:`);
    data.restaurants?.forEach(r => {
      console.log(`  • ${r.name} (${r.cuisine}) - ${r.address}`);
      console.log(`    Tags: [${r.dietaryTags?.join(', ') || 'none'}]`);
    });

    console.log(`\n📍 Profiles:`);
    data.profiles?.forEach(p => {
      console.log(`  • ${p.name}: ${JSON.stringify(p.location)}`);
    });

    console.log(`\n🏙️ Orlando area search found ${data.orlandoSearchResults} restaurants:`);
    data.orlandoRestaurants?.forEach(r => {
      console.log(`  • ${r.name} (${r.cuisine}) - ${r.address}`);
    });

    if (data.orlandoError) {
      console.log('⚠️ Orlando search error:', data.orlandoError);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabase();