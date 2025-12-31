#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const RECIPES_DIR = path.join(__dirname, '../content/recipes');
const IMAGES_DIR = path.join(__dirname, '../public/images/recipes');

const recipes = fs.readdirSync(RECIPES_DIR).filter(f => f.endsWith('.mdx'));
const missing = [];

for (const file of recipes) {
  const content = fs.readFileSync(path.join(RECIPES_DIR, file), 'utf8');
  const { data } = matter(content);

  if (data.featured_image) {
    const imagePath = path.join(__dirname, '../public', data.featured_image);
    if (!fs.existsSync(imagePath)) {
      missing.push({
        recipe: file.replace('.mdx', ''),
        expectedImage: data.featured_image,
        title: data.title || 'No title',
        draft: data.draft || false
      });
    }
  }
}

console.log('📷 Missing Recipe Images (21 total)\n');
console.log('='.repeat(70));

missing.forEach((m, i) => {
  const draftLabel = m.draft ? ' 🔒 DRAFT' : '';
  console.log(`\n${i + 1}. ${m.recipe}${draftLabel}`);
  console.log(`   Title: ${m.title}`);
  console.log(`   Expected: ${m.expectedImage}`);
});

console.log('\n' + '='.repeat(70));

const draftCount = missing.filter(m => m.draft).length;
const publishedCount = missing.length - draftCount;

console.log(`\n📊 Summary:`);
console.log(`   🔒 Draft recipes: ${draftCount}`);
console.log(`   📝 Published recipes: ${publishedCount}`);
console.log(`   📷 Total missing: ${missing.length}`);

if (publishedCount > 0) {
  console.log('\n⚠️  Published recipes missing images:');
  missing.filter(m => !m.draft).forEach(m => {
    console.log(`   - ${m.recipe}`);
  });
}
