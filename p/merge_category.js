// Merge Car Charger Hub into Car Charger across all data sources
// Run this in browser console or Node.js to fix data

const fs = require('fs');
const path = require('path');

function mergeInJSON(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  let changed = 0;
  data.forEach(p => {
    if (p.category === 'Car Charger Hub') {
      p.category = 'Car Charger';
      changed++;
    }
  });
  if (changed > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Fixed ${changed} items in ${filePath}`);
  } else {
    console.log(`No Car Charger Hub found in ${filePath}`);
  }
  return changed;
}

function mergeInJS(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const jsonMatch = content.match(/const\s+PRODUCTS\s*=\s*(\[.*?\]);\s*$/s);
  if (!jsonMatch) {
    console.log(`Could not parse ${filePath}`);
    return 0;
  }
  const data = JSON.parse(jsonMatch[1]);
  let changed = 0;
  data.forEach(p => {
    if (p.category === 'Car Charger Hub') {
      p.category = 'Car Charger';
      changed++;
    }
  });
  if (changed > 0) {
    const newContent = content.replace(jsonMatch[1], JSON.stringify(data, null, 2));
    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed ${changed} items in ${filePath}`);
  } else {
    console.log(`No Car Charger Hub found in ${filePath}`);
  }
  return changed;
}

// Check all JSON data files
const dataDir = 'D:/公司资料';
const files = fs.readdirSync(dataDir);
files.forEach(f => {
  if (f.endsWith('.json')) {
    mergeInJSON(path.join(dataDir, f));
  }
});

// Fix data.js
mergeInJS(path.join(dataDir, '产品目录/html_ppt/data.js'));

console.log('Done. Please refresh admin.html and index.html.');
