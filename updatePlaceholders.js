const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'app', '(app)');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace <TextInput ...> but make sure we don't duplicate placeholderTextColor
  // First, remove existing placeholderTextColor if any
  content = content.replace(/ placeholderTextColor="[^"]+"/g, '');
  
  // Add placeholderTextColor="#9ca3af" to all <TextInput 
  content = content.replace(/<TextInput /g, '<TextInput placeholderTextColor="#9ca3af" ');
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated ${file}`);
}
