const fs = require('fs');
const glob = require('glob'); // Note: we'll just write a recursive readdir
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.md') || file.endsWith('.json')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
files.push('package.json', 'README.md');

let changed = 0;
files.forEach(file => {
  if(fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf-8');
      if (content.includes('Scholar Portal')) {
        content = content.replace(/Scholar Portal/g, 'Researchify');
        fs.writeFileSync(file, content);
        changed++;
        console.log('Fixed', file);
      }
  }
});
console.log(`Changed ${changed} files.`);
