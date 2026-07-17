import { NextRequest, NextResponse } from 'next/server';

interface TTSRequest {
  text: string;
  apiKey: string;
  voiceId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json();
    const { text, apiKey, voiceId } = body;

    // Validação
    if (!text || !apiKey || !voiceId) {
      return NextResponse.json(
        { error: 'Text, API key, and voice ID são obrigatórios' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Texto não pode ter mais de 5000 caracteres' },
        { status: 400 }
      );
    }

    // Fazer requisição para ElevenLabs
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('ElevenLabs API Error:', error);

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'API key inválida' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: error.detail || 'Erro ao gerar áudio' },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="audio.mp3"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error in TTS API:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
