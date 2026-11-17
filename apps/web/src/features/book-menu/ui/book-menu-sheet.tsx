import type { Book } from "@app/contract";
import { useFlow } from "@stackflow/react";
import { useMutation } from "@tanstack/react-query";
import { BookOpenIcon, HeartIcon, HeartOffIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { orpc } from "@/shared/api";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	MenuSheet,
	MenuSheetContent,
	MenuSheetItem,
	useNotice,
	useStepOverlay,
} from "@/shared/ui";

/** 책 정보 · 담기/빼기 · 서재에서 삭제(확인 후). Bound to the `book-menu` overlay. */
export function BookMenuSheet({ book }: { book: Book | undefined }) {
	const overlay = useStepOverlay();
	const flow = useFlow();
	const notify = useNotice();
	const [confirming, setConfirming] = useState(false);
	const save = useMutation(
		orpc.saved.set.mutationOptions({
			onSuccess: ({ saved }) => notify(saved ? "내 서재에 담았어요" : "내 서재에서 뺐어요"),
		}),
	);
	const remove = useMutation(
		orpc.books.remove.mutationOptions({
			onSuccess: () => {
				setConfirming(false);
				notify("서재에서 삭제했어요");
			},
			onError: () => notify("삭제하지 못했어요. 다시 시도해주세요.", "critical"),
		}),
	);
	if (!book) return null;
	return (
		<>
			<MenuSheet {...overlay.bind("book-menu")}>
				<MenuSheetContent title={book.title}>
					<MenuSheetItem
						icon={<BookOpenIcon />}
						label="책 정보"
						onClick={() => {
							overlay.close();
							flow.push("BookPage", { bookId: book.id });
						}}
					/>
					<MenuSheetItem
						icon={book.saved ? <HeartOffIcon /> : <HeartIcon />}
						label={book.saved ? "내 서재에서 빼기" : "내 서재에 담기"}
						onClick={() => {
							overlay.close();
							save.mutate({ bookId: book.id, saved: !book.saved });
						}}
					/>
					{book.canRemove && (
						<MenuSheetItem
							icon={<Trash2Icon />}
							label="서재에서 삭제"
							description="이 서재의 모든 사람에게서 사라져요"
							tone="critical"
							onClick={() => {
								overlay.close();
								setConfirming(true);
							}}
						/>
					)}
				</MenuSheetContent>
			</MenuSheet>
			<AlertDialog open={confirming} onOpenChange={setConfirming}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>『{book.title}』을 삭제할까요?</AlertDialogTitle>
						<AlertDialogDescription>
							이 책과 책에 남은 흔적이 서재의 모든 사람에게서 사라져요. 되돌릴 수 없어요.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>취소</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={remove.isPending}
							onClick={() => remove.mutate({ bookId: book.id })}
						>
							삭제
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
