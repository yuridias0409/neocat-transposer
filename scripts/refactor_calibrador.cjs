const fs = require('fs');

fs.renameSync('src/views/pages/Calibrador/Calibrador.jsx', 'src/features/calibrador/Calibrador.jsx');
fs.renameSync('src/views/pages/Calibrador/Calibrador.css', 'src/features/calibrador/Calibrador.css');

let content = fs.readFileSync('src/features/calibrador/Calibrador.jsx', 'utf8');

// Update imports
content = content.replace(/\.\.\/\.\.\/\.\.\/utils\//g, '../../domain/');
content = content.replace(/\.\.\/\.\.\/\.\.\/dao\//g, '../../api/');

fs.writeFileSync('src/features/calibrador/Calibrador.jsx', content, 'utf8');

let appContent = fs.readFileSync('src/App.jsx', 'utf8');
appContent = appContent.replace(/views\/pages\/Calibrador\/Calibrador/g, 'features/calibrador/Calibrador');
fs.writeFileSync('src/App.jsx', appContent, 'utf8');

console.log("Moved Calibrador.");
