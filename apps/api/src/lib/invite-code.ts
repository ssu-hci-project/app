// 8 characters without look-alikes (0/O, 1/I/L) so a code can be read aloud.
const inviteAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function createInviteCode() {
	return Array.from(
		crypto.getRandomValues(new Uint8Array(8)),
		(byte) => inviteAlphabet[byte % inviteAlphabet.length],
	).join("");
}

/** Pulls the code out of a pasted invite link and normalises case. */
export function normaliseInviteCode(input: string) {
	return (input.trim().split("/").filter(Boolean).pop() ?? "").trim();
}
