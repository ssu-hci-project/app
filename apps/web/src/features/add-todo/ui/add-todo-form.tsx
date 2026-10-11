import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Input } from "@/shared/ui";
import { useCreateTodo } from "../model/use-create-todo";

const formSchema = z.object({
	title: z.string().min(1, "할 일을 입력해주세요"),
});
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
		mutate(title, { onSuccess: () => reset() });
	});

	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-2">
			<div className="flex gap-2">
				<Input placeholder="할 일을 입력하세요" {...register("title")} />
				<Button type="submit" disabled={isPending}>
					추가
				</Button>
			</div>
			{errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
		</form>
	);
}
