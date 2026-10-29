# Mozury — Facebook cover (1640 × 924)

Old Damascus and Amman at night, one continuous flat-illustration scene (inline SVG) in the Mozury palette.

| File | What it is |
|---|---|
| `cover.html` | The cover at full size, with **Download PNG** (renders exactly 1640 × 924). |
| `preview.html` | Full image with safe-zone overlay and live safe-zone checks, a desktop crop (central 1640 × 608) and a mobile preview, each with the profile-picture circle. Also has **Download PNG**. |
| `cover-art.js` | The scene itself, shared by both pages. Change `HEADLINE_FONT` to `'Cairo'` to swap the headline face. |

## Logo

The pages look for `important website things/logo and pics/mozury-logo-cream-transparent.png`
relative to the HTML file (and one or two folders up). If it isn't found, a typeset
"Mozury." wordmark stands in — use **Choose logo file…** to load the real PNG.

Opened straight from disk (`file://`), browsers block embedding a local image into the
export, so Download asks you to pick the logo file once. Serving the folder avoids that:

```bash
python3 -m http.server 8000   # then open http://localhost:8000/preview.html
```

Fonts (Kufam, IBM Plex Sans Arabic) load from Google Fonts and are embedded into the PNG,
so the export needs an internet connection.
