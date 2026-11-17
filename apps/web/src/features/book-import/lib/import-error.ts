export type ImportErrorCode = "drm" | "type" | "read" | "empty" | "size";

const messages: Record<ImportErrorCode, string> = {
	drm: "DRM으로 보호된 책은 가져올 수 없어요",
	type: "EPUB, TXT, HTML 파일만 가져올 수 있어요",
	read: "파일을 읽지 못했어요",
	empty: "본문을 찾지 못했어요",
	size: "60MB 이하 파일만 가져올 수 있어요",
};

export class ImportError extends Error {
	constructor(readonly code: ImportErrorCode) {
		super(messages[code]);
	}
}

/** A message for the reader, whatever went wrong. */
export const importMessage = (error: unknown) =>
	error instanceof ImportError ? error.message : messages.read;
