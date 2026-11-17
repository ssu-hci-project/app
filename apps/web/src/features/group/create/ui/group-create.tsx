import type { LegacyBook as Book, ReadingGroup } from "@app/contract";
import { groupInputSchema } from "@app/contract";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { orpc } from "@/shared/api";
import { Button, ChoiceGroup, ChoiceItem, Spinner, TextField, useNotice } from "@/shared/ui";

/**
 * 함께 읽기 모임을 만드는 폼입니다. 책이 둘 이상이면 먼저 책을 고르고, 하나면 이름만 받습니다.
 */
export function GroupCreate({
	books,
	defaultBookId,
	onCreated,
}: {
	books: Book[];
	defaultBookId: string;
	onCreated: (group: ReadingGroup) => void;
}) {
	const notify = useNotice();
	const form = useForm<z.infer<typeof groupInputSchema>>({
		resolver: zodResolver(groupInputSchema),
		defaultValues: { bookId: defaultBookId, name: "" },
	});
	const create = useMutation(
		orpc.groups.create.mutationOptions({
			onSuccess: (saved) => {
				form.reset();
				onCreated(saved);
			},
			onError: () => notify("모임을 만들지 못했어요", "critical"),
		}),
	);
	return (
		<form
			onSubmit={form.handleSubmit((values) => create.mutate(values))}
			className="flex flex-col gap-4"
		>
			{books.length > 1 && (
				<Controller
					control={form.control}
					name="bookId"
					render={({ field }) => (
						<ChoiceGroup label="함께 읽을 책" value={field.value} onValueChange={field.onChange}>
							{books.map((book) => (
								<ChoiceItem
									key={book.id}
									value={book.id}
									label={book.title}
									description={book.author}
								/>
							))}
						</ChoiceGroup>
					)}
				/>
			)}
			<Controller
				control={form.control}
				name="name"
				render={({ field }) => (
					<TextField
						label="모임 이름"
						{...field}
						error={form.formState.errors.name?.message}
						maxLength={60}
						placeholder="천천히 함께 읽기"
					/>
				)}
			/>
			{create.isError && (
				<p role="alert" className="text-destructive">
					만들지 못했어요. 이름은 그대로 있으니 다시 시도해주세요.
				</p>
			)}
			<Button type="submit" size="lg" disabled={create.isPending}>
				{create.isPending && <Spinner data-icon="inline-start" />}
				함께 읽기 모임 만들기
			</Button>
		</form>
	);
}
