import type { Book } from "@app/contract";
import { IconChevronLeftLine, IconChevronRightLine } from "@karrotmarket/react-monochrome-icon";
import { ActionButton, PrefixIcon, SuffixIcon } from "@seed-design/react";
import { useStepFlow } from "@stackflow/react";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { orpc } from "@/shared/api";
import {
	BottomSheetBody,
	BottomSheetContent,
	BottomSheetRoot,
	useNotice,
	useStepOverlay,
	WheelPicker,
} from "@/shared/ui";

/**
 * 리더 하단의 쪽 넘김 막대입니다. 한 쪽씩은 이전/다음으로, 멀리 갈 때는 가운데 쪽 번호를 눌러
 * 휠로 고릅니다. 바뀐 쪽은 URL step과 읽던 위치에 함께 저장합니다.
 */
export function PageBar({
	book,
	page,
	groupId,
	allowed,
}: {
	book: Book;
	page: number;
	groupId?: string;
	allowed: boolean;
}) {
	const { replaceStep } = useStepFlow("ReadingPage");
	const overlay = useStepOverlay();
	const notify = useNotice();
	const validPage = Number.isInteger(page) && page > 0 && page <= book.pageCount;
	const shown = validPage ? page : Math.min(Math.max(1, Math.trunc(page) || 1), book.pageCount);
	const { mutate } = useMutation(
		orpc.reading.saveProgress.mutationOptions({
			onError: () => notify("읽던 쪽을 저장하지 못했어요", "critical"),
		}),
	);
	useEffect(() => {
		if (validPage && allowed) mutate({ bookId: book.id, page, groupId: groupId ?? null });
	}, [book.id, page, groupId, validPage, allowed, mutate]);
	const go = (next: number) =>
		replaceStep({
			bookId: book.id,
			page: String(next),
			groupId: allowed ? (groupId ?? "private") : "private",
		});
	return (
		<nav aria-label="쪽 넘기기" className="flex items-center gap-x2">
			<ActionButton
				variant="neutralWeak"
				size="medium"
				disabled={shown <= 1}
				onClick={() => go(shown - 1)}
			>
				<PrefixIcon svg={<IconChevronLeftLine />} />
				이전
			</ActionButton>
			<ActionButton
				variant="ghost"
				size="medium"
				className="flex-1 tabular-nums"
				aria-label={`${shown}쪽, 전체 ${book.pageCount}쪽. 눌러서 쪽 고르기`}
				onClick={() => overlay.open("page")}
			>
				{shown} / {book.pageCount}
			</ActionButton>
			<ActionButton
				variant="neutralWeak"
				size="medium"
				disabled={shown >= book.pageCount}
				onClick={() => go(shown + 1)}
			>
				다음
				<SuffixIcon svg={<IconChevronRightLine />} />
			</ActionButton>
			<BottomSheetRoot {...overlay.bind("page")}>
				<BottomSheetContent title="몇 쪽으로 갈까요?">
					<BottomSheetBody>
						<PagePicker
							pageCount={book.pageCount}
							initial={shown}
							onSelect={(next) => {
								overlay.close();
								go(next);
							}}
						/>
					</BottomSheetBody>
				</BottomSheetContent>
			</BottomSheetRoot>
		</nav>
	);
}

function PagePicker({
	pageCount,
	initial,
	onSelect,
}: {
	pageCount: number;
	initial: number;
	onSelect: (page: number) => void;
}) {
	const [value, setValue] = useState(String(initial));
	const options = Array.from({ length: pageCount }, (_, index) => ({
		value: String(index + 1),
		label: `${index + 1}쪽`,
	}));
	return (
		<div className="flex flex-col gap-x4 pb-x6">
			<WheelPicker
				aria-label="쪽 선택"
				columns={[{ id: "page", options, value, onValueChange: setValue }]}
			/>
			<ActionButton variant="neutralSolid" size="large" onClick={() => onSelect(Number(value))}>
				{value}쪽으로 이동
			</ActionButton>
		</div>
	);
}
