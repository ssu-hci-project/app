import { AnimatePresence, LazyMotion, MotionConfig, m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

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
