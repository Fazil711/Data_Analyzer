
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { SendIcon, UserIcon, BotIcon } from './icons';

// A simple markdown renderer
const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
    const format = (text: string) => {
        // Bold, Italic, Code blocks, etc.
        let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-gray-700 text-sm rounded px-1 py-0.5 font-mono">$1</code>');
        formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 p-3 rounded-md my-2 overflow-x-auto"><code class="text-sm font-mono">$1</code></pre>');
        // lists
        formatted = formatted.replace(/^\s*\n\*/gm, '<ul>*');
        formatted = formatted.replace(/^(\s*)\*(.*)/gm, '$1<li>$2</li>');
        formatted = formatted.replace(/<\/li>\n<ul>/gm, '<ul>');
        formatted = formatted.replace(/<\/li>\n<\/ul>/g, '</ul>');
        return { __html: formatted };
    }

    return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={format(content)} />;
};

const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  const bgColor = isUser ? 'bg-indigo-600' : 'bg-gray-700';
  const textColor = message.isError ? 'text-red-400' : 'text-gray-200';
  const alignment = isUser ? 'items-end' : 'items-start';
  const icon = isUser ? <UserIcon /> : <BotIcon />;

  return (
    <div className={`flex flex-col my-2 ${alignment}`}>
      <div className="flex items-start gap-3 max-w-2xl">
        {!isUser && <div className="p-2 bg-gray-800 rounded-full mt-1">{icon}</div>}
        <div className={`px-4 py-3 rounded-xl ${bgColor} ${textColor}`}>
          <SimpleMarkdown content={message.content} />
        </div>
        {isUser && <div className="p-2 bg-gray-800 rounded-full mt-1">{icon}</div>}
      </div>
    </div>
  );
};


interface QaSectionProps {
  chatHistory: ChatMessage[];
  onAskQuestion: (question: string) => void;
  isAnswering: boolean;
}

export const QaSection: React.FC<QaSectionProps> = ({ chatHistory, onAskQuestion, isAnswering }) => {
  const [question, setQuestion] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isAnswering) {
      onAskQuestion(question.trim());
      setQuestion('');
    }
  };

  return (
    <div className="flex flex-col flex-grow bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">Ask About Your Data</h2>
            <p className="text-gray-400 text-sm">Use natural language to query your CSV file.</p>
        </div>
        
        <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto">
          {chatHistory.map((msg, index) => (
            <Message key={index} message={msg} />
          ))}
          {isAnswering && chatHistory[chatHistory.length-1]?.role === 'model' && (
             <div className="flex items-start gap-3 max-w-2xl my-2">
                <div className="p-2 bg-gray-800 rounded-full mt-1"><BotIcon /></div>
                <div className="px-4 py-3 rounded-xl bg-gray-700">
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>
             </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Which region had the highest sales?"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
              disabled={isAnswering}
            />
            <button
              type="submit"
              disabled={isAnswering || !question.trim()}
              className="p-3 bg-indigo-600 rounded-lg text-white disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors duration-200"
            >
              <SendIcon />
            </button>
          </form>
        </div>
    </div>
  );
};
