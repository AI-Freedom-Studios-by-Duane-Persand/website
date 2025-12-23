export interface Recommendation {
  title: string;
  detail: string;
  type?: 'insight' | 'warning' | 'suggestion' | 'tip';
}

export function generateRecommendations(state: any): Recommendation[] {
  const recs: Recommendation[] = [];
  const budget = num(state.budget);
  const platforms: string[] = arr(state.platforms);
  const cadence = String(state.postingCadence || '').toLowerCase();
  const duration = String(state.duration || '');
  const targetAudience = String(state.targetAudience || '');

  // Budget Analysis
  if (budget && platforms?.length) {
    const paidPct = typeof state.paidAdvertisingPercent === 'number' ? state.paidAdvertisingPercent : 20;
    const paid = Math.round((paidPct / 100) * budget);
    const organic = budget - paid;
    recs.push({
      title: `Budget Split: ${100 - paidPct}% Organic / ${paidPct}% Paid`,
      detail: `Recommend allocating ~$${organic.toLocaleString()} to content (production + time) and ~$${paid.toLocaleString()} to paid amplification for ${platforms.join(', ')}.`,
      type: 'insight',
    });

    // Cost per post analysis
    if (cadence) {
      const postsPerWeek = extractPostsPerWeek(cadence);
      if (postsPerWeek && duration) {
        const weeks = extractWeeks(duration);
        if (weeks) {
          const totalPosts = postsPerWeek * weeks * platforms.length;
          const costPerPost = organic / totalPosts;
          recs.push({
            title: 'Cost Per Post Analysis',
            detail: `At ${cadence} on ${platforms.length} platform(s) for ${duration}, you'll create ~${Math.round(totalPosts)} posts. Budget allows ~$${costPerPost.toFixed(2)} per post for content production.`,
            type: costPerPost < 50 ? 'warning' : 'insight',
          });
        }
      }
    }
  } else if (budget && !platforms?.length) {
    recs.push({
      title: 'Platform Selection Needed',
      detail: 'Your budget is set, but no platforms selected. Instagram and TikTok offer strong ROI for visual brands; LinkedIn works well for B2B.',
      type: 'warning',
    });
  }

  // Posting Cadence
  if (!cadence) {
    recs.push({
      title: 'Suggested Posting Cadence',
      detail: 'Start with 3x/week per primary platform; increase to daily if resources permit and engagement rises.',
      type: 'suggestion',
    });
  } else if (/week/.test(cadence)) {
    const postsPerWeek = extractPostsPerWeek(cadence);
    if (postsPerWeek && postsPerWeek > 5) {
      recs.push({
        title: 'High-Frequency Posting',
        detail: 'Posting 5+ times/week requires strong content pipeline. Consider batching creation and using scheduling tools.',
        type: 'tip',
      });
    }
    recs.push({
      title: 'Cadence Quality Check',
      detail: 'Ensure each post has distinct purpose: value, proof, or product. Reuse best posts as ads.',
      type: 'tip',
    });
  }

  // Platform Synergy
  if (platforms?.includes('Instagram') && !platforms.includes('TikTok')) {
    recs.push({
      title: 'Consider TikTok Cross-Posting',
      detail: 'Short-form vertical videos perform well on both Instagram Reels and TikTok; reuse assets with platform-native captions.',
      type: 'suggestion',
    });
  }

  if (platforms?.includes('LinkedIn') && platforms?.includes('Instagram')) {
    recs.push({
      title: 'Dual-Platform Content Strategy',
      detail: 'LinkedIn audiences value thought leadership and industry insights, while Instagram favors visual storytelling. Tailor content tone accordingly.',
      type: 'tip',
    });
  }

  // Brand Voice
  if (state.website?.title && !state.brandVoice) {
    recs.push({
      title: 'Derive Brand Voice',
      detail: 'Use website headings/hero copy to derive tone (e.g., authoritative, witty). Add brandVoice to ensure consistency in copy.',
      type: 'suggestion',
    });
  }

  // Assets
  if (!state.existingAssets?.length) {
    recs.push({
      title: 'Upload Brand Assets',
      detail: 'Logos, product photos, and short clips boost AI quality. Upload a small set, then expand based on performance.',
      type: 'suggestion',
    });
  } else if (state.existingAssets.length < 5) {
    recs.push({
      title: 'Asset Library Growing',
      detail: `You have ${state.existingAssets.length} asset(s). Aim for 10-15 diverse assets for best results across different post types.`,
      type: 'insight',
    });
  }

  // Duration Analysis
  if (duration) {
    const weeks = extractWeeks(duration);
    if (weeks && weeks < 4) {
      recs.push({
        title: 'Short Campaign Duration',
        detail: 'Campaigns under 4 weeks may not build sustained momentum. Consider 6-8 weeks minimum for measurable impact.',
        type: 'warning',
      });
    }
  }

  // Target Audience
  if (!targetAudience) {
    recs.push({
      title: 'Define Target Audience',
      detail: 'Specific audience targeting (e.g., "small business owners 30-45" vs "everyone") dramatically improves content relevance and conversion.',
      type: 'suggestion',
    });
  }

  // Objective-specific recommendations
  if (state.objective) {
    const obj = String(state.objective).toLowerCase();
    if (/awareness|brand/i.test(obj)) {
      recs.push({
        title: 'Brand Awareness Focus',
        detail: 'Prioritize reach metrics (impressions, video views). Use engaging visuals, storytelling, and educational content.',
        type: 'tip',
      });
    } else if (/conversion|sales|lead/i.test(obj)) {
      recs.push({
        title: 'Conversion-Focused Strategy',
        detail: 'Allocate 30-40% budget to paid ads. Use clear CTAs, landing pages, and retargeting campaigns.',
        type: 'tip',
      });
    }
  }

  return recs;
}

function extractPostsPerWeek(cadence: string): number | undefined {
  const match = cadence.match(/(\d+)\s*x?\s*\/?\s*(?:per\s+)?week/i);
  if (match) return parseInt(match[1], 10);
  if (/daily/i.test(cadence)) return 7;
  if (/weekly/i.test(cadence)) return 1;
  return undefined;
}

function extractWeeks(duration: string): number | undefined {
  const match = duration.match(/(\d+)\s*(week|weeks|month|months|day|days)/i);
  if (!match) return undefined;
  const val = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  if (unit.startsWith('week')) return val;
  if (unit.startsWith('month')) return val * 4;
  if (unit.startsWith('day')) return Math.ceil(val / 7);
  return undefined;
}

function num(x: any): number | undefined {
  const n = typeof x === 'string' ? parseFloat(x) : x;
  return Number.isFinite(n) ? n : undefined;
}
function arr(x: any): any[] { return Array.isArray(x) ? x : []; }
