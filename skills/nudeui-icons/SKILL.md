---
name: nudeui-icons
description: How to add, change, remove, define and style icons in a project that uses @nudeui/icons, the CSS-only icon system where icons are `--icon-*` custom properties placed with `--icon`, `--icon-start` or `--icon-end` and rendered as masks. Use this whenever a task touches icons in such a project in any way, even if the word "icon" is not used, such as adding a trash button, marking external links, a chevron on a disclosure, a check mark on a selected item, a loading or status glyph, swapping an icon on hover or open state, resizing or recoloring icons, or bringing in an SVG from an icon set. Recognize the system by `@nudeui/icons` in package.json or a CSS import, by `--icon-start`, `--icon-end`, `--icon-style-*` or `class="icon"` in the code, or by `--icon-*` tokens defined as `url(...)`. Never reach for inline `<svg>`, `<img>` icons, icon fonts, icon components or an icon JS library in such a project; this skill tells you what to do instead.
---

# @nudeui/icons

Icons are design tokens (`--icon-trash`, `--icon-chevron-right`) and placing one is a CSS declaration. There is no icon markup at all: the element that carries the icon gets a `::before` or `::after` pseudo-element, filled with the text color and masked by the icon's shape. Icons therefore follow `color`, scale with `font-size`, flip with writing direction, and respond to anything CSS can express (`:hover`, `[open]`, `:has()`, media and container queries, print, dark mode).

Work with this grain. The system exists so that adding an icon is one declaration and so that icons never add markup, components or JavaScript. If you find yourself writing `<svg>`, `<img src="x.svg">`, an `<Icon>` component, a `class="fa-trash"`, a `content: "✓"`, or a `background-image` on an empty span, stop: this project does it differently.

## Recognize the system

Any of these means the project uses @nudeui/icons:

- `@nudeui/icons` in `package.json`, `@import "@nudeui/icons"`, or a `<link>` to `icons.css` from that package
- `--icon-start`, `--icon-end`, `--icon-style-color`, `--icon-style-size` or `--icon-style-spacing` in CSS or inline styles
- `class="icon"`, `class="icon-start"` or `class="icon-end"` on empty elements
- Custom properties named `--icon-<something>` whose value is a `url(...)`

Before changing anything, find where the project keeps its icon tokens and how it names them:

```sh
grep -rn --include=*.css --include=*.html --include=*.js --include=*.ts --include=*.svelte --include=*.vue --include=*.astro --include=*.jsx --include=*.tsx -E -- "--icon-[a-z]" . | grep -v node_modules
```

Reuse an existing token when one fits (a project rarely wants two trash icons). Follow the existing naming and file layout rather than inventing a parallel one.

## The three placement properties

| Property       | Renders in  | Use it when                                                     |
| -------------- | ----------- | --------------------------------------------------------------- |
| `--icon-start` | `::before`  | You want an icon before the element's content                   |
| `--icon-end`   | `::after`   | You want an icon after the element's content                    |
| `--icon`       | (component) | The element is a component that decides where its own icon goes |

Set them wherever a declaration can go: a stylesheet rule, an inline `style`, a media query, a state selector. The element must be able to have pseudo-elements (so not `<img>`, `<input>`, `<select>`, `<textarea>`, `<iframe>` or `<video>`; for those, put the icon on a wrapping `<label>` or `<span>`, or use `appearance: none` on a form control that supports it).

### Which one to set

1. **A component that redirects `--icon`.** Look for `--icon-start: var(--icon)` or `--icon-end: var(--icon)` in the project's CSS (buttons usually have this). If the element is such a component, set `--icon`, not a location: that is the component's API, and it keeps the decision of where icons go with the component.

    ```html
    <button style="--icon: var(--icon-trash)">Delete</button>
    ```

    ```css
    button.danger {
    	--icon: var(--icon-trash);
    }
    ```

2. **Anything else.** Set `--icon-start` or `--icon-end` directly.

    ```css
    a[href^="https://"] {
    	--icon-end: var(--icon-link-external);
    }
    
    details > summary {
    	--icon-start: var(--icon-chevron-right);
    }
    ```

3. **A standalone icon with no text to attach to.** Use the `.icon` class on an empty element; it redirects `--icon` to `--icon-start` and works even without style queries.

    ```html
    <i class="icon" style="--icon: var(--icon-github)"></i>
    ```

    Prefer putting the icon on the element that has the text (the button, the link, the list item) over adding a separate `.icon` element next to it. A separate element is only for icons that genuinely stand alone.

### Stylesheet or inline style?

Put the declaration in CSS when the icon belongs to a class, element type, state or condition: all `.danger` buttons, every external link, every open `<details>`. Put it in an inline `style` when the icon is specific to one element in the markup, such as individual navigation items that each have their own icon. Both are idiomatic; inline `--icon: var(--icon-x)` on a button is the normal way to give one button an icon.

### Writing a new component

Give it a `--icon` redirect in a zero-specificity rule, so any consumer declaration wins over the default:

```css
:where(.chip) {
	--icon-start: var(--icon);
}
```

Add more state hooks the same way if the component needs them, falling back to the base icon:

```css
.chip:hover {
	--icon-start: var(--icon-hover, var(--icon));
}
```

`--icon` is an ordinary (inherited) custom property, so setting it on a container gives every component inside it that icon. That is a feature when a group of buttons shares an icon, and a surprise when it is not what you wanted; set it on the component itself when in doubt. `--icon-start` and `--icon-end` are registered as non-inherited, so they only affect the element they are set on.

## Changing, swapping and removing icons

Express state in CSS, not by toggling classes or icon markup from JavaScript. The icon changes the instant the declaration that applies changes.

```css
.hover-swap {
	--icon-start: var(--icon-trash-outlined);

	&:hover {
		--icon-start: var(--icon-trash);
	}
}

details[open] > summary {
	--icon-start: var(--icon-chevron-down);
}

label:has(:checked) {
	--icon-end: var(--icon-check);
}

[aria-expanded="true"] {
	--icon: var(--icon-chevron-up);
}

@media (prefers-color-scheme: dark) {
	.scheme {
		--icon-start: var(--icon-moon);
	}
}
```

To remove an icon in some state, unset the property; the pseudo-element and its gap disappear together, so the text does not shift:

```css
.item:hover {
	--icon-start: initial;
}
```

From JavaScript, when a style rule genuinely cannot express the condition, set the property on the element and leave the rendering to CSS:

```js
el.style.setProperty("--icon-start", "var(--icon-check)");
el.style.setProperty("--icon-start", ""); // remove
```

## Defining icon tokens

The package ships no icons. Each project defines its own as `--icon-<name>` custom properties, usually on `:root` in the file where its other tokens live. Add new ones next to the existing ones, in the same style.

### Naming

- `--icon-<name>` in kebab-case, named for what the icon depicts, the way icon sets name them: `--icon-trash`, `--icon-chevron-right`, `--icon-link-external`. Match the project's existing names where it already has a convention.
- Variants are suffixes: `--icon-trash-outlined`, `--icon-star-filled`.
- Semantic aliases are fine as extra tokens: `--icon-delete: var(--icon-trash)`.
- Never name a token `--icon`, `--icon-start`, `--icon-end` or `--icon-style-<anything>`. Those are the system's own properties, and `--icon-style-*` is reserved so that icon names can never collide with it.

### What makes a valid icon

The icon is used as a mask, so only its alpha channel matters:

- **Monochrome.** Any opaque color renders as the text color. Varying opacity is fine; multiple colors are not. A multi-color illustration is an image, not an icon: use `<img>` for that.
- **Shapes must be painted.** A path with `fill="none"` and no `stroke` is invisible. Stroke-based icons need an explicit `stroke` color (any color) on the shapes.
- **Needs `xmlns="http://www.w3.org/2000/svg"`** on the root element. Browsers render an SVG without it inline in HTML, but not as an image, which is what a mask loads.
- **Needs a `viewBox`.** `width` and `height` attributes are harmless but unnecessary; the icon is drawn as a 1em square with `contain` fit.
- Square `viewBox`es fill the square; non-square ones are letterboxed inside it, which is usually fine.

### Embedded or file?

Embedding as a data URI keeps the token self-contained and avoids an extra request; it is the default for small icons. Use a file for large icons or when the project already keeps icon files.

Embedded, with the quoting the README uses (double quotes outside, single quotes inside, `#` written as `%23`):

```css
:root {
	--icon-check: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path d='M2 8.5 6 12.5 14 4' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>");
}
```

Run `scripts/svg-to-token.js` to produce such a declaration from an SVG file; it handles the quoting and escaping, keeps license comments, and warns about icons that will not work as masks:

```sh
node <this skill's directory>/scripts/svg-to-token.js path/to/trash.svg
node <this skill's directory>/scripts/svg-to-token.js icons/*.svg          # one line per file
node <this skill's directory>/scripts/svg-to-token.js logo.svg --name github
```

File-based, which must be a root-relative or absolute URL. A relative URL would resolve against the stylesheet that _uses_ the icon (the package's `icons.css`), not the one that defines it, so `url("icons/x.svg")` breaks:

```css
:root {
	--icon-link-external: url("/icons/link-external.svg");
}
```

If the project must use relative paths, register the token as an `<image>` property; `@property` makes URLs resolve against the defining stylesheet:

```css
@property --icon-link-external {
	syntax: "<image>";
	inherits: true;
	initial-value: url("icons/link-external.svg");
}
```

### Bringing in an icon from an icon set

Take the SVG from the set (Bootstrap Icons, Font Awesome Free, Lucide, Heroicons, Phosphor and similar all ship plain SVGs), keep it monochrome, and convert it with the script. Keep any license comment the set includes in the SVG; the test suite in this package keeps Font Awesome's, which is what its license asks for. Do not add the set's JavaScript, web font or framework components to the project.

## Styling icons

Three inherited properties style icons. Set them on an ancestor to affect every icon within it, or on the element for just its own. They are deliberately separate from the `--icon-*` namespace.

| Property               | Default        | Meaning                      |
| ---------------------- | -------------- | ---------------------------- |
| `--icon-style-color`   | `currentColor` | Icon color                   |
| `--icon-style-size`    | `1em`          | Icon width and height        |
| `--icon-style-spacing` | `0.3em`        | Gap between icon and content |

```css
.toolbar {
	--icon-style-size: 1.25em;
	--icon-style-color: color-mix(in srgb, currentColor 70%, transparent);
}
```

Use these rather than styling `::before` or `::after` directly; the pseudo-element's size, color, alignment and mask are the system's, and overriding them piecemeal breaks centering on the text. Things the system handles already, so you do not have to: vertical centering on the text's visual center across fonts and line heights, no gap on icon-only elements, `flex: none` inside flex and grid, `pointer-events: none`, forced-colors mode.

Two layout notes:

- In a flex or grid container with `gap`, the icon is its own item, so the container's gap and `--icon-style-spacing` both apply. Set `--icon-style-spacing: 0` there if the double spacing shows.
- The element itself can carry background, border, padding and so on; the icon is only the pseudo-element. For an icon in a circle, style the `.icon` element, not the icon.

## Accessibility

The icon has no accessible name: it is a decorative pseudo-element, and in browsers without style queries it is not there at all. So the element's text has to carry the meaning on its own.

- Icon-only controls need an `aria-label` (or visually hidden text): `<button style="--icon: var(--icon-trash)" aria-label="Delete"></button>`.
- Do not convey status by icon alone. "Saved" with a check mark is fine; a bare check mark is not.
- Where an icon is essential and must show in every browser that supports masks, opt in with the `.icon`, `.icon-start` or `.icon-end` classes, which do not rely on style queries. Everywhere else, icons applied by the properties alone are a progressive enhancement, which is the intended default.

## Pitfalls

- **The element already uses that pseudo-element.** If the project's CSS sets `content` on the same `::before` or `::after` (a custom bullet, a quote mark, a clearfix), the project's more specific rule wins and the icon never appears. Use the other location, or move the existing content.
- **Nested icons are fine; inherited `--icon` is the thing to watch.** Each element renders only its own `--icon-start`/`--icon-end`, but `--icon` inherits into every component below it.
- **Replacing a native marker.** When an icon stands in for a `<summary>` triangle or a list bullet and you hide the native one (`list-style: none`), browsers without style queries show nothing at all. Use the `.icon-start` class on those elements so the replacement does not depend on style queries, or leave the native marker in place.
- **Whitespace is content.** `<span style="--icon-start: …"> </span>` is not `:empty`, so it gets the gap. Make icon-only elements truly empty.
- **Custom properties animate discretely.** `transition` on an icon swap flips halfway through rather than cross-fading; that is expected.
- **Browser support.** Style queries are the newest requirement (Chrome 111, Safari 18, Firefox 2026). Check rendering in a current Chromium: open the page, inspect the element and confirm the `::before` or `::after` has `content: image-set(...)` and a `mask`. If the pseudo-element is missing, see `references/troubleshooting.md`.

## Editing the package itself

If the project you are in _is_ `@nudeui/icons` (the repo with `icons-mixins.css`), the source of truth is `icons-mixins.css`, written with `@mixin`/`@apply`. `icons.css` is generated from it by `npm run build` and committed; never edit `icons.css` by hand. Serve the repo root and open `test/index.html` to check rendering; every test states what you should see.
