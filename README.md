# AI Call Center

A modern, real-time AI-powered call center application built with Next.js, featuring voice interaction, real-time transcription, and conversation management.

![AI Call Center Dashboard](docs/images/dashboard.png)

## Features

- 🎙️ Real-time voice interaction with AI
- 💬 Natural language processing
- 📝 Live transcription
- 📊 Call analytics and metrics
- 🔄 Real-time status updates
- 📱 Responsive design
- 📂 Call history and transcripts
- 🎯 Performance tracking

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **UI Components**: Shadcn/ui, Tailwind CSS
- **State Management**: Zustand
- **Voice Processing**: Web Speech API
- **AI Integration**: Custom AI service
- **Analytics**: Real-time metrics processing

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v18.0.0 or higher)
- npm or yarn
- Modern web browser with Web Speech API support

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-call-center.git
cd ai-call-center
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your configuration.

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

The application follows a modular architecture with clear separation of concerns:

```
ai-call-center/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Dashboard page
│   ├── call/              # Call interface
│   └── transcript/        # Call transcripts
├── components/            # Reusable UI components
├── lib/                   # Core utilities and services
│   ├── store.ts          # State management
│   ├── chat-service.ts   # AI chat integration
│   └── voice-service.ts  # Voice processing
└── types/                # TypeScript definitions
```

For detailed architecture diagrams, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Usage Guide

### Starting a Call

1. Click "Start New Call" on the dashboard
2. Grant microphone permissions when prompted
3. Begin speaking naturally with the AI assistant
4. Use the microphone toggle to mute/unmute
5. End call using the phone button

### Managing Calls

- View active calls on the dashboard
- Access call history and transcripts
- Monitor performance metrics
- Track success rates and durations

For detailed usage instructions, see [USAGE.md](docs/USAGE.md).

## Development

### Project Structure

```
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── custom/           # Custom components
├── lib/                  # Core functionality
│   ├── store.ts         # State management
│   ├── chat-service.ts  # AI integration
│   └── voice-service.ts # Voice processing
└── types/               # TypeScript types
```

### Key Components

- **VoiceService**: Handles voice input/output using Web Speech API
- **ChatService**: Manages AI conversation flow
- **CallStore**: Central state management
- **UI Components**: Modular, reusable interface elements

For development guidelines, see [CONTRIBUTING.md](docs/CONTRIBUTING.md).

## Performance Considerations

- Voice processing optimized for continuous input
- State management with efficient updates
- Responsive design for all devices
- Error recovery and graceful degradation

## Security

- No sensitive data storage
- Secure API communication
- Microphone permissions management
- Session handling

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## Support

For support, please open an issue or contact the maintainers. 