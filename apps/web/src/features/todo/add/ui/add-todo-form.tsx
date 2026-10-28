import { todoSchema } from "@app/contract";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionButton } from "@seed-design/react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Input } from "@/shared/ui";
import { useCreateTodo } from "../model/use-create-todo";

// Validate with the contract's own schema so the form can never accept input
// the API will reject (e.g. whitespace-only or over-long titles).
const formSchema = todoSchema.pick({ title: true });
type FormValues = z.infer<typeof formSchema>;

export function AddTodoForm() {
	const { mutate, isPending } = useCreateTodo();
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<FormValues>({ resolver: zodResolver(formSchema) });

	const onSubmit = handleSubmit(({ title }) => {
		mutate({ title }, { onSuccess: () => reset() });
	});

	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-2">
			<div className="flex gap-2">
				<Input
					placeholder="할 일을 입력하세요"
					aria-invalid={!!errors.title}
					{...register("title")}
				/>
				<ActionButton type="submit" disabled={isPending}>
					추가
				</ActionButton>
			</div>
			{errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
		</form>
	);
}
