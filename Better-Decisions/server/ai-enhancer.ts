import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface PREnhancementInput {
  title: string;
  body: string | null;
  filesChanged: number;
  additions: number;
  deletions: number;
  labels: string[];
}

export interface PREnhancementOutput {
  description: string;
  summary: string;
  impact: 'high' | 'medium' | 'low';
  isDecision: boolean;
  actionItems: string[];
  keyTakeaways: string[];
}

export interface SentryEnhancementInput {
  title: string;
  culprit: string;
  count: number;
  userCount: number;
  level: 'error' | 'warning' | 'info' | 'fatal';
  firstSeen: string;
  lastSeen: string;
}

export interface SentryEnhancementOutput {
  description: string;
  summary: string;
  impact: 'high' | 'medium' | 'low';
  isDecision: boolean;
  actionItems: string[];
  keyTakeaways: string[];
}

/**
 * Uses Claude AI to analyze a GitHub PR and generate meaningful insights
 */
export async function enhancePRWithAI(
  input: PREnhancementInput
): Promise<PREnhancementOutput> {
  const prompt = `Analyze this GitHub Pull Request and provide structured insights:

**PR Title:** ${input.title}

**PR Description:** ${input.body || 'No description provided'}

**Changes:** ${input.filesChanged} files changed, +${input.additions} -${input.deletions}

**Labels:** ${input.labels.join(', ') || 'None'}

Please provide:

1. **Description** (1-2 sentences): A clear, concise summary suitable for a decision timeline
2. **Summary** (2-3 sentences): What problem was solved, what changed, and why it matters
3. **Impact** (high/medium/low): Based on scope, breaking changes, and criticality
4. **IsDecision** (true/false): Does this represent a significant architectural or technical decision?
5. **ActionItems** (list): Any follow-up tasks or TODOs mentioned
6. **KeyTakeaways** (list): 2-3 key points about what was learned or decided

Respond in JSON format only:
{
  "description": "...",
  "summary": "...",
  "impact": "high|medium|low",
  "isDecision": true|false,
  "actionItems": ["...", "..."],
  "keyTakeaways": ["...", "..."]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const result = JSON.parse(jsonMatch[0]) as PREnhancementOutput;

    // Validate the response
    if (!result.description || !result.summary || !result.impact) {
      throw new Error('Incomplete response from Claude');
    }

    return result;
  } catch (error) {
    console.error('AI enhancement failed:', error);

    // Fallback to basic enhancement if AI fails
    return {
      description: input.title,
      summary: input.body?.substring(0, 500) || 'No description provided',
      impact: input.filesChanged > 10 ? 'high' : input.filesChanged > 3 ? 'medium' : 'low',
      isDecision: input.labels.some(l =>
        l.toLowerCase().includes('breaking') ||
        l.toLowerCase().includes('architecture')
      ),
      actionItems: [],
      keyTakeaways: [],
    };
  }
}

/**
 * Uses Claude AI to analyze a Sentry error and generate meaningful insights
 */
export async function enhanceSentryEventWithAI(
  input: SentryEnhancementInput
): Promise<SentryEnhancementOutput> {
  const prompt = `Analyze this Sentry error and provide structured insights for a decision timeline:

**Error Title:** ${input.title}

**Error Location:** ${input.culprit}

**Occurrences:** ${input.count} events affecting ${input.userCount} users

**Severity:** ${input.level}

**First Seen:** ${input.firstSeen}

**Last Seen:** ${input.lastSeen}

Please provide:

1. **Description** (1-2 sentences): A clear, human-friendly summary of what this error means
2. **Summary** (2-3 sentences): Business impact - why this matters, what users are experiencing, and urgency
3. **Impact** (high/medium/low): Based on frequency, affected users, and severity
4. **IsDecision** (true/false): Does this require an architectural decision or significant technical change?
5. **ActionItems** (list): Suggested concrete next steps to resolve this
6. **KeyTakeaways** (list): 2-3 insights about patterns, root causes, or learnings

Respond in JSON format only:
{
  "description": "...",
  "summary": "...",
  "impact": "high|medium|low",
  "isDecision": true|false,
  "actionItems": ["...", "..."],
  "keyTakeaways": ["...", "..."]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const result = JSON.parse(jsonMatch[0]) as SentryEnhancementOutput;

    // Validate the response
    if (!result.description || !result.summary || !result.impact) {
      throw new Error('Incomplete response from Claude');
    }

    return result;
  } catch (error) {
    console.error('Sentry AI enhancement failed:', error);

    // Fallback to basic enhancement if AI fails
    const impactLevel = input.count > 100 ? 'high' : input.count > 20 ? 'medium' : 'low';
    
    return {
      description: input.title,
      summary: `${input.count} occurrences of ${input.level} in ${input.culprit}. Affecting ${input.userCount} users.`,
      impact: impactLevel,
      isDecision: input.count > 100 || input.level === 'fatal',
      actionItems: ['Investigate error logs', 'Review stack trace', 'Check recent deployments'],
      keyTakeaways: [`Error frequency: ${input.count} events`, `Location: ${input.culprit}`],
    };
  }
}
