import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow } from "@stackflow/react";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useCurrentLibrary } from "@/entities/library";
import { ImportProgressOverlay, useBookImport } from "@/features/book-import";
import { BookPickList } from "@/features/book-picker";
import { orpc } from "@/shared/api";
import {
	Button,
	LoadState,
	MobileScreen,
	ResultSection,
	Spinner,
	TextButton,
	useNotice,
} from "@/shared/ui";

/** 모임 서재에 같이 읽을 책을 더 담습니다. 모임 사람 누구나 고를 수 있어요. */
export const GroupBookPage: ActivityComponentType<"GroupBookPage"> = ({ params }) => {
	const flow = useFlow();
	const { isRoot } = useActivity();
	const notify = useNotice();
	const { libraries, libraryId: currentId, select, query } = useCurrentLibrary();
	const group = libraries.find((entry) => entry.id === params.libraryId && !entry.personal);
	// Uploads go to the current library, so this group becomes it.
	useEffect(() => {
		if (group && currentId !== group.id) select(group.id);
	}, [group, currentId, select]);
	const [picked, setPicked] = useState<string[]>([]);
	const back = () => (isRoot ? flow.replace("HomePage", {}) : flow.pop());
	const add = useMutation(
		orpc.libraries.addBooks.mutationOptions({
			onSuccess: () => {
				notify(`모임 서재에 ${picked.length}권을 담았어요`, "positive");
				back();
			},
			onError: () => notify("담지 못했어요. 다시 시도해주세요.", "critical"),
		}),
	);
	// An uploaded book lands on the group's shelf by itself.
	const importer = useBookImport(() => back());
	const toggle = (bookId: string) =>
		setPicked((current) =>
			current.includes(bookId) ? current.filter((id) => id !== bookId) : [...current, bookId],
		);
	return (
		<MobileScreen
			title="같이 읽을 책 고르기"
			onBack={back}
			footer={
				group && (
					<Button
						size="lg"
						disabled={!picked.length || add.isPending}
						onClick={() => add.mutate({ libraryId: group.id, bookIds: picked })}
					>
						{add.isPending && <Spinner data-icon="inline-start" />}
						{picked.length ? `모임 서재에 ${picked.length}권 담기` : "책을 골라주세요"}
					</Button>
				)
			}
		>
			<LoadState pending={query.isPending} error={query.isError} retry={() => query.refetch()} />
			{query.isSuccess && !group && (
				<ResultSection title="모임을 찾을 수 없어요" action={{ label: "홈으로", onClick: back }} />
			)}
			{group && (
				<>
					<div className="flex flex-col gap-2 px-2">
						<h1 className="text-t3 leading-[1.35] font-bold text-strong break-keep">
							『{group.name}』에서 같이 읽을 책
						</h1>
						<p className="text-t6 text-muted-foreground break-keep">
							고른 책은 모임 사람들 모두의 모임 서재와 내 서재에 담겨요.
						</p>
					</div>
					<div className="-mx-4">
						<BookPickList
							libraryId={group.id}
							scope="catalog"
							picked={picked}
							onToggle={toggle}
							shelved={group.books.map((book) => book.id)}
						/>
					</div>
					<TextButton
						size="sm"
						className="self-center"
						disabled={importer.pending || currentId !== group.id}
						onClick={importer.chooseFile}
					>
						가진 전자책을 올려서 담기
					</TextButton>
				</>
			)}
			<ImportProgressOverlay />
		</MobileScreen>
	);
};
