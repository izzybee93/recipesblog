# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Baker Beanie is a vegetarian and vegan recipe blog that has been **migrated from Jekyll to Next.js** for better performance and modern web features. The site maintains the original design aesthetic while adding significant performance improvements and new functionality.

## Development Commands

### Next.js (Current - Primary Development)
```bash
# Navigate to Next.js project
cd bakerbeanie-nextjs

# Install dependencies
npm install

# Run local development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run migration script (if needed)
node scripts/migrate-jekyll-to-mdx.js
```

### Jekyll (Legacy - Reference Only)
```bash
# Install dependencies
bundle install

# Run local development server
bundle exec jekyll serve

# Build the site for production
bundle exec jekyll build
```

## Architecture

### Next.js Application (Current)
- **Framework**: Next.js 14 with App Router and TypeScript
- **Styling**: Tailwind CSS with custom Jekyll theme colors
- **Content**: MDX files with gray-matter for frontmatter parsing
- **Images**: Next.js Image component with automatic optimization and blur placeholders
- **Performance**: Static Site Generation (SSG) with Incremental Static Regeneration (ISR)

### Project Structure
```
bakerbeanie-nextjs/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with Header/Footer
│   ├── page.tsx                 # Homepage with search and categories
│   ├── recipes/[slug]/page.tsx  # Dynamic recipe pages
│   └── globals.css              # Global styles with Jekyll theme
├── components/                   # React components
│   ├── Header.tsx               # Site header with logo
│   ├── Footer.tsx               # Site footer
│   ├── AboutFooter.tsx          # About section (homepage only)
│   ├── BackToTop.tsx            # Scroll to top button
│   ├── SearchBar.tsx            # Real-time search component
│   └── recipe/                  # Recipe-specific components
│       ├── CategoryIndex.tsx    # Responsive category navigation
│       ├── RecipeCard.tsx       # Recipe card component
│       ├── RecipeGrid.tsx       # Recipe grid layout
│       ├── RecipeGridCard.tsx   # Grid card with background image
│       ├── RecipeLayout.tsx     # Individual recipe page layout
│       ├── RecipesByCategory.tsx # Category organization
│       └── SearchableRecipes.tsx # Search functionality wrapper
├── content/recipes/             # MDX recipe files
├── lib/                         # Utility functions
│   ├── mdx.ts                  # MDX parsing and recipe management
│   └── image.ts                # Image optimization utilities
├── public/                      # Static assets
│   ├── images/recipes/         # Recipe images
│   ├── bee.png                 # Site logo
│   ├── author.jpg              # Author photo
│   └── izzy-illustration.svg   # "Every day is treat day" illustration
├── scripts/                     # Build and migration scripts
│   └── migrate-jekyll-to-mdx.js # Jekyll to MDX migration script
├── types/                       # TypeScript type definitions
│   └── recipe.ts               # Recipe interface types
└── tailwind.config.js          # Tailwind with Jekyll theme colors
```

### Content Structure
- **content/recipes/**: Recipe files in MDX format
  - Migrated from Jekyll `_posts/` directory
  - Naming convention: `recipe-name.mdx` (no date prefix)
  - Categories properly parsed from space-separated strings to arrays
  - Each recipe includes: title, categories, featured_image, servings, ingredients, directions

### MDX Recipe Format
```yaml
---
title: Recipe Name
date: "2025-08-16T15:27:07.279Z"
categories:
  - breakfast
  - treats
featured_image: /images/recipes/recipename.jpeg
servings: serves 4
ingredients:
  - "2 cups flour"
  - "1 cup milk"
directions:
  - "Mix dry ingredients"
  - "Add wet ingredients"
draft: false
prep_time: "10 minutes"
cook_time: "20 minutes"
total_time: "30 minutes"
---

Optional MDX content with React components support
```

## Key Features

### Performance Enhancements
- **Next.js Image Optimization**: Automatic WebP/AVIF conversion, responsive sizing, lazy loading
- **Blur Placeholders**: Generated automatically for smooth loading experience
- **Static Generation**: Pre-built pages for instant loading
- **Modern Build Pipeline**: TypeScript, Tailwind CSS, optimized bundles

### User Experience Features
- **Real-time Search**: Filter 295+ recipes by title, category, ingredients, or instructions
- **Responsive Category Navigation**: 
  - Desktop: Sticky sidebar on left
  - Mobile/Tablet: Grid layout on top
- **Smart Back Navigation**: Context-aware back button on recipe pages
- **Smooth Scrolling**: Category jump navigation with smooth scroll behavior
- **About Section**: Homepage footer with author info and "every day is treat day"

### Design System
- **Jekyll Theme Preservation**: Exact color matching with `rgb(140, 190, 175)` accent
- **Custom Fonts**: 
  - Asap for body text
  - SimplySweetSerif for headings and special text
- **Responsive Layout**: Mobile-first design with desktop enhancements
- **Visual Hierarchy**: Proper spacing and typography rhythm

### Categories
Eight main recipe categories with proper multi-category support:
- **Breakfast**: Morning recipes and smoothies
- **Mains**: Full meals and substantial dishes
- **Treats**: Desserts, cakes, and sweet treats
- **Salads**: Fresh and healthy salads
- **Snacks**: Quick bites and appetizers
- **Sauces**: Dressings, condiments, and flavor enhancers
- **Grains**: Rice, quinoa, and grain-based dishes
- **Bread**: Baked goods and bread recipes

### Draft Workflow
- **Draft Mode**: Set `draft: true` in frontmatter for unpublished recipes
- **Preview Support**: Drafts visible in development environment
- **Visual Indicators**: Draft badges on recipe cards and pages

## Migration Details

### Completed Migration (August 2025)
- **295 recipes** successfully migrated from Jekyll to Next.js
- **Category parsing fixed**: Space-separated categories properly converted to arrays
- **Image optimization**: All recipe images copied and optimized
- **URL preservation**: Recipe URLs maintained for SEO
- **Design fidelity**: 100% visual compatibility with original Jekyll theme

### Migration Script
The `scripts/migrate-jekyll-to-mdx.js` script handles:
- Converting Jekyll Markdown posts to MDX format
- Parsing YAML frontmatter and recipe data
- Splitting space-separated categories into arrays
- Copying recipe images to Next.js public directory
- Handling undefined values and data validation

## Development Workflow

### Adding New Recipes
1. Create a new MDX file in `content/recipes/`
2. Use the recipe frontmatter format above
3. Add recipe image to `public/images/recipes/`
4. Recipe automatically appears in appropriate categories

### Content Management
- **No CMS required**: Simple MDX file editing
- **Git-based workflow**: Version control for all content
- **Preview mode**: Test changes locally before deployment

## Deployment
- **Platform**: Vercel (optimized for Next.js)
- **Domain**: bakerbeanie.me
- **Build**: Automatic deployments from Git
- **Performance**: 90+ Lighthouse scores with image optimization

## Legacy Jekyll Information
The original Jekyll site structure is preserved in the root directory for reference. Key Jekyll files:
- `_posts/`: Original recipe Markdown files
- `_sass/`: SCSS files (colors and styles migrated to Tailwind)
- `_layouts/`: HTML templates (functionality recreated in Next.js components)
- `_data/`: Site configuration (migrated to component props and constants)