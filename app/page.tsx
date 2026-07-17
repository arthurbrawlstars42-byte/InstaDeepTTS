'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isApiKeyConnected, setIsApiKeyConnected] = useState(false);
  const [voiceId, setVoiceId] = useState('CstacWqMhJQlnfLPxRG4'); // Voice ID padrão

  // Verificar se a API key está salva no localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('elevenlabs_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsApiKeyConnected(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) {
      setError('Por favor, insira uma API key válida');
      return;
    }

    localStorage.setItem('elevenlabs_api_key', apiKeyInput);
    setApiKey(apiKeyInput);
    setApiKeyInput('');
    setIsApiKeyConnected(true);
    setSuccess('API Key salva com sucesso!');
    setError(null);

    setTimeout(() => setSuccess(null), 3000);
  };

  const handleRemoveApiKey = () => {
    localStorage.removeItem('elevenlabs_api_key');
    setApiKey('');
    setIsApiKeyConnected(false);
    setSuccess('API Key removida');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleGenerateSpeech = async () => {
    if (!text.trim()) {
      setError('Por favor, insira um texto');
      return;
    }

    if (!apiKey) {
      setError('Por favor, configure sua API Key do ElevenLabs');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          apiKey,
          voiceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar áudio');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setSuccess('Áudio gerado com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro: ${errorMessage}`);
      console.error('Error:', err);
    } finally {
      setLoading(false);
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

        <div className="api-key-input-group">
          <input
            type="password"
            placeholder="Cole sua API Key aqui"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSaveApiKey()}
          />
          <button onClick={handleSaveApiKey}>Salvar</button>
          {isApiKeyConnected && (
            <button
              onClick={handleRemoveApiKey}
              style={{ background: '#dc3545' }}
              title="Remover API Key"
            >
              ✕
            </button>
          )}
        </div>

        <div
          className={`api-key-status ${isApiKeyConnected ? 'connected' : 'disconnected'}`}
        >
          <span className={`status-dot ${isApiKeyConnected ? 'connected' : 'disconnected'}`}></span>
          {isApiKeyConnected ? '✓ API Key configurada' : '✗ API Key não configurada'}
        </div>
      </div>

      {/* Messages */}
      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      {/* Text Input */}
      <div className="form-group">
        <label htmlFor="text">📝 Texto para converter</label>
        <textarea
          id="text"
          placeholder="Insira o texto que deseja converter em áudio..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!isApiKeyConnected}
        />
      </div>

      {/* Voice Selection */}
      <div className="form-group">
        <label htmlFor="voice">🎵 Selecione a voz</label>
        <select
          id="voice"
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          disabled={!isApiKeyConnected}
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '1rem',
            fontFamily: 'inherit',
            cursor: isApiKeyConnected ? 'pointer' : 'not-allowed',
            opacity: isApiKeyConnected ? 1 : 0.6,
          }}
        >
          <option value="CstacWqMhJQlnfLPxRG4">Rachel (Padrão)</option>
          <option value="pFZP5JQG7iQjIQuC4Suw">Clyde</option>
          <option value="21m00Tcm4TlvDq8ikWAM">George</option>
          <option value="EXAVITQu4vr4xnSDxMaL">Bella</option>
          <option value="TxGEqnHWrfWFTfGW9XjX">Ava</option>
          <option value="VR6AewLTigWP4xVgDlUd">Chris</option>
          <option value="cZE/YApWuTqchEBz5EHX">Gigi</option>
          <option value="XB0fDUnXU5powFXDhCwa">Charlotte</option>
        </select>
      </div>

      {/* Generate Button */}
      <div className="button-group">
        <button
          className="btn-primary"
          onClick={handleGenerateSpeech}
          disabled={loading || !isApiKeyConnected}
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
        <div className="audio-player">
          <h3>🔊 Seu áudio está pronto!</h3>
          <audio controls>
            <source src={audioUrl} type="audio/mpeg" />
            Seu navegador não suporta o elemento de áudio.
          </audio>
          <a href={audioUrl} download="audio.mp3" style={{ marginTop: '10px', display: 'block' }}>
            📥 Baixar áudio
          </a>
        </div>
      )}

      {/* Footer */}
      <p
        style={{
          marginTop: '30px',
          textAlign: 'center',
          color: '#999',
          fontSize: '0.85rem',
        }}
      >
        Powered by{' '}
        <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer">
          ElevenLabs
        </a>
      </p>
    </div>
  );
}
