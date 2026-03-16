import React from 'react';
import './historybox.css';

function HistoryBox({ context, intentState, confidence }) {
  const { extractedInfo, conversationHistory, sessionStartTime } = context;
  const sessionDuration = Math.floor((Date.now() - new Date(sessionStartTime).getTime()) / 60000);

  const intentInfo = {
    exploring: { label: 'Exploring', color: 'blue', description: 'Buyer is learning about options' },
    comparing: { label: 'Comparing', color: 'amber', description: 'Evaluating against alternatives' },
    'decision-ready': { label: 'Decision Ready', color: 'green', description: 'Ready to make a purchase decision' },
  };

  const currentIntent = intentInfo[intentState] || intentInfo.exploring;

  const qualificationFields = [
    { key: 'budget', label: 'Budget', icon: '💰' },
    { key: 'timeline', label: 'Timeline', icon: '📅' },
    { key: 'decisionMakers', label: 'Authority', icon: '👤' },
    { key: 'companySize', label: 'Company', icon: '🏢' },
  ];

  const completedFields = qualificationFields.filter((f) => extractedInfo[f.key]).length;
  const qualificationProgress = (completedFields / qualificationFields.length) * 100;

  return (
    <div className="history-box">
      <div className="history-header">
        <span className="header-icon">🧠</span>
        <div>
          <h2>Context Memory</h2>
          <p>Session: {sessionDuration} min</p>
        </div>
      </div>

      <div className="history-content">
        {/* Current Intent State */}
        <section className="history-section">
          <h3>Buyer Intent State</h3>
          <div className={`intent-card intent-${currentIntent.color}`}>
            <div className="intent-header">
              <span className="intent-label">{currentIntent.label}</span>
              <span className="intent-confidence">{Math.round(confidence * 100)}%</span>
            </div>
            <p className="intent-description">{currentIntent.description}</p>
            <div className="intent-progress">
              <div className={`intent-bar bar-${currentIntent.color}`} style={{ width: `${confidence * 100}%` }}></div>
            </div>
          </div>
        </section>

        {/* Intent Journey */}
        <section className="history-section">
          <h3>Buyer Journey</h3>
          <div className="journey-tracker">
            {['exploring', 'comparing', 'decision-ready'].map((state, idx) => {
              const stateOrder = ['exploring', 'comparing', 'decision-ready'];
              const currentIdx = stateOrder.indexOf(intentState);
              const isActive = state === intentState;
              const isPast = idx < currentIdx;

              return (
                <React.Fragment key={state}>
                  <div className={`journey-step ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}>
                    {idx + 1}
                  </div>
                  {idx < 2 && <div className="journey-connector"></div>}
                </React.Fragment>
              );
            })}
          </div>
          <div className="journey-labels">
            <span>Explore</span>
            <span>Compare</span>
            <span>Decide</span>
          </div>
        </section>

        {/* Qualification Progress */}
        <section className="history-section">
          <h3>🎯 Qualification Progress</h3>
          <div className="qualification-list">
            {qualificationFields.map((field) => {
              const value = extractedInfo[field.key];
              return (
                <div key={field.key} className="qualification-item">
                  <div className="qual-left">
                    <span className="qual-icon">{field.icon}</span>
                    <span className="qual-label">{field.label}</span>
                  </div>
                  <div className="qual-right">
                    {value ? (
                      <span className="qual-value captured">{value}</span>
                    ) : (
                      <span className="qual-value not-captured">Not captured</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="qualification-progress">
            <div className="qual-bar" style={{ width: `${qualificationProgress}%` }}></div>
          </div>
          <p className="qual-summary">{completedFields}/{qualificationFields.length} fields captured</p>
        </section>

        {/* Pain Points */}
        {extractedInfo.painPoints?.length > 0 && (
          <section className="history-section">
            <h3>⚠️ Identified Pain Points</h3>
            <div className="pain-points-list">
              {extractedInfo.painPoints.map((pain, idx) => (
                <div key={idx} className="pain-point-item">{pain}</div>
              ))}
            </div>
          </section>
        )}

        {/* Competitors */}
        {extractedInfo.competitors?.length > 0 && (
          <section className="history-section">
            <h3>📊 Competitors Mentioned</h3>
            <div className="competitors-list">
              {extractedInfo.competitors.map((comp, idx) => (
                <span key={idx} className="competitor-tag">{comp}</span>
              ))}
            </div>
          </section>
        )}

        {/* Session Stats */}
        <section className="history-section">
          <h3>⏱️ Session Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{conversationHistory.length}</span>
              <span className="stat-label">Messages</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{conversationHistory.filter((m) => m.role === 'user').length}</span>
              <span className="stat-label">User Inputs</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HistoryBox;