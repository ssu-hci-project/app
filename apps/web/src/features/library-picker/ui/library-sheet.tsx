import { libraryNameSchema, textLimits } from "@app/contract";
import { useFlow } from "@stackflow/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useCurrentLibrary } from "@/entities/library";
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

/** 서재 전환 · 초대 · 참여 · 만들기. Bound to the `library` overlay. */
export function LibrarySheet() {
	const overlay = useStepOverlay();
	const flow = useFlow();
	const notify = useNotice();
	const { libraries, library, select } = useCurrentLibrary();
	const [code, setCode] = useState("");
	const [name, setName] = useState("");
	const [nameError, setNameError] = useState<string>();
	const [leaving, setLeaving] = useState(false);
	const create = useMutation(
		orpc.libraries.create.mutationOptions({
			onSuccess: (created) => {
				select(created.id);
				setName("");
				overlay.close();
				notify(`『${created.name}』을 만들었어요. 초대 코드를 보내보세요.`);
			},
			onError: () => setNameError("만들지 못했어요. 다시 시도해주세요."),
		}),
	);
	const leave = useMutation(
		orpc.libraries.leave.mutationOptions({
			onSuccess: () => {
				const personal = libraries.find((entry) => entry.personal && entry.isOwner);
				if (personal) select(personal.id);
				setLeaving(false);
				overlay.close();
				notify("서재에서 나왔어요");
			},
			onError: () => notify("나오지 못했어요. 다시 시도해주세요.", "critical"),
		}),
	);
	const link = library ? `${window.location.origin}/invite/${library.inviteCode}` : "";
	const share = async () => {
		if (!library) return;
		const text = `교환독서 『${library.name}』에 초대해요. 초대 코드 ${library.inviteCode}`;
		try {
			if (navigator.share) await navigator.share({ title: "교환독서 초대", text, url: link });
			else {
				await navigator.clipboard.writeText(link);
				notify("초대 링크를 복사했어요");
			}
		} catch {
			// The reader closed the share sheet.
		}
	};
	return (
		<BottomSheet {...overlay.bind("library")}>
			<BottomSheetContent
				title="서재"
				description="흔적과 올린 책은 같은 서재 사람들에게만 보여요."
			>
				<BottomSheetBody className="flex flex-col gap-7">
					<fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
						<legend className="sr-only">내 서재 목록</legend>
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
										<span className="truncate text-st8 font-semibold">{entry.name}</span>
										<span className="text-t7 text-muted-foreground">
											{entry.members.length}명이 함께 읽어요
										</span>
									</span>
									{current && <CheckIcon className="size-5 text-brand" aria-hidden="true" />}
								</ChoiceCard>
							);
						})}
					</fieldset>

					{library && (
						<section className="flex flex-col gap-3">
							<h3 className="text-t5 font-bold text-strong">이 서재에 초대하기</h3>
							<div className="flex flex-col items-center gap-1 rounded-xl bg-muted px-4 py-5">
								<span className="text-t7 text-sub">초대 코드</span>
								<span className="font-mono text-st2 font-bold tracking-[0.2em] text-strong">
									{library.inviteCode}
								</span>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<Button
									variant="weak"
									size="lg"
									onClick={async () => {
										try {
											await navigator.clipboard.writeText(library.inviteCode);
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
									링크 보내기
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

					<form
						className="flex flex-col gap-3"
						autoComplete="off"
						onSubmit={(event) => {
							event.preventDefault();
							const parsed = libraryNameSchema.safeParse({ name });
							if (!parsed.success) return setNameError(parsed.error.issues[0]?.message);
							setNameError(undefined);
							create.mutate(parsed.data);
						}}
					>
						<label htmlFor="library-name" className="text-st8 font-bold">
							새 서재 만들기
						</label>
						<div className="flex gap-2">
							<Input
								id="library-name"
								value={name}
								onChange={(event) => setName(event.target.value)}
								maxLength={textLimits.libraryName}
								placeholder="예: 목요 독서회"
								aria-invalid={!!nameError || undefined}
								className="h-12 flex-1 text-st8"
							/>
							<Button
								type="submit"
								size="lg"
								variant="secondary"
								disabled={!name.trim() || create.isPending}
							>
								만들기
							</Button>
						</div>
						{nameError && (
							<p role="alert" className="text-st9 text-destructive">
								{nameError}
							</p>
						)}
					</form>

					{library && !(library.personal && library.isOwner) && (
						<Button
							variant="ghost"
							size="lg"
							className="self-start text-destructive"
							onClick={() => setLeaving(true)}
						>
							<LogOutIcon data-icon="inline-start" />이 서재에서 나가기
						</Button>
					)}
				</BottomSheetBody>
			</BottomSheetContent>
			<AlertDialog open={leaving} onOpenChange={setLeaving}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>『{library?.name}』에서 나갈까요?</AlertDialogTitle>
						<AlertDialogDescription>
							이 서재의 흔적과 책을 더 볼 수 없어요. 초대 코드로 다시 참여할 수 있어요.
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
