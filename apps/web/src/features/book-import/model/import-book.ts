import { useMutation } from "@tanstack/react-query";
import { create } from "zustand";
import { useCurrentLibrary } from "@/entities/library";
import { client } from "@/shared/api";
import { useNotice } from "@/shared/ui";
import { chunkBook, normaliseBook } from "../lib/chunk";
import { ImportError, importMessage } from "../lib/import-error";
import type { ParsedBook } from "../lib/parsed-book";

const MAX_BYTES = 60 * 1024 * 1024;
const ACCEPT = ".epub,.txt,.html,.htm,application/epub+zip,text/plain,text/html";

type ImportProgress =
	| { stage: "open"; name: string }
	| { stage: "parse"; done: number; total: number }
	| { stage: "upload"; percent: number };

/** What the full-screen progress overlay shows while a book is being imported. */
export const useImportProgress = create<{ progress: ImportProgress | null }>(() => ({
	progress: null,
}));
const report = (progress: ImportProgress | null) => useImportProgress.setState({ progress });

async function parseFile(file: File): Promise<ParsedBook> {
	const name = file.name.replace(/\.[^.]+$/, "");
	const extension = (file.name.split(".").pop() ?? "").toLowerCase();
	const buffer = await file.arrayBuffer().catch(() => {
		throw new ImportError("read");
	});
	if (extension === "epub" || file.type === "application/epub+zip") {
		const { parseEpub } = await import("../lib/epub");
		return parseEpub(buffer, (done, total) => report({ stage: "parse", done, total }));
	}
	const { decodeText, parseHtml, parseTxt } = await import("../lib/text");
	if (extension === "html" || extension === "htm") return parseHtml(decodeText(buffer), name);
	if (extension === "txt" || file.type.startsWith("text/"))
		return parseTxt(decodeText(buffer), name);
	throw new ImportError("type");
}

async function importFile(file: File, libraryId: string) {
	if (file.size > MAX_BYTES) throw new ImportError("size");
	report({ stage: "open", name: file.name });
	let parsed: ParsedBook;
	try {
		parsed = normaliseBook(await parseFile(file));
	} catch (error) {
		throw error instanceof ImportError ? error : new ImportError("read");
	}
	if (!parsed.chapters.length) throw new ImportError("empty");
	const title = (parsed.title || file.name.replace(/\.[^.]+$/, "")).slice(0, 120);
	const chunks = chunkBook(parsed);
	report({ stage: "upload", percent: 0 });
	const { bookId } = await client.books.uploadBegin({
		libraryId,
		title,
		author: parsed.author.slice(0, 80),
		chapters: parsed.chapters.map((chapter) => ({
			title: chapter.title,
			chars: chapter.paragraphs.reduce((sum, paragraph) => sum + paragraph.length, 0),
			paragraphs: chapter.paragraphs.length,
		})),
	});
	for (const [index, chunk] of chunks.entries()) {
		await client.books.uploadChunk({ bookId, ...chunk });
		report({ stage: "upload", percent: Math.round(((index + 1) / chunks.length) * 100) });
	}
	await client.books.uploadFinish({ bookId });
	return { bookId, title };
}

/**
 * Picks or receives an EPUB/TXT/HTML file, parses it in the browser and uploads it chapter by
 * chapter to the current library.
 */
export function useBookImport(onImported: (bookId: string) => void) {
	const { libraryId } = useCurrentLibrary();
	const notify = useNotice();
	const mutation = useMutation({
		mutationFn: (file: File) => {
			if (!libraryId) throw new ImportError("read");
			return importFile(file, libraryId);
		},
		onSuccess: ({ bookId, title }) => {
			notify(`『${title}』을 서재에 담았어요`, "positive");
			onImported(bookId);
		},
		onError: (error) => notify(importMessage(error), "critical"),
		onSettled: () => report(null),
	});
	return {
		pending: mutation.isPending,
		importFile: (file: File) => mutation.mutate(file),
		chooseFile: () => {
			const input = document.createElement("input");
			input.type = "file";
			input.accept = ACCEPT;
			input.onchange = () => {
				const file = input.files?.[0];
				if (file) mutation.mutate(file);
			};
			input.click();
		},
	};
}
