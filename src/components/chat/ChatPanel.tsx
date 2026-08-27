import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../../types/game';

interface ChatPanelProps {
  messages: ChatMessage[];
  characterName: string;
  isThinking: boolean;
  onSendMessage: (text: string) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onClose?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  characterName,
  isThinking,
  onSendMessage,
  voiceEnabled,
  onToggleVoice,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'How do I look in this outfit? 👗',
    'Tell me a fun fashion tip! ✨',
    'What mini-game should we play? 🎮',
    'Tell me a witty joke! 😄',
    'How is your day going? 🌸',
  ];

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Speech Recognition (Web Speech API)
  const handleMicToggle = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. You can type your message!');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-[2rem] p-4 border border-white shadow-sm text-[#4A2D44]">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 mb-2 border-b border-pink-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          <h3 className="text-sm font-black uppercase tracking-wider">Talk with {characterName}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleVoice}
            title={voiceEnabled ? 'Voice output ON' : 'Voice output OFF'}
            className={`p-1.5 rounded-full text-xs font-bold transition-all ${
              voiceEnabled ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {voiceEnabled ? '🔊 Voice' : '🔇 Mute'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 hover:text-pink-500 font-bold flex items-center justify-center text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 min-h-[160px]" style={{ scrollbarWidth: 'thin' }}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-400">
            <span className="text-3xl mb-1">✨</span>
            <p className="text-xs font-bold">Say hello to {characterName}!</p>
            <span className="text-[10px] text-gray-400">Powered by Gemini AI</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-[#FF70A6] text-white rounded-br-xs'
                      : 'bg-pink-50 text-[#4A2D44] border border-pink-100 rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-gray-400 px-1 mt-0.5">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}

        {isThinking && (
          <div className="flex items-center gap-1.5 bg-pink-50 p-2.5 rounded-2xl w-fit border border-pink-100">
            <div className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
            <div className="w-2 h-2 rounded-full bg-pink-400 animate-ping delay-100" />
            <div className="w-2 h-2 rounded-full bg-pink-400 animate-ping delay-200" />
            <span className="text-[10px] font-bold text-pink-500 ml-1">{characterName} is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="py-2 overflow-x-auto no-scrollbar flex gap-1.5">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSendMessage(prompt)}
            className="text-[10px] bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold px-2.5 py-1 rounded-full whitespace-nowrap border border-pink-200 shrink-0 active:scale-95"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="relative flex items-center gap-1.5 pt-1">
        <button
          onClick={handleMicToggle}
          title="Speak via Microphone"
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-all ${
            isListening
              ? 'bg-red-500 text-white animate-pulse border-red-300'
              : 'bg-pink-100 text-pink-600 border-pink-200 hover:bg-pink-200'
          }`}
        >
          {isListening ? '🎙️' : '🎤'}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Talk with ${characterName}...`}
          className="flex-1 bg-[#F5F5F5] py-2.5 px-3.5 rounded-full border-2 border-transparent focus:border-pink-300 outline-none text-xs font-medium placeholder:text-gray-400 text-[#4A2D44]"
        />

        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="bg-[#FF70A6] disabled:opacity-40 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm hover:bg-[#ff5b9a] shrink-0"
        >
          →
        </button>
      </div>
    </div>
  );
};
