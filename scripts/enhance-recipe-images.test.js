const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const scriptPath = path.join(__dirname, 'enhance-recipe-images.js');

test('image enhancement contains no cost or pricing references', () => {
  const source = fs.readFileSync(scriptPath, 'utf8');

  assert.doesNotMatch(source, /cost/i);
  assert.doesNotMatch(source, /pric(?:e|ing)/i);
  assert.doesNotMatch(source, /cheaper/i);
  assert.doesNotMatch(source, /\$(?:\$|\s+\d|\d)/);
  assert.match(source, /maxRetriesPerImage/);
});

test('legacy progress is rebuilt using only supported fields', () => {
  const probe = `
    const { createProgress } = require(${JSON.stringify(scriptPath)});
    const progress = createProgress({
      processed: ['recipe-one'],
      stats: { approved: 1, rejected: 2, skipped: 3, errors: 4 },
      totalCost: 99,
      totalAttempts: 5,
      lastUpdated: '2026-10-03T00:00:00.000Z',
      obsolete: true
    });
    console.log('PROGRESS_JSON:' + JSON.stringify(progress));
  `;
  const result = spawnSync(process.execPath, ['-e', probe], {
    cwd: os.tmpdir(),
    encoding: 'utf8',
    env: { ...process.env, OPENAI_API_KEY: '' },
  });

  assert.equal(result.status, 0, result.stderr);
  const jsonLine = result.stdout
    .split('\n')
    .find(line => line.startsWith('PROGRESS_JSON:'));
  assert.ok(jsonLine, `Missing progress output in:\n${result.stdout}`);
  assert.deepEqual(JSON.parse(jsonLine.slice('PROGRESS_JSON:'.length)), {
    processed: ['recipe-one'],
    stats: { approved: 1, rejected: 2, skipped: 3, errors: 4 },
    totalAttempts: 5,
    lastUpdated: '2026-10-03T00:00:00.000Z',
  });
});
