# GroomLocal cleanup map

Open `listing-cleanup-20261004.standalone.html` to view the complete map.
Select Follow the cleanup to trace the checks and writes.
Select a part to read its evidence.
Drag the map to move it.
Scroll or pinch to zoom.

The map uses the production deployment and the saved cleanup records from October 4, 2026.
It does not claim a fresh outreach read. The remote host did not respond.
`dictionary.json` defines six project terms.
`groomlocal-skin.css` uses the project colors and system fonts.
`canvas-base.html` starts from the installed STE canvas and removes unused external font links.
The data file stacks the two zones on a phone.

Rebuild the map from the project root:

```sh
python3 ~/.claude/skills/ste-map/build.py \
  docs/ste-map/listing-cleanup-20261004.data.js \
  docs/ste-map/listing-cleanup-20261004.html \
  --template "$PWD/docs/ste-map/canvas-base.html" \
  --dict docs/ste-map/dictionary.json \
  --skin docs/ste-map/groomlocal-skin.css \
  --standalone docs/ste-map/listing-cleanup-20261004.standalone.html \
  --title 'GroomLocal listing cleanup'
```

The cleanup report contains the database and production results.
The private cache contains the map screenshots and verification records.
