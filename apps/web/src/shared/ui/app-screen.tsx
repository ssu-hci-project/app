/**
 * @file ui:app-screen
 * @requires @seed-design/react@^2.0.0 || ^3.0.0
 **/

import { AppScreen as SeedAppScreen } from "@seed-design/stackflow";
import { useFlow as useActions, useActivity } from "@stackflow/react";
import { forwardRef } from "react";
import { PullToRefreshContent, PullToRefreshIndicator, PullToRefreshRoot } from "./pull-to-refresh";

export interface AppScreenProps extends Omit<SeedAppScreen.RootProps, "asChild"> {
	preventSwipeBack?: boolean;
}

export const AppScreen = forwardRef<HTMLDivElement, AppScreenProps>(
	({ children, onSwipeBackEnd, preventSwipeBack, ...otherProps }, ref) => {
		const { pop } = useActions();
		const { isRoot } = useActivity();
		const shouldSwipeBack = !isRoot && !preventSwipeBack;

		return (
			<SeedAppScreen.Root
				ref={ref}
				onSwipeBackEnd={({ swiped }) => {
					if (swiped) {
						pop();
					}
					onSwipeBackEnd?.({ swiped });
				}}
				{...otherProps}
			>
				<SeedAppScreen.Dim />
				{children}
				{shouldSwipeBack && <SeedAppScreen.Edge />}
			</SeedAppScreen.Root>
		);
	},
);
AppScreen.displayName = "AppScreen";

export interface AppScreenContentProps extends Omit<SeedAppScreen.LayerProps, "asChild"> {
	ptr?: boolean;

	onPtrReady?: () => void;

	onPtrRefresh?: () => Promise<void>;
}

export const AppScreenContent = forwardRef<HTMLDivElement, AppScreenContentProps>(
	({ children, ptr, onPtrReady, onPtrRefresh, ...otherProps }, ref) => {
		if (!ptr) {
			return (
				<SeedAppScreen.Layer ref={ref} {...otherProps}>
					{children}
				</SeedAppScreen.Layer>
			);
		}

		return (
			<PullToRefreshRoot asChild onPtrReady={onPtrReady} onPtrRefresh={onPtrRefresh}>
				<SeedAppScreen.Layer ref={ref} {...otherProps}>
					<PullToRefreshIndicator />
					<PullToRefreshContent asChild>{children}</PullToRefreshContent>
				</SeedAppScreen.Layer>
			</PullToRefreshRoot>
		);
	},
);

/**
 * This file is a snippet from SEED Design, helping you get started quickly with @seed-design/* packages.
 * You can extend this snippet however you want.
 */
