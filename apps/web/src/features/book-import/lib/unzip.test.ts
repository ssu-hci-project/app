import { describe, expect, it } from "bun:test";
import { isDrmEncryption } from "./epub";
import { ImportError } from "./import-error";
import { unzip } from "./unzip";

type File = { name: string; data: Uint8Array<ArrayBuffer>; method: 0 | 8; encrypted?: boolean };

async function deflate(data: Uint8Array<ArrayBuffer>) {
	const stream = new Blob([data]).stream().pipeThrough(new CompressionStream("deflate-raw"));
	return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Builds a ZIP archive with stored or deflated entries (no CRC check in the reader). */
async function zip(files: File[]) {
	const encoder = new TextEncoder();
	const locals: Uint8Array<ArrayBuffer>[] = [];
	const centrals: Uint8Array<ArrayBuffer>[] = [];
	let offset = 0;
	for (const file of files) {
		const name = encoder.encode(file.name);
		const body = file.method === 8 ? await deflate(file.data) : file.data;
		const local = new DataView(new ArrayBuffer(30));
		local.setUint32(0, 0x04034b50, true);
		local.setUint16(6, file.encrypted ? 1 : 0, true);
		local.setUint16(8, file.method, true);
		local.setUint32(18, body.length, true);
		local.setUint32(22, file.data.length, true);
		local.setUint16(26, name.length, true);
		locals.push(new Uint8Array(local.buffer), name, body);
		const central = new DataView(new ArrayBuffer(46));
		central.setUint32(0, 0x02014b50, true);
		central.setUint16(8, file.encrypted ? 1 : 0, true);
		central.setUint16(10, file.method, true);
		central.setUint32(20, body.length, true);
		central.setUint32(24, file.data.length, true);
		central.setUint16(28, name.length, true);
		central.setUint32(42, offset, true);
		centrals.push(new Uint8Array(central.buffer), name);
		offset += 30 + name.length + body.length;
	}
	const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
	const end = new DataView(new ArrayBuffer(22));
	end.setUint32(0, 0x06054b50, true);
	end.setUint16(8, files.length, true);
	end.setUint16(10, files.length, true);
	end.setUint32(12, centralSize, true);
	end.setUint32(16, offset, true);
	return (await new Blob([
		...locals,
		...centrals,
		new Uint8Array(end.buffer),
	]).arrayBuffer()) as ArrayBuffer;
}

const bytes = (text: string) => new TextEncoder().encode(text);

describe("unzip", () => {
	it("reads stored and deflated entries, case-insensitively", async () => {
		const archive = await unzip(
			await zip([
				{ name: "mimetype", data: bytes("application/epub+zip"), method: 0 },
				{ name: "OEBPS/Chapter 1.xhtml", data: bytes("<p>정원</p>".repeat(50)), method: 8 },
			]),
		);
		expect(archive.names).toEqual(["mimetype", "OEBPS/Chapter 1.xhtml"]);
		expect(await archive.text("mimetype")).toBe("application/epub+zip");
		expect(await archive.text("oebps/chapter%201.xhtml")).toBe("<p>정원</p>".repeat(50));
		expect(await archive.read("missing")).toBeNull();
	});

	it("reports DRM for encrypted entries and rejects non-zip files", async () => {
		const archive = await unzip(
			await zip([{ name: "a.xhtml", data: bytes("x"), method: 0, encrypted: true }]),
		);
		expect(archive.read("a.xhtml")).rejects.toThrow(ImportError);
		expect(unzip(new ArrayBuffer(10))).rejects.toThrow(ImportError);
	});
});

describe("isDrmEncryption", () => {
	it("treats font obfuscation as fine and anything else as DRM", () => {
		const fonts = `<encryption><EncryptedData><CipherData><CipherReference URI="OEBPS/fonts/a.otf"/></CipherData></EncryptedData></encryption>`;
		const text = `<encryption><EncryptedData><CipherData><CipherReference URI="OEBPS/ch1.xhtml"/></CipherData></EncryptedData></encryption>`;
		expect(isDrmEncryption(null)).toBe(false);
		expect(isDrmEncryption(fonts)).toBe(false);
		expect(isDrmEncryption(text)).toBe(true);
	});
});
