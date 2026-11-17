import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TraceFilters = { underline: boolean; memo: boolean; draw: boolean; react: boolean };
export type ReaderFont = "serif" | "sans";

type ReaderSettings = {
	filters: TraceFilters;
	size: number;
	leading: number;
	font: ReaderFont;
	setFilters: (filters: TraceFilters) => void;
	/** Turns one kind back on, e.g. after drawing an underline while underlines were hidden. */
	show: (kind: keyof TraceFilters) => void;
	setSize: (size: number) => void;
	setLeading: (leading: number) => void;
	setFont: (font: ReaderFont) => void;
};

export const allFilters: TraceFilters = { underline: true, memo: true, draw: true, react: true };

/** Reader preferences, kept on this device and shared by every book. */
export const useReaderSettings = create<ReaderSettings>()(
	persist(
		(set) => ({
			filters: allFilters,
			size: 18,
			leading: 1.8,
			font: "serif",
			setFilters: (filters) => set({ filters }),
			show: (kind) => set((state) => ({ filters: { ...state.filters, [kind]: true } })),
			setSize: (size) => set({ size }),
			setLeading: (leading) => set({ leading }),
			setFont: (font) => set({ font }),
		}),
		{ name: "exchange-reading:reader" },
	),
);

export const someHidden = (filters: TraceFilters) => Object.values(filters).some((on) => !on);
