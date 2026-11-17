import type { LegacyBook as Book } from "@app/contract";
import { useStepFlow } from "@stackflow/react";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect } from "react";
import { orpc } from "@/shared/api";
import {
	BottomSheet,
	BottomSheetBody,
	BottomSheetContent,
	Button,
	useNotice,
	useStepOverlay,
} from "@/shared/ui";

/**
 * 리더 하단의 쪽 넘김 막대입니다. 한 쪽씩은 이전/다음으로, 멀리 갈 때는 가운데 쪽 번호를 눌러
 * 시트에서 고릅니다. 바뀐 쪽은 URL step과 읽던 위치에 함께 저장합니다.
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
		<nav aria-label="쪽 넘기기" className="flex items-center gap-2">
			<Button variant="outline" disabled={shown <= 1} onClick={() => go(shown - 1)}>
				<ChevronLeftIcon data-icon="inline-start" />
				이전
			</Button>
			<Button
				variant="ghost"
				className="flex-1 tabular-nums"
				aria-label={`${shown}쪽, 전체 ${book.pageCount}쪽. 눌러서 쪽 고르기`}
				onClick={() => overlay.open("page")}
			>
				{shown} / {book.pageCount}
			</Button>
			<Button variant="outline" disabled={shown >= book.pageCount} onClick={() => go(shown + 1)}>
				다음
				<ChevronRightIcon data-icon="inline-end" />
			</Button>
			<BottomSheet {...overlay.bind("page")}>
				<BottomSheetContent title="몇 쪽으로 갈까요?">
					<BottomSheetBody>
						<PagePicker
							pageCount={book.pageCount}
							current={shown}
							onSelect={(next) => {
								overlay.close();
								go(next);
							}}
						/>
					</BottomSheetBody>
				</BottomSheetContent>
			</BottomSheet>
		</nav>
	);
}

function PagePicker({
	pageCount,
	current,
	onSelect,
}: {
	pageCount: number;
	current: number;
	onSelect: (page: number) => void;
}) {
	return (
		<ul aria-label="쪽 선택" className="grid grid-cols-5 gap-2">
			{Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
				<li key={page} className="contents">
					<Button
						variant={page === current ? "default" : "outline"}
						aria-current={page === current ? "page" : undefined}
						aria-label={`${page}쪽으로 이동`}
						className="h-12 tabular-nums"
						onClick={() => onSelect(page)}
					>
						{page}
					</Button>
				</li>
			))}
		</ul>
	);
}
