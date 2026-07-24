const fs = require('fs');
const path = require('path');

// Helper to replace content
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

// 1. Move Auth/Login
fs.renameSync('src/views/pages/Login/Login.jsx', 'src/features/auth/Login.jsx');
fs.renameSync('src/views/pages/Login/Login.css', 'src/features/auth/Login.css');

updateFile('src/features/auth/Login.jsx', [
    { search: /\.\.\/\.\.\/\.\.\/dao\//g, replace: '../../api/' },
    { search: /\.\.\/\.\.\/\.\.\/api\//g, replace: '../../api/' },
    { search: /\.\.\/\.\.\/\.\.\/domain\//g, replace: '../../domain/' },
    { search: /\.\.\/\.\.\/\.\.\/services\//g, replace: '../../services/' }
]);

// 2. Move Dashboard
fs.renameSync('src/views/pages/Dashboard/Dashboard.jsx', 'src/features/dashboard/Dashboard.jsx');
fs.renameSync('src/views/pages/Dashboard/Dashboard.css', 'src/features/dashboard/Dashboard.css');

updateFile('src/features/dashboard/Dashboard.jsx', [
    { search: /\.\.\/\.\.\/\.\.\/data/g, replace: '../../data' },
    { search: /\.\.\/\.\.\/\.\.\/domain\//g, replace: '../../domain/' },
    { search: /\.\.\/\.\.\/\.\.\/api\//g, replace: '../../api/' },
    { search: /\.\.\/\.\.\/\.\.\/assets\//g, replace: '../../assets/' }
]);

// 3. Move Admin
fs.renameSync('src/views/pages/Admin/AdminDashboard.jsx', 'src/features/admin/AdminDashboard.jsx');
fs.renameSync('src/views/components/Admin/CantoSearchSelect.jsx', 'src/features/admin/CantoSearchSelect.jsx');

updateFile('src/features/admin/AdminDashboard.jsx', [
    { search: /\.\.\/\.\.\/components\/Admin\/CantoSearchSelect/g, replace: './CantoSearchSelect' },
    { search: /\.\.\/\.\.\/\.\.\/api\//g, replace: '../../api/' },
    { search: /\.\.\/\.\.\/\.\.\/domain\//g, replace: '../../domain/' },
    { search: /\.\.\/\.\.\/\.\.\/data/g, replace: '../../data' },
    { search: /\.\.\/\.\.\/\.\.\/services\//g, replace: '../../services/' }
]);

// 4. Move Canto
fs.mkdirSync('src/features/canto/components', { recursive: true });
fs.renameSync('src/views/pages/Canto/Canto.jsx', 'src/features/canto/Canto.jsx');
fs.renameSync('src/views/pages/Canto/Canto.css', 'src/features/canto/Canto.css');
const cantoComponents = fs.readdirSync('src/views/components/Canto');
for (const file of cantoComponents) {
    fs.renameSync(`src/views/components/Canto/${file}`, `src/features/canto/components/${file}`);
}

updateFile('src/features/canto/Canto.jsx', [
    { search: /\.\.\/\.\.\/components\/Canto\//g, replace: './components/' },
    { search: /\.\.\/\.\.\/\.\.\/data/g, replace: '../../data' },
    { search: /\.\.\/\.\.\/\.\.\/domain\//g, replace: '../../domain/' },
    { search: /\.\.\/\.\.\/\.\.\/api\//g, replace: '../../api/' },
    { search: /\.\.\/\.\.\/\.\.\/controllers\//g, replace: '../../controllers/' }
]);

for (const file of cantoComponents) {
    updateFile(`src/features/canto/components/${file}`, [
        { search: /\.\.\/\.\.\/\.\.\/api\//g, replace: '../../../api/' },
        { search: /\.\.\/\.\.\/\.\.\/domain\//g, replace: '../../../domain/' },
        { search: /\.\.\/\.\.\/\.\.\/utils\//g, replace: '../../../domain/' }
    ]);
}

// 5. Update App.jsx imports
updateFile('src/App.jsx', [
    { search: /views\/pages\/Dashboard\/Dashboard/g, replace: 'features/dashboard/Dashboard' },
    { search: /views\/pages\/Canto\/Canto/g, replace: 'features/canto/Canto' },
    { search: /views\/pages\/Login\/Login/g, replace: 'features/auth/Login' },
    { search: /views\/pages\/Admin\/AdminDashboard/g, replace: 'features/admin/AdminDashboard' }
]);
