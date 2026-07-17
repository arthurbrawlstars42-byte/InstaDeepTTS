'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Validação de Voice IDs permitidos
const ALLOWED_VOICES = {
  'CstacWqMhJQlnfLPxRG4': 'Rachel (Padrão)',
  'pFZP5JQG7iQjIQuC4Suw': 'Clyde',
  '21m00Tcm4TlvDq8ikWAM': 'George',
  'EXAVITQu4vr4xnSDxMaL': 'Bella',
  'TxGEqnHWrfWFTfGW9XjX': 'Ava',
  'VR6AewLTigWP4xVgDlUd': 'Chris',
  'cZE/YApWuTqchEBz5EHX': 'Gigi',
  'XB0fDUnXU5powFXDhCwa': 'Charlotte',
};

const REQUEST_TIMEOUT = 30000; // 30 segundos
const MAX_TEXT_LENGTH = 5000;
const MIN_TEXT_LENGTH = 1;

export default function Home() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isApiKeyConnected, setIsApiKeyConnected] = useState(false);
  const [voiceId, setVoiceId] = useState('CstacWqMhJQlnfLPxRG4');
  const [charCount, setCharCount] = useState(0);
  const [showApiKeyConfirm, setShowApiKeyConfirm] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar se a API key está salva no localStorage
  useEffect(() => {
    try {
      const savedApiKey = localStorage.getItem('elevenlabs_api_key');
      if (savedApiKey && typeof savedApiKey === 'string' && savedApiKey.trim().length > 0) {
        setIsApiKeyConnected(true);
      }
    } catch (err) {
      console.error('Erro ao ler localStorage:', err);
    }
  }, []);

  // Limpar timeout de mensagens ao desmontar
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  // Limpar ObjectURL ao desmontar ou quando mudar
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const clearMessage = useCallback(() => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
  }, []);

  const setErrorWithTimeout = useCallback((msg: string) => {
    clearMessage();
    setError(msg);
    messageTimeoutRef.current = setTimeout(() => setError(null), 5000);
  }, [clearMessage]);

  const setSuccessWithTimeout = useCallback((msg: string) => {
    clearMessage();
    setSuccess(msg);
    messageTimeoutRef.current = setTimeout(() => setSuccess(null), 4000);
  }, [clearMessage]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= MAX_TEXT_LENGTH) {
      setText(newText);
      setCharCount(newText.length);
    }
  };

  const handleSaveApiKey = () => {
    const trimmedKey = apiKeyInput.trim();
    
    if (!trimmedKey) {
      setErrorWithTimeout('Por favor, insira uma API key válida');
      return;
    }

    // Validação básica da API key
    if (trimmedKey.length < 20) {
      setErrorWithTimeout('API key parece inválida (muito curta)');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedKey)) {
      setErrorWithTimeout('API key contém caracteres inválidos');
      return;
    }

    try {
      localStorage.setItem('elevenlabs_api_key', trimmedKey);
      setApiKeyInput('');
      setShowApiKeyConfirm(false);
      setIsApiKeyConnected(true);
      setSuccessWithTimeout('✓ API Key salva com segurança');
    } catch (err) {
      setErrorWithTimeout('Erro ao salvar API Key. Verifique o espaço de armazenamento');
      console.error('localStorage error:', err);
    }
  };

  const handleRemoveApiKey = () => {
    if (window.confirm('Tem certeza que deseja remover a API Key?')) {
      try {
        localStorage.removeItem('elevenlabs_api_key');
        setIsApiKeyConnected(false);
        setSuccessWithTimeout('✓ API Key removida com sucesso');
      } catch (err) {
        setErrorWithTimeout('Erro ao remover API Key');
        console.error('localStorage error:', err);
      }
    }
  };

  const handleGenerateSpeech = async () => {
    // Validações
    const trimmedText = text.trim();
    
    if (!trimmedText) {
      setErrorWithTimeout('Por favor, insira um texto');
      return;
    }

    if (trimmedText.length < MIN_TEXT_LENGTH) {
      setErrorWithTimeout('O texto deve ter pelo menos 1 caractere');
      return;
    }

    if (trimmedText.length > MAX_TEXT_LENGTH) {
      setErrorWithTimeout(`Texto não pode ter mais de ${MAX_TEXT_LENGTH} caracteres`);
      return;
    }

    if (!isApiKeyConnected) {
      setErrorWithTimeout('Por favor, configure sua API Key do ElevenLabs');
      return;
    }

    if (!ALLOWED_VOICES[voiceId as keyof typeof ALLOWED_VOICES]) {
      setErrorWithTimeout('Voice ID inválido');
      return;
    }

    // Obter API Key do localStorage
    let savedApiKey: string;
    try {
      const key = localStorage.getItem('elevenlabs_api_key');
      if (!key) {
        setErrorWithTimeout('API Key não encontrada. Por favor, configure novamente');
        setIsApiKeyConnected(false);
        return;
      }
      savedApiKey = key;
    } catch (err) {
      setErrorWithTimeout('Erro ao acessar API Key armazenada');
      console.error('localStorage error:', err);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress(10);

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, REQUEST_TIMEOUT);

    try {
      setProgress(20);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: trimmedText,
          apiKey: savedApiKey,
          voiceId,
        }),
        signal: abortControllerRef.current.signal,
      });

      setProgress(70);

      if (!response.ok) {
        let errorMessage = 'Erro ao gerar áudio';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }

        if (response.status === 401) {
          setIsApiKeyConnected(false);
          throw new Error('API Key inválida ou expirada. Reconfigure sua chave.');
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();

      // Validar que é realmente um arquivo de áudio
      if (!blob.type.startsWith('audio/')) {
        throw new Error('Resposta recebida não é um arquivo de áudio válido');
      }

      // Limpar URL anterior
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      setAudioUrl(url);
      setProgress(100);
      setSuccessWithTimeout('✓ Áudio gerado com sucesso!');
    } catch (err) {
      let errorMessage = 'Erro desconhecido';

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Requisição expirou (timeout). Tente com um texto menor.';
        } else {
          errorMessage = err.message;
        }
      }

      setErrorWithTimeout(`❌ ${errorMessage}`);
      console.error('Error:', err);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setProgress(0);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !loading && isApiKeyConnected) {
      handleGenerateSpeech();
    }
  };

  return (
    <div className="container">
      <h1>🎙️ InstaDeep TTS</h1>
      <p className="subtitle">Converta texto em fala com ElevenLabs</p>

      {/* API Key Section */}
      <div className="api-key-section">
        <h3>🔑 Configurar API Key</h3>
        <p>Adicione sua chave de API do ElevenLabs para começar</p>

        {!isApiKeyConnected ? (
          <>
            <div className="api-key-input-group">
              <input
                type={showApiKeyConfirm ? 'text' : 'password'}
                placeholder="Cole sua API Key aqui"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveApiKey()}
                autoComplete="off"
                spellCheck="false"
              />
              <button 
                onClick={() => setShowApiKeyConfirm(!showApiKeyConfirm)}
                title={showApiKeyConfirm ? 'Ocultar' : 'Mostrar'}
                className="btn-eye"
              >
                {showApiKeyConfirm ? '🙈' : '👁️'}
              </button>
              <button onClick={handleSaveApiKey}>Salvar</button>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
              💡 Sua chave é armazenada localmente no navegador, nunca é enviada para nossos servidores
            </p>
          </>
        ) : null}

        <div
          className={`api-key-status ${isApiKeyConnected ? 'connected' : 'disconnected'}`}
        >
          <span className={`status-dot ${isApiKeyConnected ? 'connected' : 'disconnected'}`}></span>
          {isApiKeyConnected ? '✓ API Key configurada' : '✗ API Key não configurada'}
          {isApiKeyConnected && (
            <button
              onClick={handleRemoveApiKey}
              className="btn-remove-key"
              title="Remover API Key"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && <div className="message error" role="alert">{error}</div>}
      {success && <div className="message success" role="alert">{success}</div>}

      {/* Progress Bar */}
      {loading && progress > 0 && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      {/* Text Input */}
      <div className="form-group">
        <label htmlFor="text">
          📝 Texto para converter ({charCount}/{MAX_TEXT_LENGTH})
        </label>
        <textarea
          id="text"
          placeholder="Insira o texto que deseja converter em áudio... (Ctrl+Enter para enviar)"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyPress}
          disabled={!isApiKeyConnected || loading}
          maxLength={MAX_TEXT_LENGTH}
          aria-label="Texto para conversão"
          spellCheck="true"
        />
      </div>

      {/* Voice Selection */}
      <div className="form-group">
        <label htmlFor="voice">🎵 Selecione a voz</label>
        <select
          id="voice"
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          disabled={!isApiKeyConnected || loading}
          className="voice-select"
          aria-label="Seleção de voz"
        >
          {Object.entries(ALLOWED_VOICES).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Generate Button */}
      <div className="button-group">
        <button
          className="btn-primary"
          onClick={handleGenerateSpeech}
          disabled={loading || !isApiKeyConnected || charCount === 0}
          aria-busy={loading}
        >
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              Gerando áudio...
            </div>
          ) : (
            '🎙️ Gerar Áudio'
          )}
        </button>
      </div>

      {/* Audio Player */}
      {audioUrl && (
        <div className="audio-player" role="region" aria-label="Reprodutor de áudio">
          <h3>🔊 Seu áudio está pronto!</h3>
          <audio controls aria-label="Áudio gerado">
            <source src={audioUrl} type="audio/mpeg" />
            Seu navegador não suporta o elemento de áudio.
          </audio>
          <a 
            href={audioUrl} 
            download="audio.mp3"
            className="btn-download"
            aria-label="Baixar arquivo de áudio"
          >
            📥 Baixar áudio
          </a>
        </div>
      )}

      {/* Footer */}
      <p className="footer">
        Powered by{' '}
        <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer">
          ElevenLabs
        </a>{' '}
        | <a href="#privacy" title="Sua privacidade é importante">Privacidade</a>
      </p>
    </div>
  );
}
