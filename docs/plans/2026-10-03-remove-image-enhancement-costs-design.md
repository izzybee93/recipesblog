# Remove image enhancement costs design

`scripts/enhance-recipe-images.js` will contain no pricing, per-image cost, estimated cost, accumulated cost, or cost-related prose. Recipe processing results retain only status, attempts, and errors. Progress state retains processed slugs, outcome counts, total attempts, and the last-updated timestamp.

Loading an older progress file will rebuild this supported state shape, so legacy cost fields are omitted the next time the file is saved. Retry limits remain unchanged. A source-level regression assertion prevents cost language or tracking from returning, while a state-shape test verifies legacy fields are discarded.
