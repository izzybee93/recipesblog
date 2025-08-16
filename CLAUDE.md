# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Jekyll-based recipe blog called "Baker Beanie" featuring vegetarian and vegan recipes. It uses the Treat template originally from CloudCannon, optimized for food/baking blogs with features like recipe cards, categories, and a Pinterest-friendly layout.

## Development Commands

```bash
# Install dependencies
bundle install

# Run local development server
bundle exec jekyll serve

# Build the site for production
bundle exec jekyll build

# Create a new post/recipe
bundle exec jekyll post "Recipe Name"
```

## Architecture

### Jekyll Static Site Generator
- Built with Jekyll 3.4.3+ and GitHub Pages gem
- Uses Liquid templating for dynamic content
- SASS preprocessing for styles (compiled automatically by Jekyll)
- Pagination enabled (10 posts per page)

### Content Structure
- **_posts/**: Recipe posts in Markdown with YAML frontmatter
  - Naming convention: `YYYY-MM-DD-recipe-name.md`
  - Categories determine recipe organization on the site
  - Each recipe includes: title, categories, featured_image, servings, ingredients_markdown, directions_markdown

- **_layouts/**: Page templates
  - `default.html`: Base template for all pages
  - `post.html`: Template for individual recipe posts

- **_sass/**: Modular SCSS files
  - Component-based styling (blog, recipes, sidebar, navigation, etc.)
  - Variables defined in `variables.scss`
  - Compiled to `/css/screen.css`

- **_data/**: Site configuration data
  - `navigation.yml`: Main menu structure
  - `sidebar.yml`: Sidebar content configuration
  - `company_details.yml`: Site metadata

### Recipe Post Format
```yaml
---
title: Recipe Name
categories: [breakfast|mains|treats|salad|snacks|sauces|grains|bread]
featured_image: "/images/recipes/recipename.jpeg"
recipe:
  servings: serves X
  ingredients_markdown: |
    * Ingredient 1
    * Ingredient 2
  directions_markdown: |
    1. Step one
    2. Step two
---
Optional content/description here
```

### Key Features
- Responsive design with mobile-first approach
- Category-based recipe organization
- Recipe cards with images and quick info
- Print-friendly recipe layouts
- SEO optimization with jekyll-seo-tag
- RSS/Atom feed generation
- Sitemap generation

## Deployment
- Configured for GitHub Pages deployment
- Custom domain: bakerbeanie.me
- Plugins compatible with GitHub Pages whitelist
- Assets served from `/images/recipes/` for recipe photos

## Adding New Recipes
1. Create a new file in `_posts/` with the date-name format
2. Add frontmatter with required fields (title, categories, featured_image, recipe)
3. Place recipe image in `/images/recipes/`
4. Recipe will automatically appear in the appropriate category pages and homepage feed