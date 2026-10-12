# Troubleshooting: the icon does not show

Work down the list; each item is a distinct cause with a distinct fix. Inspect the element in a current Chromium: a working icon is a `::before` (for `--icon-start`) or `::after` (for `--icon-end`) pseudo-element whose computed `content` is `image-set(...)` and whose `mask` is the icon URL.

## No pseudo-element at all

- **The stylesheet is not loaded.** Confirm `icons.css` from `@nudeui/icons` is actually in the page (Network tab, or the `@property --icon-start` rule in the Styles pane).
- **The property is set on the wrong element.** `--icon-start` and `--icon-end` do not inherit. They must be on the element that should display the icon, not on a parent. `--icon` does inherit, but only becomes an icon on an element that redirects it (a component rule like `:where(button) { --icon-start: var(--icon) }` or the `.icon` class).
- **The element cannot have pseudo-elements.** `<img>`, `<input>`, `<select>`, `<textarea>`, `<iframe>`, `<video>`, `<br>`. Move the icon to a wrapper, or use `appearance: none` on a form control (the test page's checkbox does this).
- **No style query support.** Chrome < 111, Safari < 18, older Firefox. Icons placed by property alone are a progressive enhancement there. Where the icon is essential, add the `.icon`, `.icon-start` or `.icon-end` class.
- **The token is undefined or misspelled.** `var(--icon-trahs)` resolves to nothing, so `content` is invalid and the pseudo-element is dropped by design. Check the computed value of the placement property on the element.

## Pseudo-element exists but is empty or wrong

- **The project's own `::before`/`::after` rule wins.** Any rule with specificity above `(0,0,1)` that sets `content` on the same pseudo-element overrides the icon. Use the other location or move that content.
- **The SVG has no `xmlns`.** A data URI SVG without `xmlns="http://www.w3.org/2000/svg"` renders nothing. `scripts/svg-to-token.js` adds it.
- **Nothing in the SVG paints.** Shapes with `fill="none"` and no `stroke` are transparent, and a mask of nothing is nothing. Give strokes a color.
- **The data URI is malformed.** Unescaped `#` (write `%23`), a `"` inside a `url("...")`, or a line break inside the string. Regenerate with the script.
- **Relative file URL.** `url("icons/x.svg")` resolves relative to the package's `icons.css`, not the stylesheet defining the token. Use a root-relative or absolute URL, embed the SVG, or register the token with `@property { syntax: "<image>" }`.
- **Multi-color icon looks like a blob.** Masks use only alpha; every opaque color becomes the text color. Simplify the icon or, for a real illustration, use `<img>`.
- **Transparent or wrong color.** `--icon-style-color` set somewhere up the tree, or the element's `color` itself. Both are inherited; look for the nearest declaration.

## Layout looks off

- **Gap but no visible icon on an icon-only element.** The element contains whitespace, so `:empty` does not match. Remove it.
- **Double gap in a flex row.** The container's `gap` plus `--icon-style-spacing`. Set `--icon-style-spacing: 0` on that element.
- **Icon not centered on the text.** Someone overrode `vertical-align`, `height` or `display` on the pseudo-element. Remove the override; use `--icon-style-size` for size.
- **Icon on the wrong side in RTL.** It is not; `start` and `end` are logical. If a direction-specific icon is wanted (an arrow), swap the token under `:dir(rtl)`.

## WebKit specifics

Safari 18+ needs two workarounds that `icons.css` ships, scoped to WebKit in the cascade layers `webkit-301609-fix` and `webkit-325900-fix`. Your own declarations always beat them. If an icon fails to update in Safari after a style change, it is one of those bugs; nothing in the project needs to change, but confirm the shipped `icons.css` is unmodified and current.
