const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// 1. Move utils to domain
console.log("Moving utils to domain...");
const utilsFiles = fs.readdirSync('src/utils');
utilsFiles.forEach(file => {
    fs.renameSync(`src/utils/${file}`, `src/domain/${file}`);
});
fs.rmdirSync('src/utils');

// Move dao to api
console.log("Moving dao to api...");
const daoFiles = fs.readdirSync('src/dao');
daoFiles.forEach(file => {
    fs.renameSync(`src/dao/${file}`, `src/api/${file}`);
});
fs.rmdirSync('src/dao');

// Find and replace imports
const allFiles = walk('src');
let modifiedCount = 0;

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace utils/ -> domain/
    content = content.replace(/(from\s+['"])(.*?)\/utils\//g, '$1$2/domain/');
    // Also replace exact '../utils'
    content = content.replace(/(from\s+['"])(.*?)\/utils(['"])/g, '$1$2/domain$3');

    // Replace dao/ -> api/
    content = content.replace(/(from\s+['"])(.*?)\/dao\//g, '$1$2/api/');
    content = content.replace(/(from\s+['"])(.*?)\/dao(['"])/g, '$1$2/api$3');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
        console.log(`Updated imports in ${file}`);
    }
});

console.log(`Refactored imports in ${modifiedCount} files.`);
