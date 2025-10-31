import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { text, voice = 'alloy' }: { text?: string; voice?: string } = await req.json();

  if (!text || !text.trim()) {
    return NextResponse.json(
      { error: 'Text is required for speech synthesis.' },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured.' },
      { status: 500 },
    );
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice,
      input: text,
      format: 'mp3',
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    return NextResponse.json(
      { error: 'Failed to synthesize speech.', details: errorPayload },
      { status: response.status },
    );
  }

  const audioBuffer = await response.arrayBuffer();
  return new NextResponse(audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  });
}
