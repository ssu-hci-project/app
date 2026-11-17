import type { Person } from "@app/contract";
import { readerColors } from "@app/contract";

export const defaultColor = readerColors[0];
export { readerColors };

/** "나" for me, the nickname for others, "독자" until they set one. */
export function personName(person: Pick<Person, "nick"> | undefined, isMine: boolean) {
	if (isMine) return "나";
	return person?.nick ?? "독자";
}

export function personColor(person: Pick<Person, "color"> | undefined) {
	return person?.color ?? defaultColor;
}
