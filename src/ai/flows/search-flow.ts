'use server';
/**
 * @fileOverview An AI-powered search flow for finding music.
 *
 * - searchMusic - A function that enhances search queries to find music.
 * - SearchMusicInput - The input type for the searchMusic function.
 * - SearchMusicOutput - The return type for the searchMusic function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SearchMusicInputSchema = z.object({
  query: z.string().describe('The user\'s search query for music.'),
});
export type SearchMusicInput = z.infer<typeof SearchMusicInputSchema>;

const SearchMusicOutputSchema = z.object({
  correctedQuery: z
    .string()
    .describe(
      'The corrected and optimized search query. This may include corrected spelling, expanded abbreviations (like idk to "i dont know"), or a more structured query if the model deems it necessary.'
    ),
  searchIntent: z
    .enum(['artist', 'album', 'song', 'general'])
    .describe('The inferred intent of the search query.'),
});
export type SearchMusicOutput = z.infer<typeof SearchMusicOutputSchema>;

export async function searchMusic(
  input: SearchMusicInput
): Promise<SearchMusicOutput> {
  return searchMusicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchMusicPrompt',
  input: { schema: SearchMusicInputSchema },
  output: { schema: SearchMusicOutputSchema },
  prompt: `You are a music search assistant. Your task is to take a user's search query and improve it for a database search.

- Correct any spelling mistakes (e.g., "Chapell roan" becomes "Chappell Roan").
- Expand common abbreviations (e.g., "idk" becomes "i dont know").
- Determine if the user is likely searching for an 'artist', 'album', 'song', or if it's a 'general' query.
- Return the corrected query and the search intent.

User query: {{{query}}}`,
});

const searchMusicFlow = ai.defineFlow(
  {
    name: 'searchMusicFlow',
    inputSchema: SearchMusicInputSchema,
    outputSchema: SearchMusicOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
