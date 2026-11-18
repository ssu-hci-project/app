import { AnimatePresence, LazyMotion, MotionConfig, m, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useRef } from "react";
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
