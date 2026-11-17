import type { ReactNode } from "react";
import { Button } from "./button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "./empty";

type Action = { label: string; onClick: () => void };

/** An empty or error state with an optional action. */
export function ResultSection({
	title,
	description,
	action,
	secondaryAction,
}: {
	title: ReactNode;
	description?: ReactNode;
	action?: Action;
	secondaryAction?: Action;
}) {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyTitle className="text-lg font-bold">{title}</EmptyTitle>
				{description && <EmptyDescription>{description}</EmptyDescription>}
			</EmptyHeader>
			{(action || secondaryAction) && (
				<EmptyContent>
					{action && (
						<Button variant="outline" onClick={action.onClick}>
							{action.label}
						</Button>
					)}
					{secondaryAction && (
						<Button variant="ghost" size="sm" onClick={secondaryAction.onClick}>
							{secondaryAction.label}
						</Button>
					)}
				</EmptyContent>
			)}
		</Empty>
	);
}
