import type { GroupBook, Library } from "@app/contract";

const inviteLink = (inviteCode: string) => `${window.location.origin}/invite/${inviteCode}`;

const bookTitles = (books: GroupBook[]) => {
	const [first, ...rest] = books;
	if (!first) return "";
	return rest.length ? `『${first.title}』 외 ${rest.length}권` : `『${first.title}』`;
};

/** The message sent with an invite. Names the group's books when it has some. */
function inviteMessage(library: Pick<Library, "name" | "inviteCode">, books: GroupBook[]) {
	return books.length
		? `${bookTitles(books)} 같이 읽어요! 교환독서 모임 『${library.name}』에 초대해요. 초대 코드 ${library.inviteCode}`
		: `교환독서 모임 『${library.name}』에 초대해요. 초대 코드 ${library.inviteCode}`;
}

/**
 * Opens the system share sheet, or copies the message and link where there is none.
 * Call it straight from a tap: browsers drop the share sheet after an awaited request.
 */
export async function shareInvite(
	library: Pick<Library, "name" | "inviteCode">,
	books: GroupBook[] = [],
): Promise<"shared" | "copied" | "cancelled" | "failed"> {
	const url = inviteLink(library.inviteCode);
	const text = inviteMessage(library, books);
	try {
		if (navigator.share) {
			await navigator.share({
				title: books.length ? `${bookTitles(books)} 같이 읽기` : "교환독서 초대",
				text,
				url,
			});
			return "shared";
		}
		await navigator.clipboard.writeText(`${text}\n${url}`);
		return "copied";
	} catch (error) {
		return error instanceof DOMException && error.name === "AbortError" ? "cancelled" : "failed";
	}
}
