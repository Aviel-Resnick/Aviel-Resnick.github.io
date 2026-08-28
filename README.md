# AvielResnick.com

My personal website — an interactive resume built as a lunar lander game. Fly around with the arrow keys or click a section on the top nav to auto-pilot there; press Enter for a guided auto-tour, or Esc for a plain-text view.

## Deploy model

This repo owns the `avielresnick.com` custom domain via GitHub Pages (served from `master`, root path). It does not contain hand-edited game source anymore — the root (and any project subdirectories, e.g. future `/oceans-eleven`) are pushed here automatically by each project's own CI:

- Homepage/lander source lives in [`lunar-lander-resume`](https://github.com/Aviel-Resnick/lunar-lander-resume); its `public/` folder is what gets deployed here on every push to that repo's `main`.
- Each project repo pushes via a scoped, write-only SSH deploy key registered on this repo (see repo Settings → Deploy keys), not a personal access token.

Don't hand-edit `index.html`/`css`/`js` here — changes will be overwritten by the next CI deploy. Edit them in the source repo instead.
