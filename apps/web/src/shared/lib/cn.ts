import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional classnames and resolve conflicting Tailwind utility classes. */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
