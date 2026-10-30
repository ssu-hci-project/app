/**
 * @file ui:contextual-floating-button
 * @requires @seed-design/react@^2.0.0 || ^3.0.0
 **/

import {
	ContextualFloatingButton as SeedContextualFloatingButton,
	type ContextualFloatingButtonProps as SeedContextualFloatingButtonProps,
} from "@seed-design/react";
import * as React from "react";
import { LoadingIndicator } from "./loading-indicator";

export interface ContextualFloatingButtonProps extends SeedContextualFloatingButtonProps {}

/**
 * @see https://seed-design.io/react/components/contextual-floating-button
 * If `asChild` is enabled, manual handling of `LoadingIndicator` is required.
 */
export const ContextualFloatingButton = React.forwardRef<
	React.ElementRef<typeof SeedContextualFloatingButton>,
	ContextualFloatingButtonProps
>(({ loading = false, children, ...otherProps }, ref) => {
	return (
		<SeedContextualFloatingButton ref={ref} loading={loading} {...otherProps}>
			{loading && !otherProps.asChild ? <LoadingIndicator>{children}</LoadingIndicator> : children}
		</SeedContextualFloatingButton>
	);
});
ContextualFloatingButton.displayName = "ContextualFloatingButton";

/**
 * This file is a snippet from SEED Design, helping you get started quickly with @seed-design/* packages.
 * You can extend this snippet however you want.
 */
