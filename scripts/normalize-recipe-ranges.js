#!/usr/bin/env node

const fs = require('node:fs')

const unicodeFractions = '¼½¾⅓⅔⅛⅜⅝⅞⅕⅖⅗⅘⅙⅚'
const number = `(?:\\d+(?:\\.\\d+|\\/\\d+)?[${unicodeFractions}]?|[${unicodeFractions}])`
const numericalRange = new RegExp(
  `(?<![\\p{L}\\p{N}])(${number})\\s*-\\s*(${number})`,
  'gu',
)

function normalizeRecipeRanges(source) {
  return source
    .split(/(\r\n|\n|\r)/)
    .map((part, index) => {
      if (index % 2 === 1 || /^\s*date\s*:/.test(part)) return part
      return part.replace(numericalRange, '$1–$2')
    })
    .join('')
}

function processFiles(filePaths, { check = false } = {}) {
  const changedFiles = []

  for (const filePath of filePaths) {
    const source = fs.readFileSync(filePath, 'utf8')
    const normalized = normalizeRecipeRanges(source)

    if (normalized === source) continue
    changedFiles.push(filePath)

    if (!check) fs.writeFileSync(filePath, normalized)
  }

  return changedFiles
}

function main(argv) {
  const check = argv.includes('--check')
  const filePaths = argv.filter(argument => argument !== '--check')

  if (filePaths.length === 0) {
    console.error('Usage: normalize-recipe-ranges.js [--check] <recipe.mdx> [...]')
    return 2
  }

  const changedFiles = processFiles(filePaths, { check })

  if (check && changedFiles.length > 0) {
    console.error('Recipe files contain ASCII-hyphen numerical ranges:')
    for (const filePath of changedFiles) console.error(`- ${filePath}`)
    return 1
  }

  return 0
}

if (require.main === module) process.exitCode = main(process.argv.slice(2))

module.exports = { normalizeRecipeRanges, processFiles }
