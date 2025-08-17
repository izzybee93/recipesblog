#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const recipesDir = path.join(__dirname, '../content/recipes');

console.log('📝 Draft Recipes:\n');

try {
  const files = fs.readdirSync(recipesDir)
    .filter(file => file.endsWith('.mdx'))
    .map(file => {
      const filePath = path.join(recipesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(content);
      
      return {
        file,
        title: data.title,
        categories: data.categories || [],
        draft: data.draft === true
      };
    })
    .filter(recipe => recipe.draft);

  if (files.length === 0) {
    console.log('No drafts found! ✨');
  } else {
    files.forEach((recipe, index) => {
      console.log(`${index + 1}. ${recipe.title}`);
      console.log(`   File: ${recipe.file}`);
      console.log(`   Categories: ${recipe.categories.join(', ')}`);
      console.log('');
    });
  }
} catch (error) {
  console.error('Error reading drafts:', error.message);
}