import { IconChevronLeftLine } from "@karrotmarket/react-monochrome-icon";
import { Float, Skeleton } from "@seed-design/react";
import { useActivityZIndexBase } from "@seed-design/stackflow";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTimeout } from "usehooks-ts";
import { cn } from "@/shared/lib";
import { AppBar, AppBarIconButton, AppBarLeft, AppBarMain, AppBarRight } from "./app-bar";
import { AppScreen, AppScreenContent } from "./app-screen";
import { ResultSection } from "./result-section";
import { SnackbarAvoidOverlap } from "./snackbar";

export function MobileScreen({
	title,
	onBack,
	action,
	fab,
	contextual,
	footer,
	children,
}: {
	title: string;
	onBack: () => void;
	action?: ReactNode;
	/** 화면의 추가 액션. 우하단에 떠 있는 FloatingActionButton을 넘깁니다. */
	fab?: ReactNode;
	/** 특정 상황에서만 나타나는 보조 액션(ContextualFloatingButton). 하단 중앙에 띄웁니다. */
	contextual?: ReactNode;
	/** 화면 하단에 고정되는 CTA나 도구 막대. 키보드가 올라와도 보이도록 본문 밖에 둡니다. */
	footer?: ReactNode;
	children: ReactNode;
}) {
	const zIndexBase = useActivityZIndexBase();
	const footerRef = useRef<HTMLDivElement>(null);
	const [footerHeight, setFooterHeight] = useState(0);
	const hasFooter = !!footer;
	useEffect(() => {
		const element = footerRef.current;
		if (!hasFooter || !element) return setFooterHeight(0);
		const observer = new ResizeObserver(([entry]) =>
			setFooterHeight(entry?.borderBoxSize[0]?.blockSize ?? element.offsetHeight),
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, [hasFooter]);
	// 하단에 고정 요소가 있으면 그 위로 20px 띄웁니다(SEED FAB 가이드).
	// 안쪽 높이 + 막대의 위아래 여백(12px씩) + safe area 위로 20px.
	const floatOffset = footer
		? `calc(${footerHeight + 24 + 20}px + env(safe-area-inset-bottom))`
		: "calc(20px + env(safe-area-inset-bottom))";
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
				<div
					className={cn(
						"flex flex-col gap-x6 px-x4 py-x5",
						fab && footer
							? "pb-[calc(168px+env(safe-area-inset-bottom))]"
							: fab || footer
								? "pb-[calc(104px+env(safe-area-inset-bottom))]"
								: "pb-[calc(24px+env(safe-area-inset-bottom))]",
					)}
				>
					{children}
				</div>
			</AppScreenContent>
			{fab && (
				<SnackbarAvoidOverlap>
					<Float
						placement="bottom-end"
						offsetX="x5"
						offsetY={floatOffset}
						// 화면 레이어(+2) 위, 앱바(+7)와 portal된 바텀시트(다음 단계) 아래
						zIndex={zIndexBase + 3}
					>
						{fab}
					</Float>
				</SnackbarAvoidOverlap>
			)}
			{contextual && (
				<Float placement="bottom-center" offsetY={floatOffset} zIndex={zIndexBase + 3}>
					{contextual}
				</Float>
			)}
			{footer && (
				<SnackbarAvoidOverlap>
					<div
						className="absolute inset-x-0 bottom-0 bg-bg-layer-default px-x4 pt-x3 pb-[calc(12px+env(safe-area-inset-bottom))]"
						style={{ zIndex: zIndexBase + 3 }}
					>
						{/* SnackbarAvoidOverlap이 바깥 요소의 ref를 덮어쓰므로 높이는 안쪽에서 잽니다. */}
						<div ref={footerRef} className="flex flex-col">
							{footer}
						</div>
					</div>
				</SnackbarAvoidOverlap>
			)}
		</AppScreen>
	);
}

/** 불러오는 동안 곧 나타날 화면 구조를 미리 보여줍니다. */
type LoadShape = "list" | "reading" | "article";

export function LoadState({
	pending,
	error,
	retry,
	shape = "list",
}: {
	pending: boolean;
	error: boolean;
	retry: () => void;
	shape?: LoadShape;
}) {
	if (pending) return <DelayedSkeleton shape={shape} />;
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

function DelayedSkeleton({ shape }: { shape: LoadShape }) {
	const [visible, setVisible] = useState(false);
	useTimeout(() => setVisible(true), 1000);
	return (
		<div role="status" className="flex min-h-x16 flex-col gap-x3 py-x2">
			{visible &&
				shape === "list" &&
				[0, 1, 2].map((row) => (
					<div key={row} className="flex flex-col gap-x1_5 py-x2">
						<Skeleton width="60%" height="x5" />
						<Skeleton width="40%" height="x4" />
					</div>
				))}
			{visible && shape === "reading" && (
				<>
					<Skeleton width="full" height="x12" radius="8" />
					<Skeleton width="50%" height="x10" radius="8" />
					<Skeleton width="full" height="x14" radius="8" />
				</>
			)}
			{visible && shape === "article" && (
				<>
					<Skeleton width="75%" height="x7" />
					<Skeleton width="33%" height="x4" />
					<Skeleton width="full" height="x4" />
					<Skeleton width="full" height="x4" />
					<Skeleton width="66%" height="x4" />
				</>
			)}
			<span className="sr-only">불러오고 있어요</span>
		</div>
	);
}
