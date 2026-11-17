import { type ComponentProps, type ReactNode, useId } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";
import { Input } from "./input";
import { Textarea } from "./textarea";

type FieldProps = { label: ReactNode; description?: ReactNode; error?: string };

/** A labelled input with description and error message. */
export function TextField({
	label,
	description,
	error,
	...props
}: FieldProps & ComponentProps<"input">) {
	const id = useId();
	return (
		<Field data-invalid={!!error || undefined}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<Input id={id} aria-invalid={!!error || undefined} className="h-12 text-base" {...props} />
			{error ? (
				<FieldError>{error}</FieldError>
			) : (
				description && <FieldDescription>{description}</FieldDescription>
			)}
		</Field>
	);
}

export function TextAreaField({
	label,
	description,
	error,
	...props
}: FieldProps & ComponentProps<"textarea">) {
	const id = useId();
	return (
		<Field data-invalid={!!error || undefined}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<Textarea id={id} aria-invalid={!!error || undefined} className="text-base" {...props} />
			{error ? (
				<FieldError>{error}</FieldError>
			) : (
				description && <FieldDescription>{description}</FieldDescription>
			)}
		</Field>
	);
}
