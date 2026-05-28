# learn-hpc

Interactive learning resource + roadmap for the HPC Classifier project.

This is a small Vite + React + TypeScript + Tailwind app. It is intentionally
not part of the project's main runtime — it's a "field guide" that lives
alongside the code.

## Run it

```bash
cd learn-hpc
npm install
npm run dev
```

Then open the URL printed by Vite (defaults to `http://localhost:5175`).

## Build

```bash
npm run build      # type-checks then bundles to dist/
npm run preview    # serve the built dist/
```

## What's in here

- `src/content/track0.tsx` … `track9.tsx` — the 10 learning modules
- `src/components/widgets/` — interactive lessons (RC simulator, HPC trace
  viewer, Q-format calculator, confusion matrix, etc.)
- `src/components/ui/` — primitives shared across lessons (Callout, Figure,
  CodeBlock, Quiz, etc.)
- `src/lib/` — routing (hash-based), progress (localStorage), data model

## Adding a module

1. Create `src/content/trackN.tsx` exporting a `Track` (see existing tracks
   for the shape).
2. Add it to the import list in `src/lib/curriculum.ts`.
3. The home grid, sidebar, and progress bar all populate automatically.

## Authoring conventions

- Use the primitives in `components/ui/primitives.tsx` (`Lead`, `P`, `H2`,
  `Callout`, `Figure`, `DataTable`, `Compare`, `Math`, `Term`, `Mono`) rather
  than raw HTML — they carry the theme styling.
- Each lesson should have at most one `Lead`. Use it for the opening hook.
- Each lesson can optionally have an `implementation` block (rendered as a
  warm-amber "Now build it" section) and a `videos` array (rendered as a
  blue "Go deeper — videos" section).

## See also

The top-level `../CURRICULUM.md` is the human-readable summary of all
modules, repo layout, and verification protocols. Paste it into a fresh LLM
chat to give it project context.
