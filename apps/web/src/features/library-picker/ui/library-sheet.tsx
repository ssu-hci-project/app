import { useFlow } from "@stackflow/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { libraryName, shareInvite, useCurrentLibrary } from "@/entities/library";
import { orpc } from "@/shared/api";
import { cn } from "@/shared/lib";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	BottomSheet,
	BottomSheetBody,
	BottomSheetContent,
	Button,
	CheckIcon,
	ChoiceCard,
	CopyIcon,
	Input,
	LogOutIcon,
	Separator,
	Share2Icon,
	useNotice,
	useStepOverlay,
} from "@/shared/ui";

/** 서재·모임 전환 · 모임 초대 · 참여 · 모임 만들기. Bound to the `library` overlay. */
export function LibrarySheet() {
	const overlay = useStepOverlay();
	const flow = useFlow();
	const notify = useNotice();
	const { libraries, library, select } = useCurrentLibrary();
	const [code, setCode] = useState("");
	const [leaving, setLeaving] = useState(false);
	const leave = useMutation(
		orpc.libraries.leave.mutationOptions({
			onSuccess: () => {
				const personal = libraries.find((entry) => entry.personal && entry.isOwner);
				if (personal) select(personal.id);
				setLeaving(false);
				overlay.close();
				notify("나왔어요");
			},
			onError: () => notify("나오지 못했어요. 다시 시도해주세요.", "critical"),
		}),
	);
	// 모임도, 내 개인 서재도 초대할 수 있다. 남의 개인 서재에서는 다시 초대하지 않는다.
	const group = library && (!library.personal || library.isOwner) ? library : undefined;
	const share = async () => {
		if (!group) return;
		const result = await shareInvite(group, group.books);
		if (result === "copied") notify("초대 메시지와 링크를 복사했어요");
		if (result === "failed") notify("공유하지 못했어요. 초대 코드를 직접 알려주세요.", "critical");
	};
	const open = (next: () => void) => {
		overlay.close();
		next();
	};
	return (
		<BottomSheet {...overlay.bind("library")}>
			<BottomSheetContent
				title="내 서재와 모임"
				description="흔적은 같은 모임 사람들에게만 보여요."
			>
				<BottomSheetBody className="flex flex-col gap-7">
					<fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
						<legend className="sr-only">내 서재와 모임 목록</legend>
						{libraries.map((entry) => {
							const current = entry.id === library?.id;
							return (
								<ChoiceCard
									key={entry.id}
									selected={current}
									onSelect={() => {
										select(entry.id);
										overlay.close();
									}}
									className={cn(
										"flex min-h-15 items-center gap-3 rounded-xl border px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
										current && "border-primary bg-secondary",
									)}
								>
									<span className="flex min-w-0 flex-1 flex-col">
										<span className="truncate text-st8 font-semibold">{libraryName(entry)}</span>
										<span className="truncate text-t7 text-muted-foreground">
											{entry.personal
												? entry.members.length > 1
													? `${entry.members.length}명이 함께 읽어요`
													: "나만 보는 흔적"
												: `모임 · 책 ${entry.books.length}권 · ${entry.members.length}명`}
										</span>
									</span>
									{current && <CheckIcon className="size-5 text-brand" aria-hidden="true" />}
								</ChoiceCard>
							);
						})}
					</fieldset>

					{group && (
						<section className="flex flex-col gap-3">
							<h3 className="text-t5 font-bold text-strong">
								{group.personal ? "내 서재에 초대하기" : "이 모임에 초대하기"}
							</h3>
							<div className="flex flex-col items-center gap-1 rounded-xl bg-muted px-4 py-5">
								<span className="text-t7 text-sub">초대 코드</span>
								<span className="font-mono text-st2 font-bold tracking-[0.2em] text-strong">
									{group.inviteCode}
								</span>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<Button
									variant="weak"
									size="lg"
									onClick={async () => {
										try {
											await navigator.clipboard.writeText(group.inviteCode);
											notify("초대 코드를 복사했어요");
										} catch {
											notify("복사하지 못했어요. 코드를 직접 알려주세요.", "critical");
										}
									}}
								>
									<CopyIcon data-icon="inline-start" />
									코드 복사
								</Button>
								<Button variant="weak" size="lg" onClick={share}>
									<Share2Icon data-icon="inline-start" />
									같이 읽자고 보내기
								</Button>
							</div>
						</section>
					)}

					<Separator />

					<form
						className="flex flex-col gap-3"
						autoComplete="off"
						onSubmit={(event) => {
							event.preventDefault();
							const value = code.trim().split("/").filter(Boolean).pop();
							if (!value) return;
							setCode("");
							overlay.close();
							flow.push("InvitePage", { code: value });
						}}
					>
						<label htmlFor="invite-code" className="text-st8 font-bold">
							초대 코드로 참여
						</label>
						<div className="flex gap-2">
							<Input
								id="invite-code"
								value={code}
								onChange={(event) => setCode(event.target.value)}
								placeholder="예: K7MW3PQX 또는 초대 링크"
								autoCapitalize="characters"
								autoCorrect="off"
								spellCheck={false}
								className="h-12 flex-1 text-st8"
							/>
							<Button type="submit" size="lg" variant="secondary" disabled={!code.trim()}>
								참여
							</Button>
						</div>
					</form>

					<Button
						variant="secondary"
						size="lg"
						onClick={() => open(() => flow.push("GroupNewPage", {}))}
					>
						새 모임 만들기
					</Button>

					{library && !(library.personal && library.isOwner) && (
						<Button
							variant="ghost"
							size="lg"
							className="self-start text-destructive"
							onClick={() => setLeaving(true)}
						>
							<LogOutIcon data-icon="inline-start" />
							{library.personal ? "이 서재에서 나가기" : "이 모임에서 나가기"}
						</Button>
					)}
				</BottomSheetBody>
			</BottomSheetContent>
			<AlertDialog open={leaving} onOpenChange={setLeaving}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>『{library?.name}』에서 나갈까요?</AlertDialogTitle>
						<AlertDialogDescription>
							여기 남은 흔적과 책을 더 볼 수 없어요. 초대 코드로 다시 참여할 수 있어요.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>취소</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={leave.isPending}
							onClick={() => library && leave.mutate({ libraryId: library.id })}
						>
							나가기
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</BottomSheet>
	);
}
