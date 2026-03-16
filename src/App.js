import React, { useState, useCallback } from 'react';
import './App.css';
import ChatWindow from './components/chatwindow';
import HistoryBox from './components/historybox';
// At the top of App.js, add this import:
import logo from './assets/logo.png';


// Then use it in JSX:
<img src={logo} alt="Logo" className="header-logo" />

// Intent Analysis Keywords
const INTENT_SIGNALS = {
  exploring: {
    keywords: ['what is', 'how does', 'tell me about', 'explain', 'overview', 'learn', 'understand', 'curious', 'looking into', 'research', 'information', 'features', 'capabilities', 'what do you offer', 'what solutions'],
    weight: 0.3,
  },
  comparing: {
    keywords: ['compare', 'vs', 'versus', 'difference', 'competitor', 'alternative', 'better than', 'pricing', 'cost', 'how much', 'budget', 'roi', 'value', 'why should', 'advantage', 'unique', 'salesforce', 'hubspot'],
    weight: 0.6,
  },
  'decision-ready': {
    keywords: ['demo', 'trial', 'sign up', 'start', 'buy', 'purchase', 'implement', 'timeline', 'when can', 'how soon', 'contract', 'proposal', 'next steps', 'get started', 'schedule', 'meeting', 'call', 'onboarding', 'decision', 'ready to'],
    weight: 0.85,
  },
};

// Response Templates
const RESPONSE_TEMPLATES = {
  exploring: [
    "Great question! Let me share some insights about our solution. We specialize in helping sales teams work smarter, not harder. Our platform uses AI to analyze buyer behavior and suggest the perfect timing for outreach. What specific challenges is your team facing right now?",
    "I'd be happy to explain! Our platform is designed to transform how sales teams engage with prospects. Instead of generic outreach, we help you deliver personalized experiences at scale. What drew your interest to learning more about sales solutions?",
    "Excellent! We've built a system that understands buyer intent in real-time, helping sales reps focus on the most promising opportunities. Tell me a bit about your current sales process.",
  ],
  comparing: [
    "Smart to do your research! When comparing solutions, the key differentiators are: real-time intent analysis, contextual memory across interactions, and adaptive engagement strategies. What specific capabilities are most important to you?",
    "Great question about pricing! We offer flexible plans starting at $99/user/month for growth teams. The ROI typically comes from 30-40% improvement in conversion rates. What's your typical deal size?",
    "I appreciate that you're being thorough. Here's what sets us apart: while others use keyword matching, we use behavioral AI to understand buyer psychology. What are you currently using for sales engagement?",
  ],
  'decision-ready': [
    "Fantastic! I can sense you're ready to move forward. We can set up a personalized demo this week where you'll see the platform in action. We also offer a 14-day trial. Which would be more helpful?",
    "Great to hear you're considering us! The next step is typically a 30-minute demo where I can show you features specific to your needs. When would be a good time this week?",
    "You've asked all the right questions. Here's what I suggest: I'll send you a custom proposal, and we can schedule a brief call. If everything looks good, we can have you onboarded within 48 hours. Sound good?",
  ],
};

// Initial context
const createInitialContext = () => ({
  intentState: 'exploring',
  confidence: 0.3,
  extractedInfo: {
    budget: null,
    timeline: null,
    decisionMakers: null,
    companySize: null,
    painPoints: [],
    competitors: [],
  },
  conversationHistory: [],
  sessionStartTime: new Date().toISOString(),
  turnCount: 0,
});

function App() {
  const [context, setContext] = useState(createInitialContext());
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Analyze intent from message
  const analyzeIntent = (message, currentContext) => {
    const lowerMessage = message.toLowerCase();
    let maxWeight = currentContext.confidence;
    let detectedState = currentContext.intentState;

    for (const [state, config] of Object.entries(INTENT_SIGNALS)) {
      const matchedKeywords = config.keywords.filter((keyword) =>
        lowerMessage.includes(keyword.toLowerCase())
      );

      if (matchedKeywords.length > 0) {
        const matchStrength = (matchedKeywords.length / config.keywords.length) * config.weight;
        const newConfidence = Math.min(0.95, currentContext.confidence * 0.7 + matchStrength * 0.3 + 0.1);

        const stateOrder = ['exploring', 'comparing', 'decision-ready'];
        const currentStateIndex = stateOrder.indexOf(currentContext.intentState);
        const newStateIndex = stateOrder.indexOf(state);

        if (newStateIndex >= currentStateIndex && newConfidence > maxWeight) {
          maxWeight = newConfidence;
          detectedState = state;
        }
      }
    }

    const turnBonus = Math.min(0.15, currentContext.turnCount * 0.02);
    return {
      state: detectedState,
      confidence: Math.min(0.95, maxWeight + turnBonus),
    };
  };

  // Extract information from message
  const extractInformation = (message, currentInfo) => {
    const newInfo = { ...currentInfo };

    // Budget extraction
    const budgetMatch = message.match(/\$[\d,]+k?/gi);
    if (budgetMatch) newInfo.budget = budgetMatch[0];

    // Timeline extraction
    const timelineMatch = message.match(/(asap|immediately|this quarter|next quarter|\d+\s*(?:days?|weeks?|months?))/gi);
    if (timelineMatch) newInfo.timeline = timelineMatch[0];

    // Competitors extraction
    const competitors = ['salesforce', 'hubspot', 'pipedrive', 'zoho', 'freshsales'];
    competitors.forEach((comp) => {
      if (message.toLowerCase().includes(comp) && !newInfo.competitors.includes(comp)) {
        newInfo.competitors = [...newInfo.competitors, comp];
      }
    });

    // Pain points extraction
    const painMatch = message.match(/(?:struggling|problem|issue|challenge|frustrated|difficult)\s+(?:with|to)?\s*([^.!?]+)/gi);
    if (painMatch) {
      painMatch.forEach((pain) => {
        if (!newInfo.painPoints.includes(pain.slice(0, 80))) {
          newInfo.painPoints = [...newInfo.painPoints, pain.slice(0, 80)];
        }
      });
    }

    return newInfo;
  };

  // Generate response
  const generateResponse = (intentState) => {
    const templates = RESPONSE_TEMPLATES[intentState];
    return templates[Math.floor(Math.random() * templates.length)];
  };

  // Handle send message
  const handleSendMessage = useCallback(
    async (content) => {
      const userMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Analyze and extract
      const intentAnalysis = analyzeIntent(content, context);
      const extractedInfo = extractInformation(content, context.extractedInfo);

      // Update context
      const newContext = {
        ...context,
        intentState: intentAnalysis.state,
        confidence: intentAnalysis.confidence,
        extractedInfo,
        conversationHistory: [...context.conversationHistory, userMessage],
        turnCount: context.turnCount + 1,
      };
      setContext(newContext);

      // Simulate AI thinking
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Generate response
      const responseContent = generateResponse(newContext.intentState);

      const agentMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
        intentState: newContext.intentState,
        confidence: newContext.confidence,
      };

      setMessages((prev) => [...prev, agentMessage]);
      setContext((prev) => ({
        ...prev,
        conversationHistory: [...prev.conversationHistory, agentMessage],
      }));
      setIsLoading(false);
    },
    [context]
  );

  // Handle reset
  const handleReset = useCallback(() => {
    setContext(createInitialContext());
    setMessages([]);
    setIsLoading(false);
  }, []);

  // Get recommended actions
  const getRecommendedActions = () => {
    const { intentState, confidence, extractedInfo } = context;
    const actions = [];

    if (intentState === 'exploring') {
      actions.push({ action: 'Ask discovery questions', reason: 'Build understanding of buyer needs', priority: 'high' });
      actions.push({ action: 'Share educational content', reason: 'Provide value before selling', priority: 'high' });
    } else if (intentState === 'comparing') {
      actions.push({ action: 'Highlight differentiators', reason: 'Buyer is evaluating options', priority: 'high' });
      if (extractedInfo.competitors.length > 0) {
        actions.push({ action: 'Address competitor comparison', reason: `Buyer mentioned ${extractedInfo.competitors[0]}`, priority: 'high' });
      }
    } else if (intentState === 'decision-ready') {
      actions.push({ action: 'Offer clear next steps', reason: 'Buyer shows purchase intent', priority: 'high' });
      if (confidence >= 0.8) {
        actions.push({ action: 'Propose meeting or demo', reason: 'High intent confidence', priority: 'high' });
      }
    }

    return actions;
  };

  const recommendedActions = getRecommendedActions();
  const canQualify = context.confidence >= 0.6;
  const canClose = context.confidence >= 0.8;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <img src="/assets/logo.png" alt="Logo" className="header-logo" />
          <div className="header-title">
            <h1>Agentic Sales Consultant</h1>
            <p>Adaptive AI-powered buyer engagement</p>
          </div>
        </div>
        <div className="header-right">
          <div className="threshold-indicator">
            <span className={`indicator-dot ${canQualify ? 'active' : ''}`}></span>
            <span>Qualify (60%)</span>
          </div>
          <div className="threshold-indicator">
            <span className={`indicator-dot ${canClose ? 'active' : ''}`}></span>
            <span>Close (80%)</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Left Panel - History Box */}
        <aside className="left-panel">
          <HistoryBox
            context={context}
            intentState={context.intentState}
            confidence={context.confidence}
          />
        </aside>

        {/* Center - Chat Window */}
        <section className="center-panel">
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            onReset={handleReset}
            isLoading={isLoading}
            intentState={context.intentState}
            confidence={context.confidence}
          />
        </section>

        {/* Right Panel - Recommendations */}
        <aside className="right-panel">
          <div className="panel-header">
            <span className="panel-icon">💡</span>
            <h2>Agent Reasoning</h2>
          </div>

          <div className="panel-content">
            {/* Active Strategy */}
            <div className="section">
              <h3>Active Strategy</h3>
              <div className="strategy-card">
                <p className="strategy-title">
                  {context.intentState === 'exploring' && 'Value-First Education'}
                  {context.intentState === 'comparing' && 'Competitive Differentiation'}
                  {context.intentState === 'decision-ready' && 'Closing Assistance'}
                </p>
                <p className="strategy-desc">
                  {context.intentState === 'exploring' && 'Focus on understanding needs and providing educational content.'}
                  {context.intentState === 'comparing' && 'Highlight unique value propositions and address competitor comparisons.'}
                  {context.intentState === 'decision-ready' && 'Facilitate decision-making with clear next steps.'}
                </p>
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="section">
              <h3>Recommended Actions</h3>
              <div className="actions-list">
                {recommendedActions.map((action, idx) => (
                  <div key={idx} className="action-item">
                    <div className={`action-number priority-${action.priority}`}>{idx + 1}</div>
                    <div className="action-content">
                      <p className="action-title">{action.action}</p>
                      <p className="action-reason">{action.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Logic */}
            <div className="section">
              <h3>Decision Logic</h3>
              <div className="logic-display">
                <p>intent_state: "{context.intentState}"</p>
                <p>confidence: {(context.confidence * 100).toFixed(1)}%</p>
                <p>can_qualify: {canQualify ? 'true' : 'false'}</p>
                <p>can_close: {canClose ? 'true' : 'false'}</p>
                <p>turns: {context.turnCount}</p>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;