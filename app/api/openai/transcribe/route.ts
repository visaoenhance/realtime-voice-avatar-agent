import { NextRequest, NextResponse } from 'next/server';

const TRANSCRIBE_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured.' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const audio = formData.get('audio');

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: 'Audio file is required.' }, { status: 400 });
    }

    const openaiPayload = new FormData();
    openaiPayload.append('file', audio, audio.name || 'speech.webm');
    openaiPayload.append('model', 'whisper-1');
    openaiPayload.append('response_format', 'verbose_json');

    const response = await fetch(TRANSCRIBE_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openaiPayload,
    });

    if (!response.ok) {
      const details = await response.text();
      console.error('[api/openai/transcribe] upstream error', response.status, details);
      return NextResponse.json(
        { error: 'Failed to transcribe audio.', details },
        { status: response.status },
      );
    }

    const data = (await response.json()) as any;
    const transcript = data.text ?? data.results?.[0]?.text ?? '';
    const language = data.language ?? data.detected_language ?? data.segments?.[0]?.language ?? null;
    console.info('[api/openai/transcribe] language', language);

    return NextResponse.json({ transcript, language });
  } catch (error) {
    console.error('[api/openai/transcribe] failed', error);
    return NextResponse.json({ error: 'Failed to transcribe audio.' }, { status: 500 });
  }
}

