import { env } from 'cloudflare:test';
import { expect, it } from 'vitest';
import { getModel } from '../src/ai-models';
import { completeText } from '../src/ai-invoke';
import { consultProAdvisor } from '../src/pro-advisor';
import { OPENCODE_GO_FLASH_MODEL_ID } from '../src/opencode-go';

it.each([
  ['muse-spark-1.3-contributor', 'openai-responses'],
  ['minimax-m3', 'anthropic-messages'],
  ['glm-5.3', 'openai-completions'],
] as const)('performs a real Go request using %s through %s', async (id, api) => {
  if (!env.OPENCODE_GO_API_TOKEN) throw new Error('Authorized Go credential required');
  const model = await getModel(env, {provider:'opencode-go',model:id,apiToken:''},
    {type:'user',id:'isolated-live-proof',name:'Local verification'});
  expect(model.model.api).toBe(api);
  const answer = await completeText(model, {
    systemPrompt:'Answer the question concisely.', prompt:'What is 2 plus 3? Reply with just the number.',
  });
  expect(answer.trim()).toBe('5');
});

it('performs an authenticated Go inference through the production Pi adapter', async () => {
  if (!env.OPENCODE_GO_API_TOKEN) throw new Error('Authorized Go credential required');
  const model = await getModel(env, {
    provider: 'opencode-go', model: OPENCODE_GO_FLASH_MODEL_ID, apiToken: '',
  }, { type: 'user', id: 'isolated-live-proof', name: 'Local verification' });
  const answer = await completeText(model, {
    systemPrompt: 'Answer the question concisely.', prompt: 'What is 2 plus 3? Reply with just the number.',
  });
  expect(answer.trim()).toBe('5');
});

it('performs a nonrecursive Pro consultation with only explicit question and context', async () => {
  if (!env.OPENCODE_GO_API_TOKEN) throw new Error('Authorized Go credential required');
  const answer = await consultProAdvisor(env,
    { type: 'user', id: 'isolated-live-proof', name: 'Local verification' },
    { question: 'Which chapter should be read first? Explain briefly.', context: 'Chapter A introduces fractions. Chapter B assumes fractions and introduces ratios.' });
  expect(answer).toMatch(/Chapter A|chapter A|fractions/i);
  expect(answer.trim().length).toBeGreaterThan(0);
});
