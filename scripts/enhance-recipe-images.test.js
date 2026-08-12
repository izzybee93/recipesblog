const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const scriptPath = path.join(__dirname, 'enhance-recipe-images.js');

test('image enhancement has no cost cap and retains cost reporting', () => {
  const source = fs.readFileSync(scriptPath, 'utf8');

  assert.doesNotMatch(source, /maxCostLimit/);
  assert.doesNotMatch(source, /Cost limit reached/);
  assert.doesNotMatch(source, /Estimated total cost may exceed limit/);
  assert.doesNotMatch(source, /increase the limit/);
  assert.doesNotMatch(source, /Edit CONFIG\.maxCostLimit/);

  assert.match(source, /Estimated cost for remaining/);
  assert.match(source, /Spent so far/);
  assert.match(source, /Total estimated/);
  assert.match(source, /Total cost/);
  assert.match(source, /maxRetriesPerImage/);
});
