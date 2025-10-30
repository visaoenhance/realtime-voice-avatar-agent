// Simple streaming test for /api/chat
const url = 'http://localhost:3000/api/chat';

async function main() {
  const body = {
    messages: [
      {
        role: 'user',
        parts: [{ type: 'text', text: "What's the weather in New York?" }],
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error('HTTP', res.status, await res.text());
    process.exit(1);
  }

  if (!res.body) {
    console.error('No response body');
    process.exit(1);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  console.log('--- Streaming start ---');
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    total += chunk.length;
    process.stdout.write(chunk);
  }
  console.log('\n--- Streaming end ---');
  console.log('Total bytes:', total);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
