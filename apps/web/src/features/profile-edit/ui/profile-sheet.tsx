import { type Profile, profileInputSchema, readerColors } from "@app/contract";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { defaultColor, useProfile } from "@/entities/profile";
import { orpc } from "@/shared/api";
import { cn } from "@/shared/lib";
import {
	BottomSheet,
	BottomSheetBody,
	BottomSheetContent,
	BottomSheetFooter,
	Button,
	CheckIcon,
	Spinner,
	TextField,
	useNotice,
	useStepOverlay,
} from "@/shared/ui";
import { pendingAction } from "../model/profile-gate";

/**
 * 이름과 색. Opened from the home avatar, or by `useProfileGate` before the first trace — then the
 * pending action continues after saving.
 */
export function ProfileSheet({ takenColors = [] }: { takenColors?: string[] }) {
	const overlay = useStepOverlay();
	const profile = useProfile();
	const sheet = overlay.bind("profile");
	const first = !profile.data?.nick;
	return (
		<BottomSheet
			open={sheet.open}
			onOpenChange={(open) => {
				if (open) return;
				pendingAction.setState({ run: undefined });
				sheet.onOpenChange(open);
			}}
		>
			<BottomSheetContent
				title={first ? "흔적에 보일 이름과 색" : "내 이름과 색"}
				description="밑줄과 흔적에 이 이름과 색이 보여요."
			>
				{profile.data && <ProfileForm profile={profile.data} takenColors={takenColors} />}
			</BottomSheetContent>
		</BottomSheet>
	);
}

const firstFree = (taken: string[]) =>
	readerColors.find((color) => !taken.includes(color)) ?? defaultColor;

function ProfileForm({ profile, takenColors }: { profile: Profile; takenColors: string[] }) {
	const overlay = useStepOverlay();
	const notify = useNotice();
	const [nick, setNick] = useState(profile.nick ?? "");
	const [color, setColor] = useState<string>(profile.color ?? firstFree(takenColors));
	const [error, setError] = useState<string>();
	const continues = !profile.nick && !!pendingAction.getState().run;
	const save = useMutation(
		orpc.profile.save.mutationOptions({
			onSuccess: () => {
				const { run } = pendingAction.getState();
				pendingAction.setState({ run: undefined });
				if (run) run({ open: overlay.switchTo, close: overlay.close });
				else {
					overlay.close();
					notify("이름과 색을 저장했어요");
				}
			},
			onError: () => setError("저장하지 못했어요. 다시 시도해주세요."),
		}),
	);
	return (
		<form
			className="contents"
			onSubmit={(event) => {
				event.preventDefault();
				const parsed = profileInputSchema.safeParse({ nick, color });
				if (!parsed.success) {
					setError(parsed.error.issues[0]?.message);
					return;
				}
				setError(undefined);
				save.mutate(parsed.data);
			}}
		>
			<BottomSheetBody withFooter className="flex flex-col gap-6">
				<TextField
					label="이름"
					value={nick}
					onChange={(event) => setNick(event.target.value)}
					maxLength={12}
					placeholder="예) 지운"
					autoComplete="nickname"
					error={error}
				/>
				<fieldset className="flex flex-col">
					<legend className="mb-3 text-st9 font-medium">나의 색</legend>
					<div className="grid grid-cols-4 justify-items-center gap-y-3">
						{readerColors.map((option) => {
							const taken = takenColors.includes(option) && option !== color;
							return (
								<Button
									variant="ghost"
									size="icon"
									key={option}
									type="button"
									aria-pressed={option === color}
									aria-label={`색 ${readerColors.indexOf(option) + 1}${taken ? ", 다른 사람이 쓰는 중" : ""}`}
									onClick={() => setColor(option)}
									className={cn(
										"grid size-11 place-items-center rounded-full text-white ring-offset-2 ring-offset-popover outline-none focus-visible:ring-3 focus-visible:ring-ring",
										option === color && "ring-2 ring-foreground",
										taken && "opacity-35",
									)}
									style={{ backgroundColor: option }}
								>
									{option === color && <CheckIcon className="size-5" strokeWidth={3} />}
								</Button>
							);
						})}
					</div>
					{takenColors.length > 0 && (
						<p className="mt-3 text-t7 text-muted-foreground">
							흐린 색은 이 서재의 다른 사람이 쓰고 있어요.
						</p>
					)}
				</fieldset>
			</BottomSheetBody>
			<BottomSheetFooter>
				<Button type="submit" size="lg" disabled={save.isPending}>
					{save.isPending && <Spinner data-icon="inline-start" />}
					{continues ? "저장하고 이어서 남기기" : "저장"}
				</Button>
			</BottomSheetFooter>
		</form>
	);
}
