#!/usr/bin/env node
/**
 * Turn SVG files into @nudeui/icons tokens.
 *
 *   node svg-to-token.js trash.svg                 → --icon-trash: url("data:image/svg+xml,…");
 *   node svg-to-token.js icons/*.svg               → one declaration per file
 *   node svg-to-token.js logo.svg --name github    → --icon-github: …
 *
 * Prints the declarations to stdout, ready to paste into the :root block
 * where the project keeps its icon tokens. Warnings go to stderr.
 *
 * The SVG is kept as is apart from whitespace: comments (often license
 * notices) stay, width/height stay, nothing is optimized. Run an SVG
 * optimizer first if you want a smaller icon.
 */

import { readFileSync } from "node:fs";
import { basename } from "node:path";

const args = process.argv.slice(2);
const files = [];
let nameOverride = null;

for (let i = 0; i < args.length; i++) {
	if (args[i] === "--name") {
		nameOverride = args[++i];
	}
	else if (args[i] === "-h" || args[i] === "--help") {
		printUsage();
		process.exit(0);
	}
	else {
		files.push(args[i]);
	}
}

if (files.length === 0) {
	printUsage();
	process.exit(1);
}

if (nameOverride && files.length > 1) {
	console.error("--name applies to a single file; pass one file at a time to rename.");
	process.exit(1);
}

for (const file of files) {
	const name = nameOverride ?? tokenName(file);
	const svg = readFileSync(file, "utf8");
	console.log(`--icon-${name}: ${toUrl(svg, file)};`);
}

function printUsage () {
	console.error("Usage: node svg-to-token.js <file.svg> [more.svg …] [--name <name>]");
}

/** trash-outlined.svg → trash-outlined, Arrow_Right.svg → arrow-right, chevronDown.svg → chevron-down */
function tokenName (file) {
	return basename(file)
		.replace(/\.svg$/i, "")
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/[^a-zA-Z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.toLowerCase();
}

function toUrl (svg, file) {
	let s = svg
		.replace(/^﻿/, "") // BOM
		.replace(/<\?xml[^>]*\?>\s*/i, "") // XML prolog: not needed in a data URI
		.replace(/<!DOCTYPE[^>]*>\s*/i, "")
		.replace(/\s+/g, " ")
		.replace(/>\s+</g, "><")
		.trim();

	let root = s.match(/<svg\b[^>]*>/i);
	if (!root) {
		console.error(`${file}: no <svg> root element found`);
		process.exit(1);
	}

	// Without the namespace, browsers do not render the data URI at all.
	if (!/\sxmlns\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/.test(root[0])) {
		let fixed = root[0].replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
		s = s.replace(root[0], fixed);
		root = [fixed];
	}

	if (!/\sviewBox\s*=/.test(root[0])) {
		warn(
			file,
			'has no viewBox; the icon will not scale to 1em. Add one (e.g. viewBox="0 0 24 24").',
		);
	}

	lint(s, file);

	// The outer url() uses double quotes, so the SVG must not contain any.
	// Prefer swapping to single quotes (readable); fall back to %22 when
	// the SVG already uses single quotes somewhere.
	if (s.includes('"')) {
		s = s.includes("'") ? s.replaceAll('"', "%22") : s.replaceAll('"', "'");
	}

	// Only what actually breaks a quoted url() in a data URI needs escaping.
	s = s
		.replace(/%(?!2[25])/g, "%25")
		.replaceAll("#", "%23")
		.replace(/[^\x20-\x7E]/g, c => encodeURIComponent(c));

	return `url("data:image/svg+xml,${s}")`;
}

/** The icon is used as a mask: only alpha matters, and nothing invisible paints. */
function lint (svg, file) {
	let colors = new Set();
	for (let m of svg.matchAll(/\b(?:fill|stroke)\s*=\s*["']([^"']*)["']/g)) {
		let v = m[1].trim().toLowerCase();
		if (v && v !== "none" && v !== "currentcolor" && !v.startsWith("url(")) {
			colors.add(v);
		}
	}
	for (let m of svg.matchAll(/\b(?:fill|stroke)\s*:\s*([^;"']+)/g)) {
		let v = m[1].trim().toLowerCase();
		if (v && v !== "none" && v !== "currentcolor" && !v.startsWith("url(")) {
			colors.add(v);
		}
	}
	if (colors.size > 1) {
		warn(
			file,
			`uses several colors (${[...colors].join(", ")}). Masks are monochrome: every color renders as the text color.`,
		);
	}

	let shapes = svg.match(/<(?:path|circle|rect|ellipse|polygon|polyline|line)\b[^>]*>/g) ?? [];
	let painted = shapes.some(shape => {
		let fill = shape.match(/\bfill\s*=\s*["']([^"']*)["']/)?.[1].trim();
		let stroke = shape.match(/\bstroke\s*=\s*["']([^"']*)["']/)?.[1].trim();
		let fillNone = fill?.toLowerCase() === "none";
		let strokeNone = !stroke || stroke.toLowerCase() === "none";
		return !(fillNone && strokeNone);
	});
	if (
		shapes.length > 0 &&
		!painted &&
		!/\b(?:fill|stroke)\s*=/.test(svg.match(/<svg\b[^>]*>/)[0]) &&
		!/<g\b[^>]*\b(?:fill|stroke)\s*=/.test(svg)
	) {
		warn(
			file,
			'every shape has fill="none" and no stroke, so nothing paints and the icon will be invisible.',
		);
	}

	if (/<image\b/i.test(svg)) {
		warn(
			file,
			"contains an <image>; raster content inside a mask is usually not what you want.",
		);
	}
}

function warn (file, message) {
	console.error(`Warning: ${file} ${message}`);
}
