'use server';
/**
 * @fileOverview NAVIGATOR AI - Advanced Market Analysis Flow
 * Provides intelligent insights based on live digit distribution data.
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
});

const NavigatorAIOutputSchema = z.object({
  analysis: z.string().describe('A concise technical analysis of the current market state.'),
  recommendation: z.string().describe('A clear trading suggestion (Over, Under, or Wait).'),
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

Live Digit Distribution:
{{#each distribution}}
- Digit {{digit}}: {{percentage}}%
{{/each}}

Based on this distribution, identify statistical anomalies. 
Are low digits (0, 1, 2) significantly under-represented compared to high digits (7, 8, 9)? 
Is there a clear "gravity" towards a specific digit?

Provide:
1. A concise technical analysis.
2. A specific recommendation: OVER, UNDER, or WAIT.
3. A confidence score between 0 and 100.

Keep your response professional, data-driven, and very concise.`,
});

export async function getNavigatorAIInsight(input: NavigatorAIInput): Promise<NavigatorAIOutput> {
  const { output } = await navigatorAIPrompt(input);
  return output!;
}
