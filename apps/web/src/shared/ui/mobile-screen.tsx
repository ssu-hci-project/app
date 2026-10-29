import { IconChevronLeftLine } from "@karrotmarket/react-monochrome-icon";
import { Skeleton } from "@seed-design/react";
import { type ReactNode, useState } from "react";
import { useTimeout } from "usehooks-ts";
import { AppBar, AppBarIconButton, AppBarLeft, AppBarMain, AppBarRight } from "./app-bar";
import { AppScreen, AppScreenContent } from "./app-screen";
import { ResultSection } from "./result-section";

export function MobileScreen({
	title,
	onBack,
	action,
	children,
}: {
	title: string;
	onBack: () => void;
	action?: ReactNode;
	children: ReactNode;
}) {
	return (
		<AppScreen>
			<AppBar>
				<AppBarLeft>
					<AppBarIconButton aria-label="이전 화면으로" onClick={onBack}>
						<IconChevronLeftLine />
					</AppBarIconButton>
				</AppBarLeft>
				<AppBarMain title={title} />
				<AppBarRight>{action}</AppBarRight>
			</AppBar>
			<AppScreenContent>
				<div className="flex flex-col gap-x6 px-x4 py-x5 pb-[calc(24px+env(safe-area-inset-bottom))]">
					{children}
				</div>
			</AppScreenContent>
		</AppScreen>
	);
}
export function LoadState({
	pending,
	error,
	retry,
}: {
	pending: boolean;
	error: boolean;
	retry: () => void;
}) {
	if (pending) return <DelayedSkeleton />;
	if (error)
		return (
			<ResultSection
				title="불러오지 못했어요"
				description="연결을 확인하고 다시 시도해주세요."
				primaryActionProps={{ children: "다시 불러오기", onClick: retry }}
			/>
		);
	return null;
}

function DelayedSkeleton() {
	const [visible, setVisible] = useState(false);
	useTimeout(() => setVisible(true), 1000);
	return (
		<div role="status" className="min-h-x16 space-y-3 py-x5">
			{visible && (
				<>
					<Skeleton width="full" height="x6" />
					<Skeleton width="full" height="x16" />
				</>
			)}
			<span className="sr-only">불러오고 있어요</span>
		</div>
	);
}
