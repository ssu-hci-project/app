/**
 * @file ui:bottom-sheet
 * @requires @seed-design/react@^2.0.0 || ^3.0.0
 **/

import IconXmarkLine from "@karrotmarket/react-monochrome-icon/IconXmarkLine";
import { Icon, BottomSheet as SeedBottomSheet, VisuallyHidden } from "@seed-design/react";
import type * as React from "react";
import { forwardRef } from "react";
import { OverlayPortal, useOverlayLayerIndex } from "./overlay";

export interface BottomSheetRootProps extends SeedBottomSheet.RootProps {}

/**
 * @see https://seed-design.io/react/components/bottom-sheet
 */
export const BottomSheetRoot = (props: BottomSheetRootProps) => {
	const { children, ...otherProps } = props;
	return <SeedBottomSheet.Root {...otherProps}>{children}</SeedBottomSheet.Root>;
};

export interface BottomSheetTriggerProps extends SeedBottomSheet.TriggerProps {}

export const BottomSheetTrigger = SeedBottomSheet.Trigger;

export interface BottomSheetContentProps
	extends Omit<SeedBottomSheet.ContentProps, "title" | "asChild"> {
	title?: React.ReactNode;

	description?: React.ReactNode;

	layerIndex?: number;

	/**
	 * @default true
	 */
	showCloseButton?: boolean;

	/**
	 * @default false
	 */
	showHandle?: boolean;
}

export const BottomSheetContent = forwardRef<HTMLDivElement, BottomSheetContentProps>(
	(
		{
			children,
			title,
			description,
			layerIndex,
			showCloseButton = true,
			showHandle = false,
			...otherProps
		},
		ref,
	) => {
		if (
			!title &&
			!otherProps["aria-labelledby"] &&
			!otherProps["aria-label"] &&
			import.meta.env.DEV
		) {
			console.warn(
				"BottomSheetContent: aria-labelledby or aria-label should be provided if title is not provided.",
			);
		}

		const shouldRenderHeader = title || description;
		const overlayIndex = useOverlayLayerIndex();

		return (
			<OverlayPortal>
				<SeedBottomSheet.Positioner
					style={{ "--layer-index": layerIndex ?? overlayIndex } as React.CSSProperties}
				>
					<SeedBottomSheet.Backdrop />
					<SeedBottomSheet.Content ref={ref} {...otherProps}>
						{showHandle && <SeedBottomSheet.Handle />}
						{shouldRenderHeader && (
							<SeedBottomSheet.Header>
								{title ? (
									<SeedBottomSheet.Title>{title}</SeedBottomSheet.Title>
								) : (
									<VisuallyHidden asChild>
										<SeedBottomSheet.Title>{otherProps["aria-label"] || ""}</SeedBottomSheet.Title>
									</VisuallyHidden>
								)}
								{description && (
									<SeedBottomSheet.Description>{description}</SeedBottomSheet.Description>
								)}
							</SeedBottomSheet.Header>
						)}
						{children}
						{showCloseButton && (
							// You may implement your own i18n for dismiss label
							<SeedBottomSheet.CloseButton aria-label="닫기">
								<Icon svg={<IconXmarkLine />} />
							</SeedBottomSheet.CloseButton>
						)}
					</SeedBottomSheet.Content>
				</SeedBottomSheet.Positioner>
			</OverlayPortal>
		);
	},
);

export interface BottomSheetBodyProps extends SeedBottomSheet.BodyProps {}

export const BottomSheetBody = SeedBottomSheet.Body;

export interface BottomSheetFooterProps extends SeedBottomSheet.FooterProps {}

export const BottomSheetFooter = SeedBottomSheet.Footer;

/**
 * This file is a snippet from SEED Design, helping you get started quickly with @seed-design/* packages.
 * You can extend this snippet however you want.
 */
