# InstaDeep TTS 🎙️

Um web app de Text-to-Speech (TTS) poderoso e fácil de usar, alimentado pelo ElevenLabs.

## Funcionalidades ✨

- 🎙️ **Conversão de texto em áudio** com qualidade profissional
- 🔑 **Gerenciamento seguro de API Key** (armazenado localmente)
- 🎵 **Múltiplas vozes** para escolher
- 📥 **Download de áudio** em formato MP3
- 🎨 **Interface moderna e responsiva**
- ⚡ **Rápido e eficiente**

## Requisitos 📋

- Node.js 18+ 
- npm ou yarn
- Conta no [ElevenLabs](https://elevenlabs.io)
- API Key do ElevenLabs

## Instalação 🚀

1. **Clone o repositório**
   ```bash
   git clone https://github.com/arthurbrawlstars42-byte/InstaDeepTTS.git
   cd InstaDeepTTS
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Obtenha sua API Key do ElevenLabs**
   - Acesse [elevenlabs.io](https://elevenlabs.io)
   - Crie uma conta ou faça login
   - Vá para Configurações → API Key
   - Copie sua API Key

4. **Execute o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

5. **Abra no navegador**
   - Acesse http://localhost:3000
   - Cole sua API Key no campo de configuração
   - Comece a gerar áudio!

## Uso 💬

1. **Configurar API Key:**
   - Cole sua chave do ElevenLabs no campo "🔑 Configurar API Key"
   - Clique em "Salvar"
   - A chave será armazenada localmente no seu navegador

2. **Gerar Áudio:**
   - Escreva o texto que deseja converter
   - Escolha uma voz da lista de opções
   - Clique em "🎙️ Gerar Áudio"
   - Aguarde o processamento

3. **Reproduzir e Baixar:**
   - Use o player para ouvir o áudio
   - Clique em "📥 Baixar áudio" para salvar o arquivo

## Segurança 🔒

- A API Key é armazenada **localmente no navegador** usando `localStorage`
- **Não é enviada para nenhum servidor externo** (exceto ElevenLabs)
- Você pode remover a chave a qualquer momento
- A chave nunca é registrada em logs

## Variáveis de Ambiente 🔧

```
NEXT_PUBLIC_ELEVENLABS_API_KEY=sua_chave_aqui
```

Nota: Esta variável é apenas um template. A API Key é inserida através da interface do app.

## Deployment no Vercel 🌐

1. **Push para GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy no Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Clique em "New Project"
   - Selecione seu repositório
   - Clique em "Deploy"

3. **Configurar variáveis de ambiente (opcional)**
   - Vá em Settings → Environment Variables
   - Adicione `NEXT_PUBLIC_ELEVENLABS_API_KEY` se desejar um padrão

## Estrutura do Projeto 📁

```
InstaDeepTTS/
├── app/
│   ├── api/
│   │   └── tts/
│   │       └── route.ts      # API endpoint do TTS
│   ├── globals.css            # Estilos globais
│   ├── layout.tsx             # Layout raiz
│   └── page.tsx               # Página principal
├── package.json               # Dependências
├── tsconfig.json              # Configuração TypeScript
├── next.config.js             # Configuração Next.js
├── vercel.json                # Configuração Vercel
└── README.md                  # Este arquivo
```

## Vozes Disponíveis 🎵

- Rachel (Padrão)
- Clyde
- George
- Bella
- Ava
- Chris
- Gigi
- Charlotte

## Tecnologias Utilizadas 🛠️

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **ElevenLabs API** - Motor de TTS
- **CSS3** - Estilização moderna
- **Vercel** - Deploy

## Limitações ⚠️

- Máximo de 5000 caracteres por requisição
- Dependente do plano de API do ElevenLabs
- Requer conexão com internet

## API Reference 📚

### POST `/api/tts`

Gera áudio a partir de texto.

**Request Body:**
```json
{
  "text": "Hello, world!",
  "apiKey": "sk_...",
  "voiceId": "CstacWqMhJQlnfLPxRG4"
}
```

**Response:**
- Status 200: Arquivo de áudio (MP3)
- Status 400: Parâmetros inválidos
- Status 401: API Key inválida
- Status 500: Erro interno

## Troubleshooting 🔧

### Erro: "API key inválida"
- Verifique se a API Key foi copiada corretamente
- Certifique-se que a chave ainda é válida
- Tente gerar uma nova chave no ElevenLabs

### Erro: "Texto não pode ter mais de 5000 caracteres"
- Reduza o tamanho do texto
- Divida em múltiplas requisições

### Áudio não está sendo gerado
- Verifique sua conexão com internet
- Confira se a API Key está configurada
- Verifique o console do navegador para erros

## Contribuindo 🤝

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## Licença 📄

MIT - Veja o arquivo LICENSE para mais detalhes.

## Suporte 💬

Tem dúvidas? Abra uma issue no GitHub!

## Links Úteis 🔗

- [ElevenLabs Documentação](https://elevenlabs.io/docs)
- [Next.js Documentação](https://nextjs.org/docs)
- [Vercel Documentação](https://vercel.com/docs)

---

Desenvolvido com ❤️ por [arthurbrawlstars42-byte](https://github.com/arthurbrawlstars42-byte)
