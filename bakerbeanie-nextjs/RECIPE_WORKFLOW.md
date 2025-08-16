# Recipe Publishing Workflow Guide

This guide explains how to add new recipes to your Baker Beanie Next.js blog, including drafts and publishing.

## Quick Overview
1. Add recipe image to `/public/images/recipes/`
2. Create MDX file in `/content/recipes/`
3. Test locally with `npm run dev`
4. Deploy to publish

## Step-by-Step Guide

### Step 1: Prepare Your Recipe Image

1. **Optimize your image**:
   - Recommended size: 1200x800px (3:2 aspect ratio)
   - Format: JPEG or PNG
   - Keep file size under 500KB for best performance

2. **Add image to project**:
   ```bash
   # Copy your image to the recipes folder
   cp /path/to/your-recipe-image.jpg public/images/recipes/
   ```

3. **Name your image**:
   - Use descriptive, URL-friendly names: `chocolate-chip-cookies.jpg`
   - Avoid spaces and special characters

### Step 2: Create Your Recipe File

1. **Create new MDX file** in `/content/recipes/`:
   ```bash
   # File naming convention: YYYY-MM-DD-recipe-name.mdx
   touch content/recipes/2024-01-15-chocolate-chip-cookies.mdx
   ```

2. **Add frontmatter and content**:
   ```mdx
   ---
   title: "Chocolate Chip Cookies"
   categories: ["treats", "snacks"]
   featured_image: "/images/recipes/chocolate-chip-cookies.jpg"
   draft: true
   recipe:
     servings: "Makes 24 cookies"
     ingredients_markdown: |
       * 2 cups all-purpose flour
       * 1 tsp baking soda
       * 1 tsp salt
       * 1 cup butter, softened
       * 3/4 cup brown sugar
       * 1/2 cup white sugar
       * 2 large eggs
       * 2 tsp vanilla extract
       * 2 cups chocolate chips
     directions_markdown: |
       1. Preheat oven to 375°F (190°C).
       2. Mix flour, baking soda, and salt in a bowl.
       3. Cream butter and sugars until fluffy.
       4. Beat in eggs and vanilla.
       5. Gradually add flour mixture.
       6. Stir in chocolate chips.
       7. Drop rounded tablespoons onto baking sheets.
       8. Bake 9-11 minutes until golden brown.
       9. Cool on baking sheet for 2 minutes before transferring.
   ---

   These classic chocolate chip cookies are crispy on the edges and chewy in the center. Perfect for any occasion!

   ## Tips
   - Don't overbake - they'll continue cooking on the hot pan
   - Chill dough for 30 minutes for thicker cookies
   ```

### Step 3: Available Categories

Choose from these predefined categories (you can use multiple):
- `breakfast`
- `mains` 
- `treats`
- `salad`
- `snacks`
- `sauces`
- `grains`
- `bread`

### Step 4: Test Your Draft Locally

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **View your draft**:
   - Navigate to `http://localhost:3000`
   - Drafts appear with a yellow "Draft Mode" banner
   - Search and filter work with drafts

3. **Check everything looks good**:
   - Image loads properly
   - Recipe details display correctly
   - Categories are assigned
   - No formatting issues

### Step 5: Publish Your Recipe

1. **Remove draft status**:
   ```mdx
   ---
   title: "Chocolate Chip Cookies"
   categories: ["treats", "snacks"]
   featured_image: "/images/recipes/chocolate-chip-cookies.jpg"
   # Remove this line: draft: true
   recipe:
     # ... rest of recipe
   ---
   ```

2. **Commit and push changes**:
   ```bash
   git add .
   git commit -m "Add chocolate chip cookies recipe"
   git push
   ```

3. **Deploy automatically**:
   - Vercel will automatically deploy your changes
   - Recipe will appear live within minutes

## File Structure Reference

```
bakerbeanie-nextjs/
├── content/recipes/          # All recipe MDX files
│   ├── 2024-01-15-recipe.mdx
│   └── ...
├── public/images/recipes/    # All recipe images
│   ├── recipe-image.jpg
│   └── ...
└── ...
```

## Frontmatter Reference

```yaml
---
title: "Recipe Name"                    # Required: Recipe title
categories: ["category1", "category2"]  # Required: Array of categories
featured_image: "/images/recipes/..."   # Required: Path to recipe image
draft: true                            # Optional: Remove to publish
recipe:                                # Required: Recipe details
  servings: "Serves 4"                 # Required: Serving information
  ingredients_markdown: |              # Required: Ingredients list
    * Ingredient 1
    * Ingredient 2
  directions_markdown: |               # Required: Cooking directions
    1. Step one
    2. Step two
---
```

## Pro Tips

1. **Image Optimization**: Next.js automatically optimizes images, but starting with properly sized images improves performance

2. **SEO-Friendly URLs**: File names become URLs, so use descriptive names with hyphens

3. **Draft Workflow**: Keep `draft: true` while working, remove when ready to publish

4. **Multiple Categories**: Recipes can appear in multiple categories for better discoverability

5. **Content Body**: Add extra content after frontmatter for recipe stories or tips

6. **Local Testing**: Always test drafts locally before publishing

## Troubleshooting

- **Image not showing**: Check file path and ensure image is in `/public/images/recipes/`
- **Recipe not appearing**: Verify frontmatter syntax and remove any YAML errors
- **Categories not working**: Ensure categories are in array format with quotes
- **Build errors**: Check MDX syntax and required frontmatter fields

## Need Help?

Check the main documentation in `CLAUDE.md` for technical details or development commands.