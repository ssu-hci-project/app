import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTimeout } from "usehooks-ts";
import { cn } from "@/shared/lib";
import {
	AppBar,
	AppBarIconButton,
	AppBarLeft,
	AppBarMain,
	AppBarRight,
	AppScreen,
	AppScreenContent,
} from "./app-screen";
import { BottomCta } from "./bottom-cta";
import { ResultSection } from "./result-section";
import { Skeleton } from "./skeleton";
import { ChevronLeftIcon } from "./tds-icon";

export function MobileScreen({
	title,
	onBack,
	action,
	fab,
	contextual,
	footer,
	cta,
	children,
}: {
	title: string;
	onBack: () => void;
	action?: ReactNode;
	/** 화면의 추가 액션. 우하단에 떠 있는 FloatingActionButton을 넘깁니다. */
	fab?: ReactNode;
	/** 특정 상황에서만 나타나는 보조 액션. 하단 중앙에 띄웁니다. */
	contextual?: ReactNode;
	/** 화면 하단에 고정되는 CTA나 도구 막대. 키보드가 올라와도 보이도록 본문 밖에 둡니다. */
	footer?: ReactNode;
	/** 하단 CTA 버튼. 위쪽 그라데이션이 있는 TDS Bottom CTA로 띄웁니다. */
	cta?: ReactNode;
	children: ReactNode;
}) {
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
	// 떠 있는 버튼은 하단 고정 요소(또는 화면 끝)에서 20px 위에 둡니다.
	const floatBottom = `calc(${footerHeight + 20}px + ${footer ? "0px" : "env(safe-area-inset-bottom)"})`;
	return (
		<AppScreen>
			<AppBar>
				<AppBarLeft>
					<AppBarIconButton aria-label="이전 화면으로" onClick={onBack}>
						<ChevronLeftIcon />
					</AppBarIconButton>
				</AppBarLeft>
				<AppBarMain title={title} />
				<AppBarRight>{action}</AppBarRight>
			</AppBar>
			<AppScreenContent>
				<div
					className={cn(
						"flex flex-col gap-6 px-4 py-5",
						fab && (footer || cta)
							? "pb-[calc(168px+env(safe-area-inset-bottom))]"
							: fab || footer || cta
								? "pb-[calc(104px+env(safe-area-inset-bottom))]"
								: "pb-[max(24px,env(safe-area-inset-bottom))]",
					)}
				>
					{children}
				</div>
			</AppScreenContent>
			{fab && (
				<div className="absolute right-5 z-10" style={{ bottom: floatBottom }}>
					{fab}
				</div>
			)}
			{contextual && (
				<div
					className="absolute inset-x-0 z-10 flex justify-center"
					style={{ bottom: floatBottom }}
				>
					{contextual}
				</div>
			)}
			{cta && <BottomCta>{cta}</BottomCta>}
			{footer && (
				<div
					ref={footerRef}
					className="absolute inset-x-0 bottom-0 z-10 flex flex-col bg-card px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]"
				>
					{footer}
				</div>
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
	if (pending) return <LoadingSkeleton shape={shape} />;
	if (error)
		return (
			<ResultSection
				title="불러오지 못했어요"
				description="연결을 확인하고 다시 시도해주세요."
				action={{ label: "다시 불러오기", onClick: retry }}
			/>
		);
	return null;
}

export function LoadingSkeleton({ shape = "list" }: { shape?: LoadShape }) {
	const [visible, setVisible] = useState(false);
	useTimeout(() => setVisible(true), 250);
	return (
		<div role="status" className="flex min-h-16 flex-col gap-3 py-2">
			{visible &&
				shape === "list" &&
				[0, 1, 2].map((row) => (
					<div key={row} className="flex flex-col gap-1.5 px-4 py-2">
						<Skeleton className="h-5 w-3/5" />
						<Skeleton className="h-4 w-2/5" />
					</div>
				))}
			{visible && shape === "reading" && (
				<>
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-10 w-1/2" />
					<Skeleton className="h-14 w-full" />
				</>
			)}
			{visible && shape === "article" && (
				<>
					<Skeleton className="h-7 w-3/4" />
					<Skeleton className="h-4 w-1/3" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-2/3" />
				</>
			)}
			<span className="sr-only">불러오고 있어요</span>
		</div>
	);
}
