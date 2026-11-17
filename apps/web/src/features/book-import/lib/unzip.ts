import { ImportError } from "./import-error";

type Entry = { flags: number; method: number; size: number; offset: number };

/**
 * A minimal ZIP reader for EPUB: reads the central directory and inflates entries with the
 * browser's `DecompressionStream`. Entries with the encryption flag mean DRM.
 */
export async function unzip(buffer: ArrayBuffer) {
	const view = new DataView(buffer);
	const bytes = new Uint8Array(buffer);
	let end = -1;
	for (
		let index = buffer.byteLength - 22;
		index >= Math.max(0, buffer.byteLength - 65_600);
		index -= 1
	) {
		if (view.getUint32(index, true) === 0x06054b50) {
			end = index;
			break;
		}
	}
	if (end < 0) throw new ImportError("read");
	const count = view.getUint16(end + 10, true);
	let pointer = view.getUint32(end + 16, true);
	const files = new Map<string, Entry>();
	const decoder = new TextDecoder();
	for (let index = 0; index < count; index += 1) {
		if (view.getUint32(pointer, true) !== 0x02014b50) break;
		const nameLength = view.getUint16(pointer + 28, true);
		const extraLength = view.getUint16(pointer + 30, true);
		const commentLength = view.getUint16(pointer + 32, true);
		files.set(decoder.decode(bytes.subarray(pointer + 46, pointer + 46 + nameLength)), {
			flags: view.getUint16(pointer + 8, true),
			method: view.getUint16(pointer + 10, true),
			size: view.getUint32(pointer + 20, true),
			offset: view.getUint32(pointer + 42, true),
		});
		pointer += 46 + nameLength + extraLength + commentLength;
	}
	const find = (name: string) => {
		let decoded = name;
		try {
			decoded = decodeURIComponent(name);
		} catch {
			// Not percent-encoded.
		}
		const direct = files.get(name) ?? files.get(decoded);
		if (direct) return direct;
		const wanted = new Set([name.toLowerCase(), decoded.toLowerCase()]);
		return [...files].find(([key]) => wanted.has(key.toLowerCase()))?.[1];
	};
	async function read(name: string): Promise<Uint8Array | null> {
		const entry = find(name);
		if (!entry) return null;
		if (entry.flags & 1) throw new ImportError("drm");
		const start =
			entry.offset +
			30 +
			view.getUint16(entry.offset + 26, true) +
			view.getUint16(entry.offset + 28, true);
		const data = bytes.slice(start, start + entry.size);
		if (entry.method === 0) return data;
		if (entry.method !== 8) throw new ImportError("read");
		const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
		return new Uint8Array(await new Response(stream).arrayBuffer());
	}
	return {
		names: [...files.keys()],
		read,
		text: async (name: string) => {
			const data = await read(name);
			return data && new TextDecoder("utf-8").decode(data);
		},
	};
}
