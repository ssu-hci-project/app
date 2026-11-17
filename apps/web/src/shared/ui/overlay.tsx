import { useActivity, useStepFlow } from "@stackflow/react";

/**
 * Sheets, dialogs and toasts render into the mobile frame instead of <body>, so on wide screens they
 * stay inside the 430px column. The frame has a transform, which also makes `fixed` children
 * position against it.
 */
export const appFrame = () => document.getElementById("app-frame");

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
	const close = () => {
		if (!current) return;
		// A URL opened with the sheet has no earlier step to go back to.
		if (activity.steps.length > 1) popStep();
		else replaceStep(withOverlay(undefined));
	};
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
		close,
		/** `open`/`onOpenChange` for a sheet bound to `key`. */
		bind: (key: string) => ({
			open: current === key,
			onOpenChange: (open: boolean) => {
				if (!open && current === key) close();
			},
		}),
	};
}
