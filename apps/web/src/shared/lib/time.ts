import { dayjs } from "./dayjs";

/** "방금", "5분 전", "2시간 전", "3일 전", then "11월 2일". */
export function timeAgo(iso: string) {
	const time = dayjs(iso);
	const seconds = dayjs().diff(time, "second");
	if (seconds < 60) return "방금";
	if (seconds < 30 * 86400) return time.fromNow();
	return time.format("M월 D일");
}

/** The reader's local calendar day, e.g. "2026-11-17". */
export const today = () => dayjs().format("YYYY-MM-DD");
