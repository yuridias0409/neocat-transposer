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

console.log("Moving Navbar...");
fs.renameSync('src/components/Navbar.jsx', 'src/components/layout/Navbar.jsx');
fs.renameSync('src/components/Navbar.css', 'src/components/layout/Navbar.css');

const allFiles = walk('src');
let modifiedCount = 0;

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/(from\s+['"])(.*?)\/components\/Navbar(['"])/g, '$1$2/components/layout/Navbar$3');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
        console.log(`Updated imports in ${file}`);
    }
});

console.log(`Refactored Navbar imports in ${modifiedCount} files.`);
