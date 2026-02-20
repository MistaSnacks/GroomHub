const fs = require('fs');
const path = require('path');

const PROGRESS_FILE = path.join(__dirname, '..', 'data', '.gmaps_progress.json');
const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));

let cleared = 0;
for (const [key, val] of Object.entries(progress)) {
  if (val.status === 'error' && val.error && val.error.includes('ENOTFOUND')) {
    delete progress[key];
    cleared++;
  }
}

fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
console.log('Cleared', cleared, 'DNS error entries from progress file');
console.log('Remaining entries:', Object.keys(progress).length);
