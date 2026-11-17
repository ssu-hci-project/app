import { create } from "zustand";
import { useProfile } from "@/entities/profile";
import { useStepOverlay } from "@/shared/ui";

/** How a gated action opens or closes sheets: from the profile sheet, or directly. */
export type SheetControl = { open: (key: string) => void; close: () => void };
type Pending = { run?: (sheet: SheetControl) => void };

export const pendingAction = create<Pending>(() => ({}));

/**
 * Asks for a name and colour the first time someone leaves a trace, then carries on with what
 * they were doing. Until then the reader shows as "나" with the default colour.
 */
export function useProfileGate() {
	const profile = useProfile();
	const overlay = useStepOverlay();
	return (run: (sheet: SheetControl) => void) => {
		if (profile.data?.nick) {
			run({ open: overlay.open, close: () => {} });
			return;
		}
		pendingAction.setState({ run });
		overlay.open("profile");
	};
}
