# @nudeui/icons

A CSS-only icon system. Icons are design tokens (CSS variables); you place one on any element by setting a custom property, and CSS does the rest.

```html
<button style="--icon: var(--icon-trash)">Delete</button>
```

No markup, no `<svg>`, no components. Icons follow the text color, scale with the font size, and can change in response to any CSS condition: `:hover`, media queries, container queries, dark mode, print, writing direction.

Read the rationale in [The best way to use icons on the Web](https://lea.verou.me/blog/2026/icons/).

## Installation

```sh
npm install @nudeui/icons
```

```css
@import "@nudeui/icons";
```

or link `path/to/@nudeui/icons/index.css` however your project links CSS.

## Usage

### 1. Define icons as tokens

The package ships no icons. Define your own as `--icon-*` variables, embedded or as files:

```css
:root {
	--icon-trash: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path d='…'/></svg>");
	--icon-link-external: url("/icons/link-external.svg");
}
```

Icons must be monochrome (varying opacity is fine), since they are applied as a mask.

### 2. Place icons

| Property       | Renders in  | Meaning                                  |
| -------------- | ----------- | ---------------------------------------- |
| `--icon-start` | `::before`  | Icon before the element's content        |
| `--icon-end`   | `::after`   | Icon after the element's content         |
| `--icon`       | (component) | "Give this component an icon", see below |

Set them anywhere a declaration goes: a stylesheet, an inline style, a media query, a state:

```css
button.delete {
	--icon-start: var(--icon-trash-outlined);

	&:hover {
		--icon-start: var(--icon-trash);
	}
}

a[href^="https://"] {
	@media print {
		--icon-end: var(--icon-link-external);
	}
}
```

Icons are `1em` squares, so they follow `font-size`. Elements with no content (e.g. an icon-only button) get no gap between icon and text.

### Styling icons

These are separate from the `--icon-*` tokens so they can never collide with an icon name. They inherit, so set them on any ancestor to style every icon inside it.

| Property               | Default        | Meaning                      |
| ---------------------- | -------------- | ---------------------------- |
| `--icon-style-color`   | `currentColor` | Icon color                   |
| `--icon-style-size`    | `1em`          | Icon width and height        |
| `--icon-style-spacing` | `0.3em`        | Gap between icon and content |

### 3. Let components own the location

`--icon` is the high-level property: it means "add an icon to this component". Each component redirects it to whichever location makes sense for it, so consumers never have to know:

```css
:where(button) {
	--icon-start: var(--icon);
}
```

Then `<button style="--icon: var(--icon-trash)">`, `button.delete { --icon: var(--icon-trash) }` and so on just work. You can add your own state properties the same way, e.g. `--icon-hover`:

```css
button:hover {
	--icon-start: var(--icon-hover, var(--icon));
}
```

### Standalone icons

For an icon that is not attached to a component, use the `.icon` class, which redirects `--icon` to `--icon-start` on an empty element:

```html
<i class="icon" style="--icon: var(--icon-trash)"></i>
```

Since the icon is a pseudo-element, the element itself can carry a background, border, padding, etc.

### Without style queries

Icons are applied to any element that sets `--icon-start` / `--icon-end`, which relies on [style queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_size_and_style_queries#container_style_queries). In browsers without them, icons are simply absent, which makes them a progressive enhancement.

Where an icon is essential, opt in explicitly with `.icon`, `.icon-start` or `.icon-end`. These work in any browser that supports [masks](https://developer.mozilla.org/en-US/docs/Web/CSS/mask). They only hardcode the location, not the icon: if the property is unset, no pseudo-element is generated.

## Caveats

- **Relative URLs** in icon tokens resolve relative to the stylesheet that _uses_ the icon, not the one that defines it. Use root-relative or absolute URLs for icon files, or embed them.
- **Multi-color icons** are not supported, since the icon is a mask.
- **Backgrounds or borders on the icon itself** are not possible; put them on the element instead (see standalone icons).

## Browser support

Everything is Baseline. Style queries are the newest requirement (Chrome 111, Safari 18, Firefox 2026). Safari 18+ needs workarounds for two WebKit bugs ([#301609](https://bugs.webkit.org/show_bug.cgi?id=301609), [#325900](https://bugs.webkit.org/show_bug.cgi?id=325900)), which the stylesheet ships, scoped to WebKit and in their own cascade layers so your own declarations always win.

## Development

The source is `src/index.css`, written with [CSS mixins](https://drafts.csswg.org/css-mixins/) (`@mixin` / `@apply`) so the icon styles are declared once. No browser applies them natively yet, so `index.css` is transpiled from it with [@csstools/postcss-mixins](https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-mixins) and committed.

```sh
npm run build   # src/index.css → index.css
npm run dev     # rebuild on change
```

To check rendering, serve the repo root (e.g. `npx serve`) and open `test/index.html`. Append `?native` to load the untranspiled source instead, for testing native mixin support.
