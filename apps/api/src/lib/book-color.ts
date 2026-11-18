/** Muted cover colours that carry white serif titles. Picked by a hash of the book id. */
const coverColors = ["#4F6F94", "#5F7552", "#94584A", "#5E5A8A", "#7A6848", "#3F7677", "#87577A"];

export function bookColor(id: string) {
	let hash = 0;
	for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	return coverColors[hash % coverColors.length] ?? "#4F6F94";
}
