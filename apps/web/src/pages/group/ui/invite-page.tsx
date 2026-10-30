import { ActionButton, Text } from "@seed-design/react";
import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow } from "@stackflow/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { bookByline } from "@/entities/book";
import { orpc } from "@/shared/api";
import { LoadState, MobileScreen, useNotice } from "@/shared/ui";

export const InvitePage: ActivityComponentType<"InvitePage"> = ({ params }) => {
	const preview = useQuery(
		orpc.groups.previewInvite.queryOptions({ input: { code: params.code } }),
	);
	const flow = useFlow();
	const { isRoot } = useActivity();
	const notify = useNotice();
	const join = useMutation(
		orpc.groups.join.mutationOptions({
			onSuccess: ({ groupId, bookId }) => {
				notify("모임에 참여했어요", "positive");
				flow.replace("GroupPage", { groupId, bookId });
			},
			onError: () => notify("참여하지 못했어요. 다시 시도해주세요.", "critical"),
		}),
	);
	return (
		<MobileScreen
			title="함께 읽기 초대"
			onBack={() => (isRoot ? flow.replace("HomePage", {}) : flow.pop())}
		>
			<LoadState
				pending={preview.isPending}
				error={preview.isError}
				retry={() => preview.refetch()}
			/>
			{preview.data && (
				<>
					<Text as="h1" textStyle="t8Bold">
						{preview.data.name}
					</Text>
					<div>
						<Text as="p">{preview.data.book.title}</Text>
						<Text as="p" color="fg.neutralMuted" textStyle="t3Regular">
							{bookByline(preview.data.book)}
						</Text>
					</div>
					<Text>
						각자의 속도로 읽고 생각을 나누는 모임이에요. 참여하면 이전에 공유한 기록도 볼 수 있어요.
						내 기록은 직접 공유하기 전까지 나만 볼 수 있어요.
					</Text>
					{join.isError && (
						<Text color="fg.critical" role="alert">
							아직 모임에 참여하지 않았어요. 아래 버튼으로 다시 시도해주세요.
						</Text>
					)}
					<ActionButton
						variant="brandSolid"
						loading={join.isPending}
						onClick={() =>
							preview.data.joined
								? flow.replace("GroupPage", {
										groupId: preview.data.groupId,
										bookId: preview.data.book.id,
									})
								: join.mutate({ code: params.code })
						}
					>
						{preview.data.joined ? "참여 중인 모임 보기" : "이 모임에 참여"}
					</ActionButton>
				</>
			)}
		</MobileScreen>
	);
};
