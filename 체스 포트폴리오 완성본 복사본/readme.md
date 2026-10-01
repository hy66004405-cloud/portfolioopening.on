# OPENING — Designer portfolio

A local, self-contained Three.js / Anime.js portfolio. All runtime dependencies are vendored; no external font, image, or CDN request is needed.

## Run

From this directory: `npm start`, then open http://127.0.0.1:8766.
The existing portfolio preview server also serves this folder at http://127.0.0.1:8765/chess/.

## Experience

- Italian Game after `1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3`.
- All 32 pieces remain. Exactly seven developed pieces are interactive.
- Pawns (c3, e4, e5): Design project.
- Bishops (c4, c5): Taste archive.
- Knights (f3, c6): Experiment.
- First click: camera descends to a side view, other objects fade, the selected model enlarges, rear lighting intensifies.
- Second click on the model: enter its collection. An explicit entry button and keyboard access are also available.
- Click empty space or Back / Escape to reverse the camera transition.
- Reduced-motion setting shortens transitions and disables decorative motion.
- Initial loading displays measured elapsed seconds.

## Edit

`content.js`: category descriptions, project titles, artwork markup, roles and processes. Design project contains 25 local artwork images organized into 6 projects. Experiment contains placeholder work. Taste archive contains 18 locally downloaded Pinterest board images.
`models.js`: solid procedural chess geometry and opening position.
`app.js`: camera, lighting, interactive states and routing.
`style.css`: layout and graphite visual theme.

Double-click `포트폴리오 실행.command` on this Mac to start a local server and open the site. See `저장상태.md` for Korean instructions.

`npm test` checks the opening, number of active pieces, finite mesh geometry, board orientation and collection content.
Vendor licenses are included in `vendor/`.

Design project uses `design-gallery.js` and `design-gallery.css` for a near-fullscreen dashboard with horizontally browsable folder collections and a detail viewer. Source images, optimized previews, and hierarchy metadata are stored in this folder. This Desktop folder is the authoritative working copy.
