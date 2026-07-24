const fs = require('fs');

let content = fs.readFileSync('src/components/layout/Navbar.jsx', 'utf8');
content = content.replace(/(from\s+['"])\.\.\/domain/g, '$1../../domain');
content = content.replace(/(from\s+['"])\.\.\/api/g, '$1../../api');
fs.writeFileSync('src/components/layout/Navbar.jsx', content, 'utf8');

console.log("Fixed Navbar.jsx imports.");
