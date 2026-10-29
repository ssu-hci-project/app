import { groupInputSchema } from "@app/contract";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionButton, List, ListHeader, Text } from "@seed-design/react";
import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow, useStepFlow } from "@stackflow/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { orpc } from "@/shared/api";
import {
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogRoot,
	AlertDialogTitle,
	LoadState,
	MobileScreen,
	TextField,
	TextFieldInput,
	useNotice,
} from "@/shared/ui";

export const GroupPage: ActivityComponentType<"GroupPage"> = ({ params }) => {
	const flow = useFlow();
	const { replaceStep } = useStepFlow("GroupPage");
	const { isRoot } = useActivity();
	const notify = useNotice();
	const [leaving, setLeaving] = useState(false);
	const groups = useQuery(orpc.groups.list.queryOptions());
	const book = useQuery(orpc.reading.getBook.queryOptions({ input: { bookId: params.bookId } }));
	const group = groups.data?.find((item) => item.id === params.groupId);
	const form = useForm<z.infer<typeof groupInputSchema>>({
		resolver: zodResolver(groupInputSchema),
		defaultValues: { bookId: params.bookId, name: "" },
	});
	const create = useMutation(
		orpc.groups.create.mutationOptions({
			onSuccess: (saved) => replaceStep({ bookId: saved.bookId, groupId: saved.id }),
			onError: () => notify("모임을 만들지 못했어요", "critical"),
		}),
	);
	const leave = useMutation(
		orpc.groups.leave.mutationOptions({
			onSuccess: () => {
				notify("모임에서 나왔어요. 내 기록은 나만 보기로 보관해요.");
				flow.replace("HomePage", {});
			},
			onError: () => notify("모임에서 나가지 못했어요", "critical"),
		}),
	);
	const inviteUrl = group
		? new URL(`/invite/${group.inviteCode}`, window.location.origin).href
		: "";
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(inviteUrl);
			notify("초대 링크를 복사했어요", "positive");
		} catch {
			notify("복사하지 못했어요. 아래 초대 코드를 길게 눌러 복사해주세요.", "critical");
		}
	};
	return (
		<MobileScreen
			title={group?.name ?? "함께 읽기 모임"}
			onBack={() => (isRoot ? flow.replace("HomePage", {}) : flow.pop())}
		>
			<LoadState
				pending={book.isPending || groups.isPending}
				error={book.isError || groups.isError}
				retry={() => {
					book.refetch();
					groups.refetch();
				}}
			/>
			{book.data && (
				<Text as="h1" textStyle="t7Bold">
					{book.data.book.title} · {book.data.book.edition}
				</Text>
			)}
			{group ? (
				<>
					<Text>
						{group.memberCount}명이 각자의 속도로 읽고 있어요. 기록 작성이나 완독은 필수가 아니에요.
					</Text>
					{group.unreadPages.length > 0 && (
						<>
							<ListHeader as="h2">새로운 생각이 있는 페이지</ListHeader>
							<List.Root as="div">
								{group.unreadPages.map((page) => (
									<List.Item key={page} asChild>
										<button
											type="button"
											className="w-full text-left"
											onClick={() =>
												flow.push("ReadingPage", {
													bookId: group.bookId,
													groupId: group.id,
													page: String(page),
												})
											}
										>
											<List.Content>
												<List.Title>{page}쪽으로 이동</List.Title>
												<List.Detail>내용은 직접 열어볼 때 보여요.</List.Detail>
											</List.Content>
										</button>
									</List.Item>
								))}
							</List.Root>
						</>
					)}
					<ActionButton
						variant="brandSolid"
						onClick={() => flow.push("ReadingPage", { bookId: group.bookId, groupId: group.id })}
					>
						모임과 이어 읽기
					</ActionButton>
					<div className="flex flex-col gap-x3">
						<Text as="h2" textStyle="t6Bold">
							함께 읽을 사람 초대
						</Text>
						<Text textStyle="t4Regular">
							초대 링크를 받은 사람은 모임 정보를 확인한 뒤 참여할 수 있어요.
						</Text>
						<ActionButton variant="neutralWeak" onClick={copy}>
							초대 링크 복사
						</ActionButton>
						<Text as="p" textStyle="t3Regular" className="select-all break-all">
							초대 코드: {group.inviteCode}
						</Text>
					</div>
					<ActionButton variant="ghost" onClick={() => setLeaving(true)}>
						모임에서 나가기
					</ActionButton>
					<AlertDialogRoot open={leaving} onOpenChange={setLeaving}>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>모임에서 나갈까요?</AlertDialogTitle>
								<AlertDialogDescription>
									공유한 내 기록은 나만 보기로 바뀌어요. 모임의 다른 기록은 더 이상 볼 수 없어요.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogAction variant="neutralWeak">취소</AlertDialogAction>
								<AlertDialogAction
									variant="criticalSolid"
									loading={leave.isPending}
									onClick={(event) => {
										event.preventDefault();
										leave.mutate({ groupId: group.id });
									}}
								>
									모임에서 나가기
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialogRoot>
				</>
			) : !params.groupId && book.data ? (
				<>
					<form
						onSubmit={form.handleSubmit((values) => create.mutate(values))}
						className="flex flex-col gap-x4"
					>
						<Controller
							control={form.control}
							name="name"
							render={({ field }) => (
								<TextField
									label="새 모임 이름"
									value={field.value}
									onValueChange={({ value }) => field.onChange(value)}
									invalid={!!form.formState.errors.name}
									errorMessage={form.formState.errors.name?.message}
								>
									<TextFieldInput
										ref={field.ref}
										onBlur={field.onBlur}
										name={field.name}
										maxLength={60}
										placeholder="천천히 함께 읽기"
									/>
								</TextField>
							)}
						/>
						{create.isError && (
							<Text role="alert" color="fg.critical">
								만들지 못했어요. 이름은 그대로 있으니 다시 시도해주세요.
							</Text>
						)}
						<ActionButton type="submit" variant="brandSolid" loading={create.isPending}>
							함께 읽기 모임 만들기
						</ActionButton>
					</form>
					<ListHeader as="h2">이 책으로 참여 중인 모임</ListHeader>
					<List.Root as="div">
						{groups.data
							?.filter((item) => item.bookId === params.bookId)
							.map((item) => (
								<List.Item key={item.id} asChild>
									<button
										type="button"
										className="w-full text-left"
										onClick={() => replaceStep({ bookId: params.bookId, groupId: item.id })}
									>
										<List.Content>
											<List.Title>{item.name}</List.Title>
										</List.Content>
									</button>
								</List.Item>
							))}
					</List.Root>
				</>
			) : (
				params.groupId &&
				groups.isSuccess && <Text>이 모임에 참여 중이지 않아요. 초대 링크로 참여해주세요.</Text>
			)}
		</MobileScreen>
	);
};
