import type { Bookmark } from "@app/contract";
import { noteInputSchema } from "@app/contract";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionButton, Text } from "@seed-design/react";
import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow } from "@stackflow/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useSessionStorage } from "usehooks-ts";
import type { z } from "zod";
import { editionLabel } from "@/entities/book";
import { orpc } from "@/shared/api";
import {
	LoadState,
	MobileScreen,
	TextField,
	TextFieldInput,
	TextFieldTextarea,
	useNotice,
} from "@/shared/ui";
import { QuestionPicker } from "./question-picker";

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
	const [busy, setBusy] = useState(false);
	const editable = !pending && !error && !!book.data && (!params.noteId || !!note.data?.isMine);
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
			footer={
				editable && (
					<ActionButton
						type="submit"
						form="note-form"
						variant="neutralSolid"
						size="large"
						loading={busy}
					>
						{note.data?.visibility === "group"
							? "공유 기록 수정"
							: params.noteId
								? "기록 수정"
								: "내 기록에 저장"}
					</ActionButton>
				)
			}
		>
			<LoadState
				shape="article"
				pending={pending}
				error={error}
				retry={() => {
					book.refetch();
					if (params.noteId) note.refetch();
				}}
			/>
			{editable && book.data && (
				<NoteForm
					key={params.noteId ?? `${params.bookId}:${params.page}:${params.quote ?? ""}`}
					bookId={params.bookId}
					page={params.page}
					pageCount={book.data.book.pageCount}
					title={book.data.book.title}
					edition={editionLabel(book.data.book)}
					note={note.data}
					initialQuote={params.quote}
					onBusyChange={setBusy}
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
	initialQuote,
	onBusyChange,
}: {
	bookId: string;
	page: string;
	title: string;
	edition: string | null;
	pageCount: number;
	note?: Bookmark;
	/** 리더에서 고른 문장. 있으면 쓰던 구절보다 우선해요. */
	initialQuote?: string;
	onBusyChange: (busy: boolean) => void;
}) {
	const { replace } = useFlow();
	const notify = useNotice();
	const [draft, setDraft, clearDraft] = useSessionStorage(
		`note-draft:${note?.id ?? `${bookId}:${page}`}`,
		{ content: note?.content ?? "", quote: note?.quote ?? "", prompt: note?.prompt ?? null },
	);
	const form = useForm<z.infer<typeof noteInputSchema>>({
		resolver: zodResolver(noteInputSchema),
		defaultValues: { ...draft, quote: initialQuote ?? draft.quote },
	});
	const prompt = form.watch("prompt");
	const quote = form.watch("quote");
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
	const [quoteOpen, setQuoteOpen] = useState(!!(initialQuote ?? draft.quote));
	useEffect(() => onBusyChange(busy), [busy, onBusyChange]);
	const pageNumber = note?.page ?? Number(page);
	if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pageCount)
		return <Text color="fg.critical">책으로 돌아가 페이지를 확인해주세요.</Text>;
	return (
		<form
			id="note-form"
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
				{edition && (
					<Text as="p" color="fg.neutralMuted" textStyle="t3Regular">
						{edition}
					</Text>
				)}
			</div>
			<Controller
				control={form.control}
				name="prompt"
				render={({ field }) => (
					<QuestionPicker
						bookId={note?.bookId ?? bookId}
						page={pageNumber}
						quote={quote}
						value={field.value ?? null}
						onChange={(next) => {
							field.onChange(next);
							setDraft((previous) => ({ ...previous, prompt: next }));
						}}
					/>
				)}
			/>
			<Controller
				control={form.control}
				name="content"
				render={({ field }) => (
					<TextField
						label={prompt ?? "내 생각"}
						value={field.value}
						onValueChange={({ value }) => {
							field.onChange(value);
							setDraft((previous) => ({ ...previous, content: value }));
						}}
						invalid={!!form.formState.errors.content}
						errorMessage={form.formState.errors.content?.message}
						disabled={busy}
						description="한 줄이어도 괜찮아요. 이 탭을 닫기 전까지 쓰던 내용이 남아 있어요."
					>
						<TextFieldTextarea
							name={field.name}
							ref={field.ref}
							onBlur={field.onBlur}
							maxLength={500}
							placeholder="이 장면에서 어떤 생각이 들었나요?"
							className="min-h-[8.5rem]"
						/>
					</TextField>
				)}
			/>
			{quoteOpen ? (
				<Controller
					control={form.control}
					name="quote"
					render={({ field }) => (
						<TextField
							label="기억할 구절"
							value={field.value}
							onValueChange={({ value }) => {
								field.onChange(value);
								setDraft((previous) => ({ ...previous, quote: value }));
							}}
							invalid={!!form.formState.errors.quote}
							errorMessage={form.formState.errors.quote?.message}
							disabled={busy}
							description="선택 사항이에요. 책의 문장을 옮겨 적어두면 나중에 찾기 쉬워요."
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
			) : (
				<ActionButton
					type="button"
					variant="ghost"
					size="small"
					className="self-start"
					onClick={() => setQuoteOpen(true)}
				>
					기억할 구절 추가
				</ActionButton>
			)}
			{failed && (
				<Text as="p" role="alert" color="fg.critical">
					저장하지 못했어요. 연결을 확인하고 아래 버튼으로 다시 저장해주세요.
				</Text>
			)}
		</form>
	);
}
