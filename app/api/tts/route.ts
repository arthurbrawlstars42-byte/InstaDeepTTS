import { NextRequest, NextResponse } from 'next/server';

interface TTSRequest {
  text: string;
  apiKey: string;
  voiceId: string;
}

const ALLOWED_VOICE_IDS = new Set([
  'CstacWqMhJQlnfLPxRG4',
  'pFZP5JQG7iQjIQuC4Suw',
  '21m00Tcm4TlvDq8ikWAM',
  'EXAVITQu4vr4xnSDxMaL',
  'TxGEqnHWrfWFTfGW9XjX',
  'VR6AewLTigWP4xVgDlUd',
  'cZE/YApWuTqchEBz5EHX',
  'XB0fDUnXU5powFXDhCwa',
]);

const MAX_TEXT_LENGTH = 5000;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Rate limiting - simple in-memory store
const requestMap = new Map<string, number[]>();
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60000, // 1 minuto
};

function getRateLimitKey(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = requestMap.get(key) || [];
  
  // Remover timestamps antigos
  const recentTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT.windowMs
  );
  
  if (recentTimestamps.length >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  recentTimestamps.push(now);
  requestMap.set(key, recentTimestamps);
  return true;
}

function validateVoiceId(voiceId: unknown): boolean {
  return typeof voiceId === 'string' && ALLOWED_VOICE_IDS.has(voiceId);
}

function validateText(text: unknown): text is string {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_TEXT_LENGTH;
}

function validateApiKey(apiKey: unknown): boolean {
  if (typeof apiKey !== 'string') return false;
  // Validação básica: deve ter caracteres alfanuméricos/hífen/underscore e ter comprimento mínimo
  return /^[a-zA-Z0-9_-]{20,}$/.test(apiKey.trim());
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em alguns segundos.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // Validar Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type deve ser application/json' },
        { status: 400 }
      );
    }

    // Parse e validar body
    let body: unknown;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json(
        { error: 'JSON inválido no corpo da requisição' },
        { status: 400 }
      );
    }

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { error: 'Corpo da requisição deve ser um objeto' },
        { status: 400 }
      );
    }

    const { text, apiKey, voiceId } = body as Record<string, unknown>;

    // Validações individuais com mensagens específicas
    if (!validateText(text)) {
      return NextResponse.json(
        {
          error: `Texto inválido. Deve estar entre 1 e ${MAX_TEXT_LENGTH} caracteres.`,
        },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key é obrigatória' },
        { status: 400 }
      );
    }

    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'API key inválida' },
        { status: 400 }
      );
    }

    if (!voiceId) {
      return NextResponse.json(
        { error: 'Voice ID é obrigatório' },
        { status: 400 }
      );
    }

    if (!validateVoiceId(voiceId)) {
      return NextResponse.json(
        { error: 'Voice ID não permitido' },
        { status: 400 }
      );
    }

    // Fazer requisição para ElevenLabs com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const elevenLabsResponse = await fetch(
        `${ELEVENLABS_API_URL}/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey as string,
            'User-Agent': 'InstaDeepTTS/1.0',
          },
          body: JSON.stringify({
            text: (text as string).trim(),
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      // Tratamento de erros específicos do ElevenLabs
      if (!elevenLabsResponse.ok) {
        const contentTypeHeader = elevenLabsResponse.headers.get('content-type');
        let errorMessage = 'Erro ao gerar áudio';

        if (contentTypeHeader?.includes('application/json')) {
          try {
            const errorData = await elevenLabsResponse.json() as Record<string, unknown>;
            errorMessage = 
              (typeof errorData.detail === 'string' && errorData.detail) ||
              (typeof errorData.error === 'string' && errorData.error) ||
              errorMessage;
          } catch {
            // Ignorar erro de parsing e usar mensagem padrão
          }
        }

        if (elevenLabsResponse.status === 401) {
          console.warn('Authentication failed for ElevenLabs API');
          return NextResponse.json(
            { error: 'API key inválida ou expirada' },
            { status: 401 }
          );
        }

        if (elevenLabsResponse.status === 429) {
          return NextResponse.json(
            { error: 'Limite de requisições do ElevenLabs atingido. Tente novamente mais tarde.' },
            { status: 429, headers: { 'Retry-After': '60' } }
          );
        }

        if (elevenLabsResponse.status === 422) {
          return NextResponse.json(
            { error: 'Texto contém caracteres não suportados' },
            { status: 422 }
          );
        }

        return NextResponse.json(
          { error: errorMessage },
          { status: elevenLabsResponse.status }
        );
      }

      // Validar Content-Type da resposta
      const responseContentType = elevenLabsResponse.headers.get('content-type');
      if (!responseContentType?.includes('audio/')) {
        console.error('Invalid content type from ElevenLabs:', responseContentType);
        return NextResponse.json(
          { error: 'Resposta do ElevenLabs não é um arquivo de áudio válido' },
          { status: 502 }
        );
      }

      const audioBuffer = await elevenLabsResponse.arrayBuffer();

      // Validar tamanho do áudio (deve ser > 0)
      if (audioBuffer.byteLength === 0) {
        return NextResponse.json(
          { error: 'Áudio gerado está vazio' },
          { status: 502 }
        );
      }

      // Limitar tamanho máximo de áudio (50MB)
      if (audioBuffer.byteLength > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Arquivo de áudio muito grande' },
          { status: 413 }
        );
      }

      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.byteLength.toString(),
          'Content-Disposition': 'inline; filename="audio.mp3"',
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Requisição expirou. O texto pode ser muito longo.' },
          { status: 504 }
        );
      }

      throw fetchError;
    }
  } catch (error) {
    console.error('Error in TTS API:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Rejeitar outros métodos HTTP
export async function GET() {
  return NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
}
