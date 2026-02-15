const https = require('https');
require('dotenv').config({ path: '.env.local' });

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

async function fetchPexelsImage(query) {
  return new Promise((resolve, reject) => {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    
    const options = {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const photo = json.photos?.[0];
          if (photo) {
            resolve({
              id: photo.id,
              url: photo.src.large,
              medium: photo.src.medium,
              photographer: photo.photographer
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const queries = [
    'mexican food restaurant',
    'tacos colorful',
    'mexican cuisine',
    'latin american food'
  ];

  console.log('\n🌮 Finding Pexels image for Sabor Latino Cantina...\n');

  for (const query of queries) {
    console.log(`Trying: "${query}"`);
    const result = await fetchPexelsImage(query);
    if (result) {
      console.log(`  ✅ Found: ${result.url}`);
      console.log(`  📷 Photo by: ${result.photographer}`);
      console.log(`  🔗 Medium: ${result.medium}\n`);
    } else {
      console.log(`  ❌ No results\n`);
    }
  }
}

main();
