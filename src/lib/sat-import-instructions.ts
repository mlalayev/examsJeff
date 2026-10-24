export const SAT_IMPORT_INSTRUCTIONS = String.raw`Create a SAT exam package named sat-exam.zip. Do not put files inside an extra parent folder.
Required ZIP layout:
questions.txt (UTF-8 text, at ZIP root)
images/verbal_module_1_q01.png (optional question image)
images/math_module_1_q02_a.png (optional choice A image)

Use only lowercase English letters, numbers, underscores and hyphens in image filenames. PNG, JPG and WEBP only. Include actual image files, not just filenames or links. Never invent missing images. Max ZIP 20 MB, total uncompressed 50 MB, max image 5 MB, max 300 files. questions.txt max 200,000 characters.

questions.txt must contain these exact headings, each once:
[verbal module 1]
[verbal module 2]
[math module 1]
[math module 2]
Start question numbering at 1 in EACH module. Every module needs questions. Do not add a title, Markdown code fences, answer tables or commentary outside the question format.

Multiple choice example:
[verbal module 1]
1. A delivery service models cost $C(d)$ for a trip of $d$ kilometers by $C(d)=21+6d$. What does 6 represent?
a. The distance
b. The initial charge
c. The cost per kilometer
d. The total cost
Answer: C
Explanation: The coefficient of $d$ is the additional cost per kilometer.

Open answer example (within a module):
2. Solve the equation.
$$5x+9=39$$
Type: SHORT_TEXT
Answer: 6
Explanation: Subtract 9 and divide by 5.

For open answers, Answer must be plain text or a plain number, NOT LaTeX. Separate acceptable alternatives with |, e.g. Answer: 0.5 | 1/2. No a-d choices for SHORT_TEXT.
For multiple choice, include exactly a., b., c., d. and Answer: A/B/C/D. Explanation: is optional.

Math: use $...$ for INLINE expressions embedded in sentences. Use $$...$$ only for a separate centered equation, never around ordinary sentences. Fractions: $\frac{1}{2}$; powers: $x^{2}$; roots: $\sqrt{x}$; subscripts: $a_1$; inequalities: $x\leq5$. Use single backslashes in this plain text file. For money, write dollars or escape the currency symbol as \$. Preserve readable sentence flow; do not center every mathematical symbol.

For a question image, put this on its own line after the question text:
[Image: images/math_module_1_q01.png]
For a choice image, put the marker on the SAME line as the choice:
a. Optional choice text [Image: images/math_module_1_q01_a.png]
Names in markers must match the ZIP exactly. One image per question and per choice. Do not use image markers in explanations. Without images, a plain questions.txt file or pasted text also works.

Check all correct answers and explanations; supply all four modules. Images can be edited later. Save Questions adds editable question cards; Save Exam persists the exam.`;

export const MATH_IMPORT_INSTRUCTIONS = SAT_IMPORT_INSTRUCTIONS
  .replace('a SAT exam package named sat-exam.zip', 'a Math exam package named math-exam.zip')
  .replace('images/verbal_module_1_q01.png', 'images/math_module_1_q01.png')
  .replace('[verbal module 1]\n[verbal module 2]\n', '')
  .replace('[verbal module 1]', '[math module 1]')
  .replace('all four modules', 'both Math modules (no Verbal modules)');
