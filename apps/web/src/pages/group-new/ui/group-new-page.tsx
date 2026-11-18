import { libraryNameSchema, textLimits } from "@app/contract";
import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow, useStepFlow } from "@stackflow/react";
import { useMutation, useQueries } from "@tanstack/react-query";
import { useState } from "react";
import { BookCover } from "@/entities/book";
import { useCurrentLibrary } from "@/entities/library";
import { BookPickList } from "@/features/book-picker";
import { orpc } from "@/shared/api";
import { Alert, AlertDescription, Button, MobileScreen, Spinner, TextField } from "@/shared/ui";

const MAX_BOOKS = 20;

const suggestedName = (title: string | undefined) => {
	if (!title) return "";
	const name = `${title} 같이 읽기`;
	return name.length <= textLimits.libraryName ? name : title.slice(0, textLimits.libraryName);
};

/**
 * 모임 만들기: 같이 읽을 책 고르기 → 이름(첫 책으로 미리 채움) → 만들고 초대(GroupReadyPage).
 * `books` carries the chosen ids, so a book page can open this straight at the name step.
 */
export const GroupNewPage: ActivityComponentType<"GroupNewPage"> = ({ params }) => {
	const flow = useFlow();
	const { pushStep } = useStepFlow("GroupNewPage");
	const { isRoot } = useActivity();
	const { libraries, select } = useCurrentLibrary();
	const personal = libraries.find((entry) => entry.personal && entry.isOwner);
	const step = params.step === "name" ? "name" : "books";
	const [picked, setPicked] = useState<string[]>(() =>
		(params.books ?? "").split(",").filter(Boolean).slice(0, MAX_BOOKS),
	);
	const chosen = useQueries({
		queries: picked.map((bookId) => ({
			...orpc.books.get.queryOptions({ input: { libraryId: personal?.id ?? "", bookId } }),
			enabled: step === "name" && !!personal,
		})),
	});
	const firstTitle = chosen[0]?.data?.book.title;
	const [name, setName] = useState<string>();
	const value = name ?? suggestedName(firstTitle);
	const [error, setError] = useState<string>();
	const create = useMutation(
		orpc.libraries.create.mutationOptions({
			onSuccess: (created) => {
				select(created.id);
				flow.replace("GroupReadyPage", { libraryId: created.id });
			},
		}),
	);
	const toggle = (bookId: string) =>
		setPicked((current) =>
			current.includes(bookId)
				? current.filter((id) => id !== bookId)
				: [...current, bookId].slice(0, MAX_BOOKS),
		);
	const submit = () => {
		const parsed = libraryNameSchema.safeParse({ name: value });
		if (!parsed.success) return setError(parsed.error.issues[0]?.message);
		setError(undefined);
		create.mutate({ ...parsed.data, bookIds: picked });
	};
	const back = () => (isRoot ? flow.replace("HomePage", {}) : flow.pop());

	if (step === "books")
		return (
			<MobileScreen
				title="새 모임"
				onBack={back}
				footer={
					<Button
						size="lg"
						disabled={!picked.length}
						onClick={() => pushStep({ step: "name", books: picked.join(",") })}
					>
						{picked.length ? `${picked.length}권으로 모임 만들기` : "같이 읽을 책을 골라주세요"}
					</Button>
				}
			>
				<div className="flex flex-col gap-2 px-2">
					<p className="text-t7 font-semibold text-brand">1/2 같이 읽을 책</p>
					<h1 className="text-t3 leading-[1.35] font-bold text-strong break-keep">
						친구와 같이 읽을 책을 골라주세요
					</h1>
					<p className="text-t6 text-muted-foreground break-keep">
						여러 권을 골라도 돼요. 고른 책은 모임 서재에 담기고, 나중에 모임 사람 누구나 더 고를 수
						있어요.
					</p>
				</div>
				<div className="-mx-4">
					{personal && (
						<BookPickList
							libraryId={personal.id}
							scope="shared"
							picked={picked}
							onToggle={toggle}
						/>
					)}
				</div>
			</MobileScreen>
		);

	return (
		<MobileScreen
			title="새 모임"
			onBack={back}
			footer={
				<Button size="lg" disabled={!value.trim() || create.isPending} onClick={submit}>
					{create.isPending && <Spinner data-icon="inline-start" />}
					모임 만들기
				</Button>
			}
		>
			<div className="flex flex-col gap-2 px-2">
				<p className="text-t7 font-semibold text-brand">2/2 모임 이름</p>
				<h1 className="text-t3 leading-[1.35] font-bold text-strong break-keep">
					거의 다 됐어요. 모임 이름을 확인해주세요
				</h1>
			</div>
			<div className="flex gap-3 overflow-x-auto px-2 pb-1 [scrollbar-width:none]">
				{chosen.map((query, index) => (
					<div key={picked[index]} className="flex w-[76px] shrink-0 flex-col gap-1.5">
						{query.data ? (
							<>
								<BookCover book={query.data.book} size="sm" />
								<span className="line-clamp-2 text-st10 leading-4 font-semibold">
									{query.data.book.title}
								</span>
							</>
						) : (
							<span className="h-20 w-14 rounded-md bg-muted" />
						)}
					</div>
				))}
			</div>
			{create.isError && (
				<Alert variant="destructive">
					<AlertDescription>모임을 만들지 못했어요. 다시 시도해주세요.</AlertDescription>
				</Alert>
			)}
			<form
				autoComplete="off"
				className="px-2"
				onSubmit={(event) => {
					event.preventDefault();
					submit();
				}}
			>
				<TextField
					label="모임 이름"
					value={value}
					onChange={(event) => setName(event.target.value)}
					maxLength={textLimits.libraryName}
					placeholder="예: 목요 독서회"
					error={error}
					description={`${value.length}/${textLimits.libraryName} · 나중에 초대 메시지에 보여요`}
					className="h-12 text-st8"
				/>
			</form>
		</MobileScreen>
	);
};
