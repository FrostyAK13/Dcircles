'use server';
/**
 * @fileOverview NAVIGATOR AI - Advanced Market Analysis Flow
 * Provides intelligent insights based on live digit distribution data and specific trade types.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NavigatorAIInputSchema = z.object({
  symbol: z.string(),
  latestPrice: z.number().nullable(),
  distribution: z.array(z.object({
    digit: z.number(),
    percentage: z.number(),
  })),
  windowSize: z.number(),
  tradeType: z.enum(['OVER_UNDER', 'EVEN_ODD', 'MATCHES', 'RISE_FALL', 'HIGHER_LOWER', 'ONLY_UPS_DOWNS']),
});

const NavigatorAIOutputSchema = z.object({
  analysis: z.string().describe('A concise technical analysis of the current market state for the specific trade type.'),
  recommendation: z.string().describe('A clear trading suggestion (e.g., OVER, UNDER, EVEN, ODD, BUY, SELL, or WAIT).'),
  confidence: z.number().describe('Confidence level as a percentage (0-100).'),
});

export type NavigatorAIInput = z.infer<typeof NavigatorAIInputSchema>;
export type NavigatorAIOutput = z.infer<typeof NavigatorAIOutputSchema>;

const navigatorAIPrompt = ai.definePrompt({
  name: 'navigatorAIPrompt',
  input: { schema: NavigatorAIInputSchema },
  output: { schema: NavigatorAIOutputSchema },
  prompt: `You are the NAVIGATOR AI, a world-class trading expert specializing in binary options and digit distribution patterns.
  
Analyze the live market data for the index: {{symbol}}
Current Price: {{latestPrice}}
Analysis Window: {{windowSize}} ticks
Strategy Focus: {{tradeType}}

Live Digit Distribution:
{{#each distribution}}
- Digit {{digit}}: {{percentage}}%
{{/each}}

Based on this distribution and the specific Strategy Focus ({{tradeType}}), identify statistical anomalies and momentum shifts.

Focus areas per strategy:
- OVER_UNDER: Look for digit gravity away from or towards thresholds.
- EVEN_ODD: Analyze the balance between even (0,2,4,6,8) and odd (1,3,5,7,9) distributions.
- MATCHES: Identify highly frequent digits (potential "Hot Digits") or rare ones (potential "Cold Digits").
- RISE_FALL: Correlate digit patterns with recent price direction.
- HIGHER_LOWER: Analyze volatility and barriers.
- ONLY_UPS_DOWNS: Look for extreme consecutive price movements.

Provide:
1. A concise technical analysis specific to {{tradeType}}.
2. A specific recommendation based on the strategy.
3. A confidence score between 0 and 100.

Keep your response professional, data-driven, and very concise.`,
});

export async function getNavigatorAIInsight(input: NavigatorAIInput): Promise<NavigatorAIOutput> {
  const { output } = await navigatorAIPrompt(input);
  return output!;
}
