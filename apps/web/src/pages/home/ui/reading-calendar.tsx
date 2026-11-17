import type { Book } from "@app/contract";
import { useFlow } from "@stackflow/react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { BookRow } from "@/entities/book";
import { orpc } from "@/shared/api";
import { cn, dayjs, today } from "@/shared/lib";
import {
	AppBarIconButton,
	BottomSheet,
	BottomSheetBody,
	BottomSheetContent,
	useStepOverlay,
} from "@/shared/ui";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

/** 읽은 날 캘린더: a cover-coloured dot for each book opened that day. */
export function ReadingCalendar({ books }: { books: Book[] }) {
	const flow = useFlow();
	const overlay = useStepOverlay();
	const [month, setMonth] = useState(() => dayjs().startOf("month"));
	const [day, setDay] = useState<string>();
	const reads = useQuery(
		orpc.reads.month.queryOptions({ input: { month: month.format("YYYY-MM") } }),
	);
	const byDate = new Map((reads.data ?? []).map((entry) => [entry.date, entry.books]));
	const todayKey = today();
	const dates = Array.from({ length: month.daysInMonth() }, (_, index) => month.date(index + 1));
	const readDays = reads.data?.length ?? 0;
	// The 1st sits under its weekday; later days flow after it.
	const start = (date: typeof month) =>
		date.date() === 1 ? { gridColumnStart: month.day() + 1 } : undefined;
	const dayBooks = day ? (byDate.get(day) ?? []) : [];
	return (
		<section aria-labelledby="calendar-heading" className="px-3">
			<div className="flex items-center justify-between px-1 pb-2">
				<button
					id="calendar-heading"
					type="button"
					onClick={() => setMonth(dayjs().startOf("month"))}
					className="flex h-11 items-center gap-1 rounded-lg px-2 text-lg font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted"
				>
					{month.format("YYYY년 M월")}
					<ChevronDownIcon className="size-5" aria-hidden="true" />
					<span className="sr-only">, 이번 달로</span>
				</button>
				<div className="flex">
					<AppBarIconButton
						className="size-11"
						aria-label="이전 달"
						onClick={() => setMonth(month.subtract(1, "month"))}
					>
						<ChevronLeftIcon />
					</AppBarIconButton>
					<AppBarIconButton
						className="size-11"
						aria-label="다음 달"
						onClick={() => setMonth(month.add(1, "month"))}
					>
						<ChevronRightIcon />
					</AppBarIconButton>
				</div>
			</div>
			<div className="grid grid-cols-7 pb-1" aria-hidden="true">
				{weekdays.map((name, index) => (
					<span
						key={name}
						className={cn(
							"text-center text-xs font-medium text-muted-foreground",
							index === 0 && "text-destructive",
						)}
					>
						{name}
					</span>
				))}
			</div>
			<div className="grid grid-cols-7">
				{dates.map((date) => {
					const key = date.format("YYYY-MM-DD");
					const opened = byDate.get(key) ?? [];
					const future = key > todayKey;
					const isToday = key === todayKey;
					const label = `${date.format("M월 D일")}${opened.length ? `, ${opened.length}권 읽음` : ""}`;
					const content = (
						<>
							<span
								className={cn(
									"grid size-7 place-items-center rounded-full text-[13px]",
									future && "text-muted-foreground",
									isToday && "border border-primary font-bold text-primary",
								)}
							>
								{date.date()}
							</span>
							<span className="flex h-2 items-center gap-0.5">
								{opened.slice(0, 3).map((book) => (
									<span
										key={book.id}
										className="size-1.5 rounded-full"
										style={{ backgroundColor: book.color }}
									/>
								))}
								{opened.length > 3 && (
									<span className="text-[10px] leading-none font-semibold text-muted-foreground">
										+{opened.length - 3}
									</span>
								)}
							</span>
						</>
					);
					return opened.length ? (
						<button
							key={key}
							type="button"
							aria-label={label}
							onClick={() => {
								if (opened.length === 1 && opened[0])
									flow.push("BookPage", { bookId: opened[0].id });
								else {
									setDay(key);
									overlay.open("day");
								}
							}}
							className="flex h-13 flex-col items-center gap-0.5 rounded-lg pt-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted"
							style={start(date)}
						>
							{content}
						</button>
					) : (
						<div
							key={key}
							className="flex h-13 flex-col items-center gap-0.5 pt-1"
							style={start(date)}
						>
							<span className="sr-only">{label}</span>
							<span aria-hidden="true" className="contents">
								{content}
							</span>
						</div>
					);
				})}
			</div>
			<p className="mt-2 text-center text-[13px] text-muted-foreground">
				{readDays
					? `${month.format("M월")}에 ${readDays}일 읽었어요`
					: "책을 펼친 날에 점이 찍혀요"}
			</p>
			<BottomSheet {...overlay.bind("day")}>
				<BottomSheetContent
					title={day ? `${dayjs(day).format("M월 D일")}에 읽은 책` : "그날 읽은 책"}
					description={`${dayBooks.length}권을 펼쳤어요`}
				>
					<BottomSheetBody className="-mx-0 px-0">
						{dayBooks.map((entry) => {
							const book = books.find((candidate) => candidate.id === entry.id);
							return (
								<BookRow
									key={entry.id}
									book={{ title: entry.title, author: book?.author ?? "", color: entry.color }}
									onClick={() => {
										overlay.close();
										flow.push("BookPage", { bookId: entry.id });
									}}
								/>
							);
						})}
					</BottomSheetBody>
				</BottomSheetContent>
			</BottomSheet>
		</section>
	);
}
