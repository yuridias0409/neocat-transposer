const fs = require('fs');

function updateFile(file, replacers) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    for (let r of replacers) {
        content = content.replace(r.search, r.replace);
    }
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
}

updateFile('src/features/admin/CantoSearchSelect.jsx', [
    { search: /\.\.\/\.\.\/\.\.\/data/g, replace: '../../data' }
]);

updateFile('src/features/canto/Canto.jsx', [
    { search: /\.\.\/\.\.\/\.\.\/utils/g, replace: '../../utils' },
    { search: /\.\.\/\.\.\/\.\.\/assets/g, replace: '../../assets' }
]);
