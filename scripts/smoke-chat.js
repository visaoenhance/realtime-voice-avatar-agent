// Smoke test for /api/chat streaming
const url = 'http://localhost:3000/api/chat';

async function main() {
  const body = {
    messages: [
      { role: 'user', parts: [{ type: 'text', text: 'Say hello' }] },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  console.log('HTTP', res.status, res.headers.get('content-type'));
  if (!res.ok || !res.body) {
    console.error('Bad response:', await res.text());
    process.exit(1);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  console.log('--- stream start ---');
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    total += chunk.length;
    process.stdout.write(chunk);
  }
  console.log('\n--- stream end ---');
  console.log('bytes:', total);
}

main().catch(err => { console.error(err); process.exit(1); });
