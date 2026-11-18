import { create } from "zustand";

export type Passage = { p: number; s: number; e: number; quote: string };

type ReaderStore = {
	/** The passage whose cards the 흔적 sheet shows. */
	thread: { passage: Passage } | null;
	/** Card whose reply box is open, and what has been typed so far. */
	replyTo: string | null;
	draft: string;
	/** The reader is typing in the sheet, so it should not refresh under them. */
	typing: boolean;
	/** The question just answered, for 같은 질문, 다른 생각. */
	answered: { q: string; passage: Passage } | null;
	/** 생각 남기기 target; `q` set when adding to a question. */
	memo: { passage: Passage; q?: string } | null;
	failedDraft: { kind: "memo" | "qa"; text: string; q?: string } | null;
};

/**
 * State the reader's sheets share. Kept outside the sheets so it survives switching to the
 * profile sheet and back.
 */
export const useReaderStore = create<ReaderStore>(() => ({
	thread: null,
	replyTo: null,
	draft: "",
	typing: false,
	answered: null,
	memo: null,
	failedDraft: null,
}));
