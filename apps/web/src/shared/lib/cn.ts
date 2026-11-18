import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
	extend: {
		theme: {
			text: [
				"t1",
				"t2",
				"t3",
				"t4",
				"t5",
				"t6",
				"t7",
				"st2",
				"st3",
				"st7",
				"st8",
				"st9",
				"st10",
				"st11",
				"st12",
			],
		},
	},
});

/** Merge conditional classnames and resolve conflicting Tailwind utility classes. */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
