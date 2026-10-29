import type { Bookmark } from "@app/contract";
import { noteInputSchema } from "@app/contract";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionButton, Text } from "@seed-design/react";
import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow } from "@stackflow/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { useSessionStorage } from "usehooks-ts";
import type { z } from "zod";
import { orpc } from "@/shared/api";
import {
	LoadState,
	MobileScreen,
	TextField,
	TextFieldInput,
	TextFieldTextarea,
	useNotice,
} from "@/shared/ui";

export const NoteEditorPage: ActivityComponentType<"NoteEditorPage"> = ({ params }) => {
	const flow = useFlow();
	const { isRoot } = useActivity();
	const note = useQuery(
		orpc.notes.get.queryOptions({
			input: { noteId: params.noteId ?? "" },
			enabled: !!params.noteId,
		}),
	);
	const book = useQuery(orpc.reading.getBook.queryOptions({ input: { bookId: params.bookId } }));
	const pending = book.isPending || (!!params.noteId && note.isPending);
	const error = book.isError || (!!params.noteId && note.isError);
	return (
		<MobileScreen
			title={params.noteId ? "기록 수정" : "생각 남기기"}
			onBack={() =>
				params.noteId
					? flow.replace("NotePage", { noteId: params.noteId })
					: isRoot
						? flow.replace("ReadingPage", {
								bookId: params.bookId,
								page: params.page,
								groupId: params.groupId,
							})
						: flow.pop()
			}
		>
			<LoadState
				pending={pending}
				error={error}
				retry={() => {
					book.refetch();
					if (params.noteId) note.refetch();
				}}
			/>
			{!pending && !error && book.data && (!params.noteId || note.data?.isMine) && (
				<NoteForm
					key={params.noteId ?? `${params.bookId}:${params.page}`}
					bookId={params.bookId}
					page={params.page}
					pageCount={book.data.book.pageCount}
					title={book.data.book.title}
					edition={book.data.book.edition}
					note={note.data}
				/>
			)}
			{note.data && !note.data.isMine && <Text>내 기록만 수정할 수 있어요.</Text>}
		</MobileScreen>
	);
};

function NoteForm({
	bookId,
	page,
	title,
	edition,
	pageCount,
	note,
}: {
	bookId: string;
	page: string;
	title: string;
	edition: string;
	pageCount: number;
	note?: Bookmark;
}) {
	const { replace } = useFlow();
	const notify = useNotice();
	const [draft, setDraft, clearDraft] = useSessionStorage(
		`note-draft:${note?.id ?? `${bookId}:${page}`}`,
		{ content: note?.content ?? "", quote: note?.quote ?? "" },
	);
	const form = useForm<z.infer<typeof noteInputSchema>>({
		resolver: zodResolver(noteInputSchema),
		defaultValues: draft,
	});
	const success = (saved: Bookmark) => {
		clearDraft();
		notify(note ? "기록을 수정했어요" : "내 기록에 저장했어요", "positive");
		replace("NotePage", { noteId: saved.id });
	};
	const create = useMutation(
		orpc.notes.create.mutationOptions({
			onSuccess: success,
			onError: () => notify("저장하지 못했어요. 작성한 내용은 그대로 있어요.", "critical"),
		}),
	);
	const update = useMutation(
		orpc.notes.update.mutationOptions({
			onSuccess: success,
			onError: () => notify("수정하지 못했어요. 다시 저장해주세요.", "critical"),
		}),
	);
	const busy = create.isPending || update.isPending;
	const failed = create.isError || update.isError;
	const pageNumber = note?.page ?? Number(page);
	if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pageCount)
		return <Text color="fg.critical">책으로 돌아가 페이지를 확인해주세요.</Text>;
	return (
		<form
			className="flex flex-col gap-x6"
			onSubmit={form.handleSubmit((values) =>
				note
					? update.mutate({ noteId: note.id, ...values })
					: create.mutate({ bookId, page: pageNumber, ...values }),
			)}
		>
			<div>
				<Text as="h1" textStyle="t7Bold">
					{title} · {pageNumber}쪽
				</Text>
				<Text as="p" color="fg.neutralMuted" textStyle="t3Regular">
					{edition}
				</Text>
			</div>
			<Text as="p" textStyle="t4Medium">
				{note?.visibility === "group"
					? "이 기록은 모임에 공유 중이에요. 수정한 내용도 함께 보여요."
					: note?.visibility === "legacy"
						? "기존 공개 기록이에요. 공개 범위는 기록 상세에서 바꿀 수 있어요."
						: "먼저 나만 볼 수 있게 저장해요. 공유는 나중에 선택할 수 있어요."}
			</Text>
			<Controller
				control={form.control}
				name="quote"
				render={({ field }) => (
					<TextField
						label="기억할 구절 (선택)"
						value={field.value}
						onValueChange={({ value }) => {
							field.onChange(value);
							setDraft((previous) => ({ ...previous, quote: value }));
						}}
						invalid={!!form.formState.errors.quote}
						errorMessage={form.formState.errors.quote?.message}
						disabled={busy}
					>
						<TextFieldInput
							name={field.name}
							ref={field.ref}
							onBlur={field.onBlur}
							maxLength={200}
						/>
					</TextField>
				)}
			/>
			<Controller
				control={form.control}
				name="content"
				render={({ field }) => (
					<TextField
						label="내 생각"
						value={field.value}
						onValueChange={({ value }) => {
							field.onChange(value);
							setDraft((previous) => ({ ...previous, content: value }));
						}}
						invalid={!!form.formState.errors.content}
						errorMessage={form.formState.errors.content?.message}
						disabled={busy}
						description="한 줄이어도 괜찮아요. 이 탭에서는 작성 중인 내용을 보관해요."
					>
						<TextFieldTextarea
							name={field.name}
							ref={field.ref}
							onBlur={field.onBlur}
							maxLength={500}
							placeholder="이 장면에서 어떤 생각이 들었나요?"
						/>
					</TextField>
				)}
			/>
			{failed && (
				<Text as="p" role="alert" color="fg.critical">
					저장하지 못했어요. 연결을 확인하고 아래 버튼으로 다시 저장해주세요.
				</Text>
			)}
			<ActionButton variant="neutralSolid" loading={busy} type="submit">
				{note?.visibility === "group" ? "공유 기록 수정" : note ? "기록 수정" : "내 기록에 저장"}
			</ActionButton>
		</form>
	);
}
