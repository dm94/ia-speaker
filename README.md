# IA Speaker

A React web application that simulates a phone call with artificial intelligence in a completely local manner.

## 🎯 Features

- 🎙️ **Voice Conversation**: Phone call interface with continuous recording
- 🤖 **Local AI**: Integration with LM Studio for text generation
- 🔊 **Speech Synthesis**: Compatible with sesame/csm-1b (fallback to Web Speech API)
- 🔒 **Total Privacy**: Everything works locally, no external data transmission
- 📱 **Responsive**: Optimized design for mobile and desktop
- ⚡ **Automatic Detection**: Automatic processing when silence is detected
- ⚙️ **Visual Configuration**: Integrated configuration panel

## 📋 Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
2. **LM Studio** installed and configured
3. **Modern browser** with Web Audio API support

### LM Studio Configuration

1. Download and install [LM Studio](https://lmstudio.ai/)
2. Download a compatible language model (recommended: Llama 3.2 1B or similar)
3. Start the local server in LM Studio:
   - Go to the "Local Server" tab
   - Load your preferred model
   - Start the server on `http://localhost:1234`

### Sesame CSM-1B Configuration (Optional)

> **Note**: Currently the application uses Web Speech API for synthesis. Integration with sesame/csm-1b is prepared for future implementation.

To use sesame/csm-1b:

1. Clone the CSM repository:
   ```bash
   git clone https://github.com/SesameAILabs/csm.git
   cd csm
   ```

2. Install dependencies:
   ```bash
   python3.10 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Configure model access:
   ```bash
   export NO_TORCH_COMPILE=1
   huggingface-cli login
   ```

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ia-speaker
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Start the application**:
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. **Open your browser** at `http://localhost:5173`

## ⚙️ Configuration

### Application Configuration

The configuration is located in `src/App.tsx`:

```typescript
const [config] = useState<AppConfig>({
  lmStudioUrl: 'http://localhost:1234',     // LM Studio URL
  lmStudioModel: 'local-model',             // Model name
  silenceThreshold: 10,                     // Silence detection threshold (0-255)
  silenceTimeout: 2000                      // Timeout in ms
});
```

### Adjustable Parameters

- **`silenceThreshold`**: Sensitivity to detect silence (lower = more sensitive)
- **`silenceTimeout`**: Wait time before processing audio
- **`lmStudioUrl`**: LM Studio server URL
- **`lmStudioModel`**: Model identifier to use

## 🎯 Usage

1. **Make sure LM Studio is running** with a loaded model
2. **Allow microphone access** when the browser requests it
3. **Press the green button** to start the call
4. **Speak naturally** - the application will automatically detect when you stop speaking
5. **Listen to the AI response**
6. **Continue the conversation** - the cycle repeats automatically
7. **Press the red button** to end the call

## 🔧 Development

### Project Structure

```
src/
├── hooks/
│   └── useAICall.ts          # Main hook for call handling
├── types/
│   └── speech.ts             # TypeScript types for Web Speech API
├── App.tsx                   # Main component
├── App.css                   # Custom styles
└── main.tsx                  # Entry point
```

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build application for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run linter

### Technologies Used

- **React 18** with TypeScript
- **Vite** as bundler
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **RecordRTC** for audio recording
- **Axios** for HTTP communication
- **WaveSurfer.js** for audio visualization

## 🚨 Troubleshooting

### Microphone Error
- Make sure to allow microphone access in your browser
- Verify that no other applications are using the microphone
- Try in an incognito tab to rule out extensions

### LM Studio Connection Error
- Verify that LM Studio is running on `http://localhost:1234`
- Make sure the model is loaded and the server is started
- Check CORS configuration in LM Studio if necessary

### Audio Issues
- Verify that your browser supports Web Audio API
- Adjust the `silenceThreshold` and `silenceTimeout` parameters
- Try with different microphone volume levels

## 🔮 Roadmap

- [ ] Complete integration with sesame/csm-1b
- [ ] Parameter configuration from UI
- [ ] Multi-language support
- [ ] Voice detection improvements
- [ ] Real-time transcription mode
- [ ] Customizable themes

## 📄 License

This project is under the MIT license. See the `LICENSE` file for more details.

## 🤝 Contributions

Contributions are welcome. Please:

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ⚠️ Privacy Considerations

This application is designed to work completely locally:

- **No data is sent to external servers**
- **All processing occurs on your machine**
- **LM Studio runs models locally**
- **Audio never leaves your device** (except for local processing)

## 📞 Support

If you encounter any problems or have questions:

1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with problem details

---

**Enjoy chatting with your local AI! 🎉**