import React, { useRef, useEffect } from 'react';
import MessageBubble from './messagebubble';
import MessageInput from './messageinput';
import './chatwindow.css';

function ChatWindow({ messages, onSendMessage, onReset, isLoading, intentState, confidence }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const starterQuestions = [
    'What solutions do you offer for sales teams?',
    'How does your pricing compare to competitors?',
    'Can I see a demo of your product?',
    'What integrations do you support?',
  ];

  const getIntentLabel = () => {
    if (intentState === 'exploring') return 'Exploring';
    if (intentState === 'comparing') return 'Comparing';
    if (intentState === 'decision-ready') return 'Decision Ready';
    return 'Unknown';
  };

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-avatar">
            <span>🤖</span>
          </div>
          <div className="chat-info">
            <h2>Agentic Sales Consultant</h2>
            <div className="chat-status">
              <span className="status-dot"></span>
              <span>Online - Ready to assist</span>
            </div>
          </div>
        </div>
        <div className="chat-header-right">
          <div className={`intent-badge intent-${intentState}`}>
            {getIntentLabel()} {Math.round(confidence * 100)}%
          </div>
          <button className="reset-button" onClick={onReset} title="Reset Conversation">
            ↻
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-area">
        {messages.length === 0 ? (
          <div className="welcome-screen">
            <div className="welcome-icon">💬</div>
            <h3>Welcome to Your Sales Consultant</h3>
            <p>I'm an adaptive AI agent designed to understand your needs and provide value before any sales pitch. Start a conversation to explore how we can help.</p>
            <div className="starter-questions">
              {starterQuestions.map((question, idx) => (
                <button key={idx} className="starter-button" onClick={() => onSendMessage(question)}>
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="typing-indicator">
                <div className="typing-bubble">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
}

export default ChatWindow;