// Intent Analysis Keywords and Patterns
const INTENT_SIGNALS = {
  exploring: {
    keywords: [
      "what is", "how does", "tell me about", "explain", "overview",
      "learn", "understand", "curious", "looking into", "research",
      "information", "features", "capabilities", "what do you offer", "what solutions",
    ],
    weight: 0.3,
  },
  comparing: {
    keywords: [
      "compare", "vs", "versus", "difference", "competitor", "alternative",
      "better than", "pricing", "cost", "how much", "budget", "roi", "value",
      "why should", "advantage", "unique", "salesforce", "hubspot", "competitors",
    ],
    weight: 0.6,
  },
  "decision-ready": {
    keywords: [
      "demo", "trial", "sign up", "start", "buy", "purchase", "implement",
      "timeline", "when can", "how soon", "contract", "proposal", "next steps",
      "get started", "schedule", "meeting", "call", "onboarding", "decision", "ready to",
    ],
    weight: 0.85,
  },
};

// Information extraction patterns
const EXTRACTION_PATTERNS = {
  budget: [/\$[\d,]+k?/gi, /budget.*?(\$?[\d,]+)/gi, /([\d,]+)\s*dollars/gi, /spend.*?([\d,]+)/gi],
  timeline: [/within\s+(\d+\s*(?:days?|weeks?|months?))/gi, /by\s+(q[1-4]|january|february|march|april|may|june|july|august|september|october|november|december)/gi, /(asap|immediately|urgent|this quarter|next quarter)/gi, /(\d+\s*(?:days?|weeks?|months?))/gi],
  companySize: [/(\d+)\s*(?:employees?|people|team members?)/gi, /(small|medium|large|enterprise)\s*(?:company|business|organization)/gi, /(startup|smb|mid-market|enterprise)/gi],
  role: [/(ceo|cto|cfo|coo|vp|director|manager|head of|lead)/gi, /(founder|co-founder|owner)/gi, /(sales|marketing|engineering|product|operations)/gi],
  decisionMakers: [/(?:i|we)\s+(?:make|can make|have)\s+(?:the\s+)?decision/gi, /(?:i'm|i am)\s+the\s+(?:decision\s+)?maker/gi, /need to (?:consult|check with|talk to)\s+(\w+)/gi, /(?:my|our)\s+(?:boss|manager|team|ceo|cto)/gi],
  painPoints: [/(?:struggling|problem|issue|challenge|frustrated|difficult|hard)\s+(?:with|to)?\s*([^.!?]+)/gi, /(?:can't|cannot|unable to)\s+([^.!?]+)/gi, /(?:need|looking for)\s+(?:a|an)?\s*(?:better|improved|more efficient)\s+([^.!?]+)/gi],
  competitors: [/(salesforce|hubspot|pipedrive|zoho|freshsales|monday|notion|asana|jira)/gi, /(?:currently using|tried|evaluated)\s+(\w+)/gi],
};

// Analyze intent from message
export function analyzeIntent(message, currentContext) {
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

      const stateOrder = ["exploring", "comparing", "decision-ready"];
      const currentStateIndex = stateOrder.indexOf(currentContext.intentState);
      const newStateIndex = stateOrder.indexOf(state);

      if (newStateIndex >= currentStateIndex && newConfidence > maxWeight) {
        maxWeight = newConfidence;
        detectedState = state;
      }
    }
  }

  const turnBonus = Math.min(0.15, currentContext.turnCount * 0.02);
  const finalConfidence = Math.min(0.95, maxWeight + turnBonus);

  return {
    state: detectedState,
    confidence: finalConfidence,
    signals: detectSignals(lowerMessage),
  };
}

function detectSignals(message) {
  const signals = [];
  for (const [state, config] of Object.entries(INTENT_SIGNALS)) {
    const matched = config.keywords.filter((keyword) => message.includes(keyword.toLowerCase()));
    matched.forEach((keyword) => {
      signals.push({ keyword, type: state, weight: config.weight });
    });
  }
  return signals;
}

// Extract information from message
export function extractInformation(message, currentInfo) {
  const newInfo = { ...currentInfo };

  for (const pattern of EXTRACTION_PATTERNS.budget) {
    const match = message.match(pattern);
    if (match) { newInfo.budget = match[0]; break; }
  }

  for (const pattern of EXTRACTION_PATTERNS.timeline) {
    const match = message.match(pattern);
    if (match) { newInfo.timeline = match[0]; break; }
  }

  for (const pattern of EXTRACTION_PATTERNS.companySize) {
    const match = message.match(pattern);
    if (match) { newInfo.companySize = match[0]; break; }
  }

  for (const pattern of EXTRACTION_PATTERNS.role) {
    const match = message.match(pattern);
    if (match) { newInfo.role = match[0]; break; }
  }

  for (const pattern of EXTRACTION_PATTERNS.decisionMakers) {
    const match = message.match(pattern);
    if (match) { newInfo.decisionMakers = match[0]; break; }
  }

  for (const pattern of EXTRACTION_PATTERNS.painPoints) {
    const matches = message.matchAll(pattern);
    for (const match of matches) {
      const painPoint = (match[1] || match[0]).trim();
      if (painPoint && !newInfo.painPoints.includes(painPoint)) {
        newInfo.painPoints = [...newInfo.painPoints, painPoint.slice(0, 100)];
      }
    }
  }

  for (const pattern of EXTRACTION_PATTERNS.competitors) {
    const matches = message.matchAll(pattern);
    for (const match of matches) {
      const competitor = (match[1] || match[0]).trim();
      if (competitor && !newInfo.competitors.includes(competitor)) {
        newInfo.competitors = [...newInfo.competitors, competitor];
      }
    }
  }

  return newInfo;
}

// Response templates based on intent state
const RESPONSE_TEMPLATES = {
  exploring: {
    initial: [
      "Great question! Let me share some insights about our solution. We specialize in helping sales teams work smarter, not harder. Our platform uses AI to analyze buyer behavior and suggest the perfect timing for outreach. What specific challenges is your team facing right now?",
      "I'd be happy to explain! Our platform is designed to transform how sales teams engage with prospects. Instead of generic outreach, we help you deliver personalized experiences at scale. What drew your interest to learning more about sales solutions?",
    ],
    followUp: [
      "That's a common challenge we hear. Many teams struggle with {painPoint}. Our solution addresses this by providing AI-driven insights that help prioritize the right prospects. Would you like to know more about how this works in practice?",
    ],
  },
  comparing: {
    initial: [
      "Smart to do your research! When comparing solutions, the key differentiators to look for are: real-time intent analysis, contextual memory across interactions, and adaptive engagement strategies. Unlike traditional tools, we don't rely on rigid qualification scripts. What specific capabilities are most important to you?",
    ],
    withCompetitor: [
      "Ah, {competitor} is a solid option. The main difference is our adaptive approach - we automatically adjust strategies based on buyer signals, whereas {competitor} requires more manual configuration. Our customers typically see 35% faster deal cycles after switching. What specific features are you comparing?",
    ],
    pricing: [
      "Great question about pricing! We offer flexible plans starting at $99/user/month for growth teams, with enterprise options for larger organizations. The ROI typically comes from 30-40% improvement in conversion rates and 25% reduction in sales cycle length. What's your typical deal size?",
    ],
  },
  "decision-ready": {
    initial: [
      "Fantastic! I can sense you're ready to move forward. Let me help make this easy. We can set up a personalized demo this week where you'll see the platform in action with your actual use cases. We also offer a 14-day trial so you can test it with your team. Which would be more helpful?",
    ],
    withBudget: [
      "Perfect timing! Based on what you've shared about {budget}, our Professional plan would be an excellent fit. It includes everything you need to get started, plus dedicated onboarding support. Shall I send over a custom proposal based on your requirements?",
    ],
    withTimeline: [
      "Excellent! Given your {timeline} timeline, we can absolutely make that work. Our typical onboarding takes 1-2 weeks, and you'll start seeing results within the first month. Let's schedule a quick call to discuss implementation details - does tomorrow or Thursday work better?",
    ],
    close: [
      "You've asked all the right questions, and it sounds like we're a great fit for your needs. Here's what I suggest: I'll send you a custom proposal based on our conversation, and we can schedule a brief call to address any final questions. If everything looks good, we can have you onboarded within 48 hours. Sound good?",
    ],
  },
};

// Generate response based on context
export function generateResponse(context) {
  const { intentState, confidence, extractedInfo, conversationHistory } = context;
  const templates = RESPONSE_TEMPLATES[intentState];
  let response = "";
  let strategy = "";

  if (intentState === "exploring") {
    if (conversationHistory.length <= 2) {
      response = randomChoice(templates.initial);
      strategy = "Initial value education";
    } else if (extractedInfo.painPoints.length > 0) {
      response = randomChoice(templates.followUp).replace("{painPoint}", extractedInfo.painPoints[extractedInfo.painPoints.length - 1]);
      strategy = "Pain point acknowledgment";
    } else {
      response = randomChoice(templates.initial);
      strategy = "General education";
    }
  } else if (intentState === "comparing") {
    if (extractedInfo.competitors.length > 0) {
      response = randomChoice(templates.withCompetitor).replace("{competitor}", extractedInfo.competitors[0]);
      strategy = "Competitive differentiation";
    } else if (extractedInfo.budget || conversationHistory.some((m) => m.content.toLowerCase().includes("price"))) {
      response = randomChoice(templates.pricing).replace("{companySize}", extractedInfo.companySize || "your");
      strategy = "Value-based pricing";
    } else {
      response = randomChoice(templates.initial);
      strategy = "Unique value proposition";
    }
  } else if (intentState === "decision-ready") {
    if (extractedInfo.budget) {
      response = randomChoice(templates.withBudget).replace("{budget}", extractedInfo.budget);
      strategy = "Budget-aligned closing";
    } else if (extractedInfo.timeline) {
      response = randomChoice(templates.withTimeline).replace("{timeline}", extractedInfo.timeline);
      strategy = "Timeline-driven closing";
    } else if (confidence >= 0.85) {
      response = randomChoice(templates.close);
      strategy = "Direct close";
    } else {
      response = randomChoice(templates.initial);
      strategy = "Soft close with options";
    }
  }

  return { content: response, strategy };
}

// Get recommended actions based on state
export function getRecommendedActions(intentState, confidence, extractedInfo) {
  const actions = [];

  if (intentState === "exploring") {
    actions.push({ action: "Ask discovery questions", reason: "Build understanding of buyer needs", priority: "high" });
    actions.push({ action: "Share educational content", reason: "Provide value before selling", priority: "high" });
    if (!extractedInfo.painPoints.length) {
      actions.push({ action: "Probe for pain points", reason: "Identify specific challenges to address", priority: "medium" });
    }
  } else if (intentState === "comparing") {
    actions.push({ action: "Highlight differentiators", reason: "Buyer is evaluating options", priority: "high" });
    if (extractedInfo.competitors.length > 0) {
      actions.push({ action: "Address competitor comparison", reason: `Buyer mentioned ${extractedInfo.competitors[0]}`, priority: "high" });
    }
    if (!extractedInfo.budget) {
      actions.push({ action: "Explore budget parameters", reason: "Qualify financial fit", priority: "medium" });
    }
  } else if (intentState === "decision-ready") {
    actions.push({ action: "Offer clear next steps", reason: "Buyer shows purchase intent", priority: "high" });
    if (confidence >= 0.8) {
      actions.push({ action: "Propose meeting or demo", reason: "High intent confidence", priority: "high" });
    }
    actions.push({ action: "Address remaining concerns", reason: "Remove final barriers", priority: "medium" });
  }

  return actions;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}