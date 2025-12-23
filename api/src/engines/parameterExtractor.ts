export interface ExtractedParams {
  budget?: number;
  postingCadence?: string;
  duration?: string;
  platforms?: string[];
  websiteUrl?: string;
  paidAdvertisingPercent?: number;
  targetAudience?: string;
  startDate?: string;
  endDate?: string;
  objective?: string;
  campaignName?: string;
  businessGoals?: string;
  brandVoice?: string;
  brandTone?: string;
  contentPillars?: string[];
  keyMessages?: string[];
  successMetrics?: string[];
  contentFormats?: string[];
  custom?: Record<string, string | number>;
}

const PLATFORM_ALIASES: Record<string, string> = {
  instagram: 'Instagram', ig: 'Instagram', insta: 'Instagram',
  facebook: 'Facebook', fb: 'Facebook',
  twitter: 'Twitter', x: 'Twitter',
  tiktok: 'TikTok', tt: 'TikTok',
  linkedin: 'LinkedIn', li: 'LinkedIn',
  youtube: 'YouTube', yt: 'YouTube',
  pinterest: 'Pinterest', pin: 'Pinterest',
  snapchat: 'Snapchat', snap: 'Snapchat',
};

export function extractParamsFromText(text: string): ExtractedParams {
  const out: ExtractedParams = { custom: {} };
  const lower = text.toLowerCase();

  // Budget: "$2,500", "2500 usd", "budget 3k", "3k budget", "$5000 budget"
  const budgetMatch = /(?:budget\s*[:=]?\s*|\$)\s*([\d,.]+)\s*(k|m)?\s*(?:usd|\$)?/i.exec(text);
  if (budgetMatch) {
    let val = parseFloat(budgetMatch[1].replace(/,/g, ''));
    const mult = budgetMatch[2]?.toLowerCase() === 'k' ? 1000 : budgetMatch[2]?.toLowerCase() === 'm' ? 1_000_000 : 1;
    out.budget = Math.round(val * mult);
  }

  // Posting cadence: "daily", "3x/week", "5 per week", "twice a day", "3 times per week", "post 5 times a week"
  const cadencePatterns = [
    { pattern: /(\d+)\s*(?:times?|posts?)\s*(?:per|every|a)\s*week/i, transform: (m: RegExpExecArray) => `${m[1]}x/week` },
    { pattern: /(\d+)\s*x\s*\/\s*week/i, transform: (m: RegExpExecArray) => `${m[1]}x/week` },
    { pattern: /(\d+)\s*(?:per|x)\s*week/i, transform: (m: RegExpExecArray) => `${m[1]}x/week` },
    { pattern: /(\d+)\s*(?:posts?)\s*\/\s*week/i, transform: (m: RegExpExecArray) => `${m[1]}x/week` },
    { pattern: /(\d+)\s*(?:times?|posts?)\s*(?:per|every|a)\s*day/i, transform: (m: RegExpExecArray) => `${m[1]}x/day` },
    { pattern: /(\d+)\s*x\s*\/\s*day/i, transform: (m: RegExpExecArray) => `${m[1]}x/day` },
    { pattern: /daily|once a day|every day|post daily/i, transform: () => 'daily' },
    { pattern: /\btwice a day\b|2x\s*\/\s*day/i, transform: () => '2x/day' },
    { pattern: /weekly|once a week|every week|post weekly/i, transform: () => 'weekly' },
  ];
  for (const { pattern, transform } of cadencePatterns) {
    const m = pattern.exec(lower);
    if (m) {
      out.postingCadence = transform(m);
      break;
    }
  }

  // Duration: "30 days", "3 weeks", "2 months", "for 60 days"
  const durationMatch = /(?:for|over|during)?\s*(\d+)\s*(day|days|week|weeks|month|months)/i.exec(text);
  if (durationMatch) out.duration = `${durationMatch[1]} ${durationMatch[2]}`;

  // Platforms
  const platforms: string[] = [];
  Object.keys(PLATFORM_ALIASES).forEach((alias) => {
    const re = new RegExp(`(?:^|[^a-z])${alias}(?:[^a-z]|$)`, 'i');
    if (re.test(lower)) platforms.push(PLATFORM_ALIASES[alias]);
  });
  if (platforms.length) out.platforms = Array.from(new Set(platforms));

  // Website URL
  const urlMatch = /(https?:\/\/[\w.-]+(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=.]+)?)/i.exec(text);
  if (urlMatch) out.websiteUrl = urlMatch[1];

  // Paid ads percentage: "30% for ads", "50% advertising budget"
  const pctMatch = /(\d{1,3})\s*%\s*(?:for\s*)?(?:ads|advertising|paid)/i.exec(lower);
  if (pctMatch) out.paidAdvertisingPercent = Math.min(100, Math.max(0, parseInt(pctMatch[1], 10)));

  // Target audience: "target young adults", "audience: millennials", "targeting women 25-35"
  const audienceMatch = /(?:target(?:ing)?|audience)\s*[:=]?\s*([\w\s-]{3,50}?)(?:\.|,|$)/i.exec(text);
  if (audienceMatch) out.targetAudience = audienceMatch[1].trim();

  // Start/End dates: "start 01/15/2024", "launch on 2024-01-15", "end by 03-30-2024"
  const startDateMatch = /(?:start|launch|begin)(?:ing)?(?:\s+on)?\s*[:=]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})/i.exec(text);
  if (startDateMatch) out.startDate = startDateMatch[1];
  
  const endDateMatch = /(?:end|finish|conclude)(?:ing)?(?:\s+on|\s+by)?\s*[:=]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})/i.exec(text);
  if (endDateMatch) out.endDate = endDateMatch[1];

  // Objective: "goal is brand awareness", "objective: increase sales", "aim to generate leads"
  const objectiveMatch = /(?:goal|objective|aim)(?:\s+is|\s*[:=])\s*([\w\s-]{5,80}?)(?:\.|,|$)/i.exec(text);
  if (objectiveMatch) out.objective = objectiveMatch[1].trim();

  // Campaign name: "campaign name: Launch 2024", "call it Summer Promo"
  const nameMatch = /(?:campaign\s*name|call\s*it|name\s*it|named?)\s*[:=]?\s*([\w\s-]{3,60}?)(?:\.|,|$)/i.exec(text);
  if (nameMatch) out.campaignName = nameMatch[1].trim();

  // Business goals: similar to objective but may be more specific
  const goalsMatch = /(?:business\s*goals?|goals?)\s*[:=]?\s*([\w\s,-]{5,100}?)(?:\.|;|$)/i.exec(text);
  if (goalsMatch) out.businessGoals = goalsMatch[1].trim();

  // Brand voice/tone: "tone: professional", "voice is casual", "brand voice: witty"
  const voiceMatch = /(?:brand\s*voice|voice|brand\s*tone|tone)\s*[:=]?\s*([\w\s,-]{3,60}?)(?:\.|,|$)/i.exec(text);
  if (voiceMatch) {
    out.brandVoice = voiceMatch[1].trim();
    out.brandTone = voiceMatch[1].trim();
  }

  // Content pillars: "pillars: Education, Proof, Community", "themes: product, support, news"
  const pillarsMatch = /(?:content\s*pillars?|pillars?|themes?)\s*[:=]?\s*([\w\s,.-]{5,150}?)(?:\.|;|$)/i.exec(text);
  if (pillarsMatch) {
    const pillars = pillarsMatch[1].split(/[,;]+/).map(p => p.trim()).filter(p => p.length > 0);
    if (pillars.length > 0) out.contentPillars = pillars;
  }

  // Key messages: "messages: Fast, Reliable, Affordable", "key points: speed, trust"
  const messagesMatch = /(?:key\s*messages?|messages?|key\s*points?)\s*[:=]?\s*([\w\s,.-]{5,150}?)(?:\.|;|$)/i.exec(text);
  if (messagesMatch) {
    const messages = messagesMatch[1].split(/[,;]+/).map(m => m.trim()).filter(m => m.length > 0);
    if (messages.length > 0) out.keyMessages = messages;
  }

  // Success metrics: "metrics: CTR, conversions, ROI", "KPIs: engagement, reach"
  const metricsMatch = /(?:success\s*metrics?|metrics?|KPIs?)\s*[:=]?\s*([\w\s,%.-]{5,150}?)(?:\.|;|$)/i.exec(text);
  if (metricsMatch) {
    const metrics = metricsMatch[1].split(/[,;]+/).map(m => m.trim()).filter(m => m.length > 0);
    if (metrics.length > 0) out.successMetrics = metrics;
  }

  // Content formats: "formats: Reels, carousels, stories", "using videos and images"
  const formatsMatch = /(?:content\s*formats?|formats?|types?|using)\s*[:=]?\s*([\w\s,.-]{5,150}?)(?:\.|;|$)/i.exec(text);
  if (formatsMatch) {
    const formats = formatsMatch[1].split(/[,;]+/).map(f => f.trim()).filter(f => f.length > 2);
    if (formats.length > 0) out.contentFormats = formats;
  }

  // Simple custom key:value pairs e.g. "tone: witty", "maxLength=120"
  const kvRe = /(\b[a-zA-Z][\w-]{1,32}\b)\s*[:=]\s*([\w\- ]{1,80})/g;
  let km: RegExpExecArray | null;
  while ((km = kvRe.exec(text))) {
    const key = km[1];
    const val = km[2].trim();
    // Skip if already extracted as known field
    if (['budget', 'target', 'audience', 'goal', 'objective', 'start', 'end', 'launch', 'begin', 'finish'].includes(key.toLowerCase())) continue;
    out.custom![key] = /^[0-9.]+$/.test(val) ? Number(val) : val;
  }

  return out;
}
