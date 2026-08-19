import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const SPORT_IDS = [1, 11, 12, 13, 14, 16, 17, 21, 23, 31, 51];
const OUTPUT_DIR = 'public/teams';
const DARK_DIR = 'public/teams/dark';

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(DARK_DIR, { recursive: true });

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) { resolve(false); return; }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
      file.on('error', () => resolve(false));
    }).on('error', () => resolve(false));
  });
}

const allTeamIds = new Set();
const mlbTeamIds = new Set();

for (const sportId of SPORT_IDS) {
  try {
    const data = await fetchJson(`https://statsapi.mlb.com/api/v1/teams?sportId=${sportId}`);
    for (const team of data.teams || []) {
      allTeamIds.add(team.id);
      if (sportId === 1) mlbTeamIds.add(team.id);
    }
    console.log(`Sport ${sportId}: ${data.teams?.length || 0} teams`);
  } catch (e) {
    console.error(`Sport ${sportId} failed:`, e.message);
  }
}

console.log(`\nPrimaries: ${allTeamIds.size} | MLB-only for dark: ${mlbTeamIds.size}\n`);

let ok = 0, miss = 0;
for (const id of allTeamIds) {
  const got = await downloadFile(
    `https://www.mlbstatic.com/team-logos/${id}.svg`,
    path.join(OUTPUT_DIR, `${id}.svg`)
  );
  if (got) ok++; else miss++;
}
console.log(`Primary: ${ok} downloaded, ${miss} missing`);

let darkOk = 0, darkMiss = 0;
for (const id of mlbTeamIds) {
  const got = await downloadFile(
    `https://www.mlbstatic.com/team-logos/team-cap-on-dark/${id}.svg`,
    path.join(DARK_DIR, `${id}.svg`)
  );
  if (got) { darkOk++; process.stdout.write(`✓ ${id} `); }
  else darkMiss++;
}
console.log(`\n\nDark: ${darkOk} downloaded, ${darkMiss} missing`);