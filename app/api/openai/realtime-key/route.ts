import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_REALTIME_MODEL = 'gpt-4o-realtime-preview';

export async function GET(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured' },
      { status: 500 },
    );
  }

  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const model = params.model ?? DEFAULT_REALTIME_MODEL;
    const voice = params.voice ?? 'alloy';

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1',
      },
      body: JSON.stringify({
        model,
        voice,
        instructions:
          'You are a speech recognition service. Transcribe the user speech verbatim and do not add commentary.',
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Failed to create realtime session', details: payload },
        { status: response.status },
      );
    }

    const json = await response.json();
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json(
      { error: 'Unexpected error creating realtime session', details: String(error) },
      { status: 500 },
    );
  }
}
