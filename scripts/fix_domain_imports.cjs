const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if(file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const allFiles = walk('src');
let modifiedCount = 0;

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix imports that exactly match /domain (no trailing slash) which meant to be /utils (the file utils.js)
    content = content.replace(/(from\s+['"])(.+?)\/domain(['"])/g, '$1$2/utils$3');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
        console.log(`Fixed imports in ${file}`);
    }
});

console.log(`Fixed imports in ${modifiedCount} files.`);
