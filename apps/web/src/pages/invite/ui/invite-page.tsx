import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow } from "@stackflow/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCurrentLibrary } from "@/entities/library";
import { orpc } from "@/shared/api";
import {
	Alert,
	AlertDescription,
	Button,
	LoadState,
	MobileScreen,
	ResultSection,
	Spinner,
	useNotice,
} from "@/shared/ui";

/** 초대 링크로 들어온 화면: 서재를 미리 보고 참여합니다. */
export const InvitePage: ActivityComponentType<"InvitePage"> = ({ params }) => {
	const flow = useFlow();
	const { isRoot } = useActivity();
	const notify = useNotice();
	const { select } = useCurrentLibrary();
	const preview = useQuery({
		...orpc.libraries.preview.queryOptions({ input: { code: params.code } }),
		retry: false,
	});
	const goHome = () => (isRoot ? flow.replace("HomePage", {}) : flow.pop());
	const enter = (libraryId: string) => {
		select(libraryId);
		goHome();
	};
	const join = useMutation(
		orpc.libraries.join.mutationOptions({
			onSuccess: (library) => {
				notify(`『${library.name}』에 참여했어요`, "positive");
				enter(library.id);
			},
		}),
	);
	const notFound = preview.error && "code" in preview.error && preview.error.code === "NOT_FOUND";
	return (
		<MobileScreen title="서재 초대" onBack={goHome}>
			{notFound ? (
				<ResultSection
					title="초대를 찾을 수 없어요"
					description="코드를 다시 확인하거나 초대한 사람에게 새 링크를 받아주세요."
					action={{ label: "홈으로", onClick: goHome }}
				/>
			) : (
				<LoadState
					pending={preview.isPending}
					error={preview.isError}
					retry={() => preview.refetch()}
				/>
			)}
			{preview.data && (
				<>
					<div className="flex flex-col gap-2">
						<p className="text-t7 font-semibold text-brand">함께 읽는 서재</p>
						<h1 className="text-t3 leading-[1.35] font-bold text-strong break-keep">
							{preview.data.name}
						</h1>
						<p className="text-t6 text-muted-foreground">
							{preview.data.memberCount}명이 함께 읽어요 · 올린 책 {preview.data.bookCount}권
						</p>
					</div>
					<p className="text-t6 leading-[22px]">
						참여하면 이 서재 사람들이 남긴 밑줄과 메모를 볼 수 있고, 내가 남긴 흔적도 이 서재
						사람들에게 보여요.
					</p>
					{join.isError && (
						<Alert variant="destructive">
							<AlertDescription>아직 참여하지 않았어요. 다시 시도해주세요.</AlertDescription>
						</Alert>
					)}
					<Button
						size="lg"
						disabled={join.isPending}
						onClick={() =>
							preview.data.joined ? enter(preview.data.id) : join.mutate({ code: params.code })
						}
					>
						{join.isPending && <Spinner data-icon="inline-start" />}
						{preview.data.joined ? "이 서재로 가기" : "이 서재에 참여하기"}
					</Button>
				</>
			)}
		</MobileScreen>
	);
};
