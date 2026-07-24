import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { parse } from '@babel/parser';
import _generate from '@babel/generator';
const generate = _generate.default || _generate;

async function removeComments() {
  const files = await glob('src/**/*.{js,jsx}');
  console.log(`Found ${files.length} files.`);

  let modifiedCount = 0;

  for (const file of files) {
    const fullPath = path.resolve(file);
    const code = fs.readFileSync(fullPath, 'utf8');

    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx']
      });

      const output = generate(ast, {
        retainLines: false,
        comments: false,
      }, code);

      fs.writeFileSync(fullPath, output.code, 'utf8');
      modifiedCount++;
    } catch (e) {
      console.error(`Error processing ${file}: ${e.message}`);
    }
  }

  console.log(`Processed and removed comments from ${modifiedCount} files.`);
}

removeComments();
