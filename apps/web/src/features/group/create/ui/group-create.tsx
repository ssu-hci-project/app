import type { Book, ReadingGroup } from "@app/contract";
import { groupInputSchema } from "@app/contract";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionButton, Text } from "@seed-design/react";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { orpc } from "@/shared/api";
import {
	RadioSelectBoxItem,
	RadioSelectBoxRadiomark,
	RadioSelectBoxRoot,
	TextField,
	TextFieldInput,
	useNotice,
} from "@/shared/ui";

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
			className="flex flex-col gap-x4 pb-x6"
		>
			{books.length > 1 && (
				<Controller
					control={form.control}
					name="bookId"
					render={({ field }) => (
						<RadioSelectBoxRoot
							label="함께 읽을 책"
							value={field.value}
							onValueChange={field.onChange}
						>
							{books.map((book) => (
								<RadioSelectBoxItem
									key={book.id}
									value={book.id}
									label={book.title}
									description={book.author}
									suffix={<RadioSelectBoxRadiomark />}
								/>
							))}
						</RadioSelectBoxRoot>
					)}
				/>
			)}
			<Controller
				control={form.control}
				name="name"
				render={({ field }) => (
					<TextField
						label="모임 이름"
						value={field.value}
						onValueChange={({ value }) => field.onChange(value)}
						invalid={!!form.formState.errors.name}
						errorMessage={form.formState.errors.name?.message}
					>
						<TextFieldInput
							ref={field.ref}
							onBlur={field.onBlur}
							name={field.name}
							maxLength={60}
							placeholder="천천히 함께 읽기"
						/>
					</TextField>
				)}
			/>
			{create.isError && (
				<Text role="alert" color="fg.critical">
					만들지 못했어요. 이름은 그대로 있으니 다시 시도해주세요.
				</Text>
			)}
			<ActionButton type="submit" variant="brandSolid" loading={create.isPending}>
				함께 읽기 모임 만들기
			</ActionButton>
		</form>
	);
}
