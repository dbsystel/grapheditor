import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');

const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

const offsetMinutes = now.getTimezoneOffset();
const sign = offsetMinutes <= 0 ? '+' : '-';
const absOffset = Math.abs(offsetMinutes);
const offsetHours = pad(Math.floor(absOffset / 60));
const offsetMins = pad(absOffset % 60);
const tz = `${sign}${offsetHours}${offsetMins}`;

const timestamp = `${date} ${time} ${tz}`;

let commit = '';
let isDirty = '';

try {
	commit = execSync('git rev-parse HEAD').toString().trim();
	isDirty = execSync('git diff --quiet || echo -dirty').toString().trim();
} catch {
	console.warn('Could not read git info, using defaults');
}

const buildInfo = {
	commit: commit + isDirty,
	timestamp: timestamp
};

const outputPath = path.resolve(__dirname, '..', 'public', 'build-info-frontend.json');
fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2) + '\n');
