/** Sentence ranges [start, end) inside a paragraph, trimmed of surrounding spaces. */
export function sentences(text: string): [number, number][] {
	const out: [number, number][] = [];
	const pattern = /[^\n.!?。…]+(?:[.!?。…]+["'”’」』)\]]*)?|[.!?。…]+/g;
	for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
		let start = match.index;
		let end = start + match[0].length;
		while (start < end && /\s/.test(text[start] ?? "")) start += 1;
		while (end > start && /\s/.test(text[end - 1] ?? "")) end -= 1;
		if (end > start) out.push([start, end]);
	}
	return out;
}
