const create = jest.fn();
jest.mock('@/lib/openai-client', () => ({ getOpenAI: () => ({ chat: { completions: { create } } }) }));
import { scoreGeneralWriting, writingText, writingSourceHash } from './general-writing-ai';
test('one A1 essay uses General English rubric and a validated percentage', async () => {
  create.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ score: 75, feedback: 'Use past tense consistently.' }) } }] });
  expect(await scoreGeneralWriting({ text: 'Describe your town' }, 'My town is small.', 'A1')).toEqual({ score: 75, feedback: 'Use past tense consistently.' });
  expect(create.mock.calls[0][0].messages[0].content).toContain('not IELTS');
  expect(JSON.parse(create.mock.calls[0][0].messages[1].content).level).toBe('A1');
});
test('rejects invalid AI grades', async () => {
  create.mockResolvedValue({ choices: [{ message: { content: '{"score":120,"feedback":"Fine"}' } }] });
  await expect(scoreGeneralWriting('Task', 'Answer', 'B1')).rejects.toThrow();
});
test('blank answer gets zero without an AI call', async () => {
  create.mockClear();
  expect((await scoreGeneralWriting('Task', '', null)).score).toBe(0);
  expect(create).not.toHaveBeenCalled();
});
test('reads legacy answer shapes and invalidates cache after answer changes', () => {
  expect(writingText({ '0': ' My answer ' })).toBe('My answer');
  expect(writingText({ text: 'Essay' })).toBe('Essay');
  expect(writingSourceHash('Prompt', 'Before', 'A1')).not.toBe(writingSourceHash('Prompt', 'After', 'A1'));
});
