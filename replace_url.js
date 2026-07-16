const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'src', 'config.ts');
fs.writeFileSync(configPath, "export const API_URL = 'https://sales-invoice-backend-5o30.onrender.com';\n");

const url = 'https://sales-invoice-backend-5o30.onrender.com';

function processFile(filePath, importPath) {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  if (!content.includes(url)) return;
  
  if (!content.includes('API_URL')) {
    content = `import { API_URL } from '${importPath}';\n` + content;
  }
  
  // Replace single quoted URL with template literal using API_URL
  content = content.replace(/'https:\/\/sales-invoice-backend-5o30\.onrender\.com([^']*)'/g, "`\\${API_URL}$1`");
  
  // Replace URL in existing template literals
  content = content.replace(/https:\/\/sales-invoice-backend-5o30\.onrender\.com/g, "\\${API_URL}");
  
  fs.writeFileSync(fullPath, content);
}

processFile('src/app/index.tsx', '../config');
processFile('src/app/(app)/reports.tsx', '../../config');
processFile('src/app/(app)/products.tsx', '../../config');
processFile('src/app/(app)/invoices.tsx', '../../config');
processFile('src/app/(app)/dashboard.tsx', '../../config');
processFile('src/app/(app)/customers.tsx', '../../config');
console.log('Done!');
