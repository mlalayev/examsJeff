import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import FormattedText from '@/components/FormattedText';
import { splitMathText } from './math-text';

test('delivery-cost sentence keeps all three expressions inline', () => {
  const html = renderToStaticMarkup(<FormattedText text={'A service models $C(d)$ for $d$ kilometers by $C(d)=21+6d$.'} />);
  expect(html.match(/exam-math-inline/g)).toHaveLength(3);
  expect(html).not.toContain('exam-math-display');
  expect(html).toContain('katex');
});
test('display fractions and powers use centered block and accessible math markup', () => {
  const html = renderToStaticMarkup(<FormattedText text={'Solve:\n$$\\frac{x^{2}}{\\sqrt{4}}=8$$'} />);
  expect(html).toContain('exam-math-display');
  expect(html).toContain('mfrac');
  expect(html).toContain('msup');
  expect(html).toContain('msqrt');
});
test('math parsing precedes legacy newline/formatting processing', () => {
  const html = renderToStaticMarkup(<FormattedText text={'**Compare** $x\\neq y$ and $a_{12}$'} />);
  expect(html).not.toContain('katex-error');
  expect(html).toContain('font-bold');
});
test('plain currency and escaped dollar signs are not formulas', () => {
  expect(splitMathText('Costs $5 and $10.').some(p => p.math)).toBe(false);
  expect(splitMathText('Costs \\$5.').some(p => p.math)).toBe(false);
});
test('unsafe commands are not trusted and malformed math does not crash', () => {
  const html = renderToStaticMarkup(<FormattedText text={'$\\href{javascript:alert(1)}{click}$ $$\\frac{$$ <script>alert(1)</script>'} />);
  expect(html).not.toContain('href="javascript:');
  expect(html).not.toContain('<script>');
  expect(html).toContain('katex-error');
});
