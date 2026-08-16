/**
 * Section anchor id, in priority order: the editor-set anchor, the block
 * type's conventional id (features/testimonials/pricing/faq -- what the
 * seeded menus link to), a slug of the headline ("Our Services" ->
 * "our-services"), then the Portable Text block key. Gives every section a
 * predictable, linkable id without requiring editors to fill the Anchor
 * field. If a page repeats a block type, set explicit anchors to keep ids
 * unique.
 */
export function sectionAnchor(
	node: { anchor?: string; headline?: string; _key?: string },
	typeDefault?: string,
): string | undefined {
	const anchor = node.anchor?.trim().replace(/^#/, "");
	if (anchor) return anchor;
	if (typeDefault) return typeDefault;
	const fromHeadline = (node.headline ?? "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return fromHeadline || node._key;
}
