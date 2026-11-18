import { AnimatePresence, LazyMotion, MotionConfig, m, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";

const features = () => import("./motion-features").then((module) => module.motionFeatures);
export function MotionProvider({ children }: { children: ReactNode }) {
	const reduce = useReducedMotion();
	return (
		<MotionConfig
			reducedMotion="user"
			transition={{ duration: reduce ? 0 : 0.18, ease: "easeOut" }}
		>
			<LazyMotion features={features} strict>
				{children}
			</LazyMotion>
		</MotionConfig>
	);
}
export function PresenceList({ children }: { children: ReactNode }) {
	return <AnimatePresence initial={false}>{children}</AnimatePresence>;
}
export function AnimatedListItem({ children }: { children: ReactNode }) {
	return (
		<m.div
			layout="position"
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, height: 0 }}
		>
			{children}
		</m.div>
	);
}

export function PopOnSelect({
	selected,
	className,
	children,
}: {
	selected: boolean;
	className?: string;
	children: ReactNode;
}) {
	const mounted = useRef(false);
	useEffect(() => {
		mounted.current = true;
	}, []);
	return (
		<m.span
			key={selected ? "on" : "off"}
			className={cn("inline-flex", className)}
			initial={selected && mounted.current ? { scale: 0.6 } : false}
			animate={{ scale: 1 }}
			transition={{ type: "spring", stiffness: 520, damping: 14 }}
		>
			{children}
		</m.span>
	);
}

const slide = {
	enter: (direction: 1 | -1) => ({ x: `${direction * 24}%`, opacity: 0 }),
	center: { x: 0, opacity: 1 },
	exit: (direction: 1 | -1) => ({ x: `${direction * -24}%`, opacity: 0 }),
};

/**
 * Swaps steps sideways: forward slides the new step in from the right, back from the left.
 * The height follows the new step smoothly, so a bottom sheet grows or shrinks with it.
 */
export function StepSlide({
	step,
	direction,
	className,
	children,
}: {
	step: string;
	direction: 1 | -1;
	className?: string;
	children: ReactNode;
}) {
	const inner = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState<number | "auto">("auto");
	useLayoutEffect(() => {
		const element = inner.current;
		if (!element) return;
		const observer = new ResizeObserver(([entry]) =>
			setHeight(entry?.borderBoxSize[0]?.blockSize ?? element.offsetHeight),
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	return (
		<m.div
			initial={false}
			animate={{ height }}
			transition={{ duration: 0.22, ease: "easeOut" }}
			className="-mx-1 overflow-hidden px-1"
		>
			<div ref={inner} className="relative">
				<AnimatePresence initial={false} mode="popLayout" custom={direction}>
					<m.div
						key={step}
						custom={direction}
						variants={slide}
						initial="enter"
						animate="center"
						exit="exit"
						transition={{ duration: 0.22, ease: "easeOut" }}
						className={className}
					>
						{children}
					</m.div>
				</AnimatePresence>
			</div>
		</m.div>
	);
}
