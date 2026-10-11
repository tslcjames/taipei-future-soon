import { cp, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const output = path.resolve('dist');
const sourceFiles = ['index.html', 'styles.css', 'app.js', 'data.json'];
const data = JSON.parse(await readFile('data.json', 'utf8'));

if (data.questions.length !== 48 || new Set(data.questions.map((item) => item.id)).size !== 48) {
  throw new Error('Expected 48 unique questions');
}

await mkdir(output, { recursive: true });
for (const file of sourceFiles) await cp(file, path.join(output, file));
console.log(`Built ${output} with ${data.questions.length} questions.`);
