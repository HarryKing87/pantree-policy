# Mål — public site

The public landing page, privacy policy, and account-deletion page for **Mål**.

Live at <https://harryking87.github.io/pantree-policy/>

Static, dependency-free, no build step. GitHub Pages serves `main` / root as-is.

---

## Structure

```
.
├── index.html            # shell + all three views
├── 404.html              # bounces unknown paths back into the SPA
├── .nojekyll             # serve files verbatim, skip Jekyll
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/styles.css    # design tokens + all styling
    ├── js/app.js         # hash router, reveals, theme toggle
    └── img/favicon.svg   # leaf mark
```

## Routes

| URL | View |
|---|---|
| `#/` (or no hash) | Home |
| `#/privacy` | Privacy policy |
| `#/delete` | Delete your account |

Views swap client-side — the old view animates out and unmounts, the new one
mounts and animates in. No page reload.

### ⚠️ Legacy deep links

The old site was a single page whose deletion section lived at
`#delete-account`. **That URL is almost certainly registered with Google Play
as the app's account-deletion URL.** It still works: `assets/js/app.js` maps
legacy bare anchors onto the new routes.

```js
var LEGACY = {
  'delete-account':           'delete',
  'delete_account':           'delete',
  'privacy':                  'privacy',
  'privacy-policy':           'privacy',
  'request-account-deletion': 'delete'
};
```

The `id="delete-account"` anchor is also still present on section 06 of the
privacy policy. **Don't remove either without updating the store listing first.**

## Design tokens

Colours are sampled from the app's own leaf mark
(`src/assets/logo_pantry_full.png` in the app repo), so the site and the app
share one identity:

| Token | Light | Role |
|---|---|---|
| `--leaf-teal` | `#55B884` | gradient start |
| `--leaf-lime` | `#9AC540` | gradient mid |
| `--leaf-amber` | `#E0963B` | gradient end |
| `--forest` | `#1F3D2B` | deep brand ground |
| `--terracotta` | `#C8612A` | stem, the dot in "Mål." |
| `--accent` | `#3F7D5C` | buttons, links — matches in-app accent |

Type: **Bricolage Grotesque** (display) + **Hanken Grotesk** (body), via Google Fonts.

### Theming

Three states are handled explicitly:

- `:root` — full light palette
- `@media (prefers-color-scheme: dark)` scoped to `:root:not([data-theme="light"])` — follows the OS
- `:root[data-theme="dark"]` — the in-page toggle wins either direction

The toggle persists to `localStorage` under `mal-theme`.

## Editing the privacy policy

The policy text lives inline in `index.html` under
`<section class="view" data-view="privacy">`, as seven numbered `.jar` sections.
Update the `Last updated` pill in `.doc-hero` whenever the text changes.

## Contact address

The contact/deletion address appears in four places, all marked
`data-contact-email`:

```
grep -n 'data-contact-email' index.html
```

## Local preview

Any static server works:

```bash
python -m http.server 8080
```

Then open <http://localhost:8080/>.

## Accessibility & motion

- Every animation is disabled under `prefers-reduced-motion: reduce`.
- Views carry `aria-labelledby`; the active tab gets `aria-current="page"`.
- There's a skip link, and focus styling is visible throughout.
