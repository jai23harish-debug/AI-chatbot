import React, { useState } from 'react';
import './messageinput.css';

function MessageInput({ onSendMessage, isLoading }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="message-input-form" onSubmit={handleSubmit}>
      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isLoading}
          rows={1}
          className="message-textarea"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="send-button"
        >
          {isLoading ? (
            <span className="loading-icon">⏳</span>
          ) : (
            <span>➤</span>
          )}
        </button>
      </div>
      <div className="input-footer">
        <span>Press Enter to send, Shift+Enter for new line</span>
        {isLoading && <span className="thinking-text">Agent is thinking...</span>}
      </div>
    </form>
  );
}

export default MessageInput;