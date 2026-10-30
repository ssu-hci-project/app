import { Portal } from "@seed-design/react";
import { useActivityZIndexBase } from "@seed-design/stackflow";
import { useActivity, useStepFlow } from "@stackflow/react";
import type { ReactNode } from "react";

/**
 * Sheets that are not their own activity render outside the screen layer (SEED Stackflow guide).
 * The screen layer is a transformed scroll container, so a fixed sheet inside it would scroll with
 * the content. Portalling into the mobile frame (#app-frame) keeps it pinned to the frame bottom.
 */
export function OverlayPortal({ children }: { children: ReactNode }) {
	return <Portal container={{ current: document.getElementById("app-frame") }}>{children}</Portal>;
}

/** z-index base one step above the current activity, for sheets opened from it. */
export function useOverlayLayerIndex() {
	return useActivityZIndexBase({ activityOffset: 1 });
}

type OverlayParams = { overlay?: string };

/**
 * Keeps which sheet is open in the activity's `overlay` step param, so browser back closes the sheet
 * before leaving the screen and a refreshed URL reopens it.
 */
export function useStepOverlay() {
	const activity = useActivity();
	const { pushStep, popStep, replaceStep } = useStepFlow(activity.name as never) as unknown as {
		pushStep: (update: (params: OverlayParams) => OverlayParams) => void;
		replaceStep: (update: (params: OverlayParams) => OverlayParams) => void;
		popStep: () => void;
	};
	const current = (activity.params as OverlayParams).overlay;
	const withOverlay = (overlay?: string) => (params: OverlayParams) => ({ ...params, overlay });
	return {
		current,
		/** Opens a sheet on a new step. */
		open: (key: string) => {
			if (current === key) return;
			if (current) replaceStep(withOverlay(key));
			else pushStep(withOverlay(key));
		},
		/** Swaps the open sheet for another without adding a history entry. */
		switchTo: (key: string) => replaceStep(withOverlay(key)),
		close: () => {
			if (!current) return;
			// A URL opened with the sheet has no earlier step to go back to.
			if (activity.steps.length > 1) popStep();
			else replaceStep(withOverlay(undefined));
		},
		/** `onOpenChange` handler for a sheet bound to `key`. */
		bind: (key: string) => ({
			open: current === key,
			onOpenChange: (open: boolean) => {
				if (open) return;
				if (current === key) {
					if (activity.steps.length > 1) popStep();
					else replaceStep(withOverlay(undefined));
				}
			},
		}),
	};
}
