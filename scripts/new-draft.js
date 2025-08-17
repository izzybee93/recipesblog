#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function createRecipe() {
  console.log('\n🧁 Baker Beanie Recipe Creator\n');
  
  // Get recipe name
  const recipeName = await question('Recipe name: ');
  if (!recipeName) {
    console.log('❌ Recipe name is required');
    process.exit(1);
  }
  
  // Generate slug from recipe name
  const slug = recipeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Optional: Get categories (press Enter to skip)
  const categoriesInput = await question('Categories (optional, press Enter to skip): ');
  const categories = categoriesInput
    .split(',')
    .map(cat => cat.trim())
    .filter(Boolean);
  
  // Optional: Get servings (press Enter to skip)
  const servings = await question('Servings (optional, press Enter to skip): ');
  
  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  
  // Create the MDX content
  const mdxContent = `---
title: "${recipeName}"
date: "${today}"
categories: [${categories.map(cat => `"${cat}"`).join(', ')}]
featured_image: "/images/recipes/${slug}.jpeg"${servings ? `
servings: "${servings}"` : ''}
ingredients:
  - Ingredient 1
  - Ingredient 2
  - Ingredient 3
directions:
  - Step 1
  - Step 2
  - Step 3
draft: true
---

Add your recipe description here. This will appear at the top of the recipe page.

## Notes

Add any additional notes, tips, or variations here.
`;

  // Define file path
  const recipesDir = path.join(process.cwd(), 'content', 'recipes');
  const filePath = path.join(recipesDir, `${slug}.mdx`);
  
  // Check if file already exists
  if (fs.existsSync(filePath)) {
    const overwrite = await question(`⚠️  File ${slug}.mdx already exists. Overwrite? (y/n): `);
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Cancelled.');
      process.exit(0);
    }
  }
  
  // Ensure recipes directory exists
  if (!fs.existsSync(recipesDir)) {
    fs.mkdirSync(recipesDir, { recursive: true });
  }
  
  // Write the file
  fs.writeFileSync(filePath, mdxContent);
  
  console.log(`
✅ Recipe created successfully!

📄 File: content/recipes/${slug}.mdx
🏷️  Status: Draft
📷 Image path: /images/recipes/${slug}.jpeg

Next steps:
1. Edit the recipe file to add ingredients and directions
2. Add recipe image to: public/images/recipes/${slug}.jpeg
3. Remove "draft: true" when ready to publish
4. Commit and push to deploy

To edit: code content/recipes/${slug}.mdx
`);
  
  rl.close();
}

createRecipe().catch(console.error);