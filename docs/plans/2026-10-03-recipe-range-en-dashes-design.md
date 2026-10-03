# Recipe range en dashes design

Numerical ranges and time spans in recipe MDX use an unspaced en dash, for example `2–4 tbsp`, `serves 2–3`, and `15–20 minutes`. ISO dates retain ASCII hyphens.

A small Node.js normalizer owns this mechanical rule. It accepts recipe paths, rewrites numeric ranges without altering date lines, and supports a check mode for corpus verification. The pre-commit hook passes staged recipe files to the normalizer and stages any rewrites. The `new-draft` skill states the same output convention so newly generated recipes are correct before the hook runs.

Tests cover compact and spaced ranges, decimal and Unicode-fraction endpoints, and ISO-date preservation. After the formatter passes, the complete recipe corpus is normalized and checked.
