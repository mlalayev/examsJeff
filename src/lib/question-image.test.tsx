import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QuestionImage } from '@/components/questions/QuestionImage';
import { questionImageSource, questionImageForSave } from './question-image';

test.each([
  { prompt: { image: '/images/edit.png' } },
  { prompt: { imageUrl: '/images/edit.png' } },
  { image: '/images/edit.png', prompt: {} },
])('legacy persisted images reach the actual image renderer: %j', question => {
  const image = questionImageSource(question);
  expect(image).toBe('/images/edit.png');
  expect(renderToStaticMarkup(<QuestionImage imageUrl={image!}/>)).toContain('src="/api/images/edit.png"');
});
test('legacy edit overrides the previous create URL', () => {
  expect(questionImageSource({prompt:{image:'/images/new.png',imageUrl:'/images/old.png'}})).toBe('/images/new.png');
});
test('save replacement canonicalizes both database and prompt fields', () => {
  const old = {image:'/api/images/new.png',prompt:{text:'Question',image:'/images/old.png',imageUrl:'/images/older.png'}};
  const saved = questionImageForSave(old);
  expect(saved).toEqual({image:'/api/images/new.png',prompt:{text:'Question',imageUrl:'/api/images/new.png'}});
  expect(questionImageSource(saved)).toBe('/api/images/new.png');
  expect(old.prompt.image).toBe('/images/old.png');
});
test('explicit removal clears all aliases so removed images cannot reappear', () => {
  const saved = questionImageForSave({image:null,prompt:{text:'Question',image:'/images/old.png',imageUrl:'/images/older.png'}});
  expect(saved).toEqual({image:null,prompt:{text:'Question'}});
  expect(questionImageSource(saved)).toBeNull();
});
test('omitted image field preserves legacy image and unrelated prompt data', () => {
  expect(questionImageForSave({prompt:{text:'Keep',image:'/images/old.png',audio:'audio'}})).toEqual({image:'/images/old.png',prompt:{text:'Keep',imageUrl:'/images/old.png',audio:'audio'}});
});
