import React from 'react';
import './messagebubble.css';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
      <div className="bubble-content">
        <div className="bubble-header">
          <span className="sender-name">{isUser ? 'You' : 'Sales Consultant'}</span>
        </div>
        <p className="bubble-text">{message.content}</p>
        
        {!isUser && message.intentState && (
          <div className="bubble-meta">
            <span className={`meta-badge intent-${message.intentState}`}>
              Intent: {message.intentState}
            </span>
            {message.confidence && (
              <span className="meta-confidence">
                ({Math.round(message.confidence * 100)}% confidence)
              </span>
            )}
          </div>
        )}
        
        <div className="bubble-time">{formatTime(message.timestamp)}</div>
      </div>
    </div>
  );
}

export default MessageBubble;