import { memoTextSchema } from "@app/contract";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { orpc } from "@/shared/api";
import {
	BottomSheet,
	BottomSheetBody,
	BottomSheetContent,
	BottomSheetFooter,
	Button,
	Spinner,
	Textarea,
	useNotice,
	useStepOverlay,
} from "@/shared/ui";
import { useReaderStore } from "../model/reader-store";
import { PassageQuote } from "./passage-quote";

/** 생각 남기기 (or 생각 덧붙이기 to a question). Bound to the `memo` overlay. */
export function MemoSheet({
	libraryId,
	bookId,
	ch,
	onSaved,
}: {
	libraryId: string;
	bookId: string;
	ch: number;
	onSaved: () => void;
}) {
	const overlay = useStepOverlay();
	const target = useReaderStore((state) => state.memo);
	return (
		<BottomSheet {...overlay.bind("memo")}>
			<BottomSheetContent title={target?.q ? "생각 덧붙이기" : "생각 남기기"}>
				{target && (
					<MemoForm
						key={`${target.passage.p}-${target.passage.s}-${target.q ?? ""}`}
						target={target}
						libraryId={libraryId}
						bookId={bookId}
						ch={ch}
						onSaved={onSaved}
					/>
				)}
			</BottomSheetContent>
		</BottomSheet>
	);
}

function MemoForm({
	target,
	libraryId,
	bookId,
	ch,
	onSaved,
}: {
	target: NonNullable<ReturnType<typeof useReaderStore.getState>["memo"]>;
	libraryId: string;
	bookId: string;
	ch: number;
	onSaved: () => void;
}) {
	const overlay = useStepOverlay();
	const notify = useNotice();
	const [text, setText] = useState("");
	const create = useMutation(
		orpc.traces.create.mutationOptions({
			onSuccess: () => {
				overlay.close();
				notify(target.q ? "생각을 덧붙였어요" : "흔적을 남겼어요");
				onSaved();
			},
		}),
	);
	const valid = memoTextSchema.safeParse(text).success;
	return (
		<form
			className="contents"
			onSubmit={(event) => {
				event.preventDefault();
				if (!valid) return;
				const anchor = { libraryId, bookId, ch, ...target.passage };
				create.mutate(
					target.q
						? { ...anchor, kind: "qa", q: target.q, text }
						: { ...anchor, kind: "memo", text },
				);
			}}
		>
			<BottomSheetBody withFooter className="flex flex-col gap-3 pt-3">
				<PassageQuote quote={target.passage.quote} />
				{target.q && <p className="text-sm font-semibold text-primary">Q. {target.q}</p>}
				<Textarea
					autoFocus
					aria-label={target.q ? "이 질문에 대한 생각" : "이 구절에 대한 생각"}
					value={text}
					onChange={(event) => setText(event.target.value)}
					maxLength={1000}
					placeholder="이 구절을 읽고 떠오른 생각을 남겨보세요"
					className="min-h-32 rounded-xl px-4 py-3 text-base"
				/>
				<p className="text-right text-xs text-muted-foreground tabular-nums">
					{text.length} / 1000
				</p>
				{create.isError && (
					<p role="alert" className="text-sm text-destructive">
						남기지 못했어요. 다시 시도해주세요.
					</p>
				)}
			</BottomSheetBody>
			<BottomSheetFooter>
				<Button type="button" variant="secondary" size="lg" onClick={() => overlay.close()}>
					취소
				</Button>
				<Button type="submit" size="lg" disabled={!valid || create.isPending}>
					{create.isPending && <Spinner data-icon="inline-start" />}
					남기기
				</Button>
			</BottomSheetFooter>
		</form>
	);
}
