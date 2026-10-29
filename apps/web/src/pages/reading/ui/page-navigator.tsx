import type { Book } from "@app/contract";
import { bookmarkSchema } from "@app/contract";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionButton, Text } from "@seed-design/react";
import { useStepFlow } from "@stackflow/react";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { orpc } from "@/shared/api";
import { TextField, TextFieldInput, useNotice } from "@/shared/ui";

export function PageNavigator({
	book,
	page,
	groupId,
	allowed,
}: {
	book: Book;
	page: number;
	groupId?: string;
	allowed: boolean;
}) {
	const { replaceStep } = useStepFlow("ReadingPage");
	const notify = useNotice();
	const validPage = Number.isInteger(page) && page > 0 && page <= book.pageCount;
	const schema = z.object({
		page: bookmarkSchema.shape.page.max(
			book.pageCount,
			`1~${book.pageCount}쪽 사이로 입력해주세요`,
		),
	});
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { page: validPage ? page : 1 },
	});
	const progress = useMutation(
		orpc.reading.saveProgress.mutationOptions({
			onError: () => notify("읽던 페이지를 저장하지 못했어요", "critical"),
		}),
	);
	const { mutate } = progress;
	useEffect(() => {
		if (validPage && allowed) mutate({ bookId: book.id, page, groupId: groupId ?? null });
	}, [book.id, page, groupId, validPage, allowed, mutate]);
	return (
		<>
			<form
				className="flex items-end gap-x2"
				onSubmit={form.handleSubmit(({ page: next }) =>
					mutate(
						{ bookId: book.id, page: next, groupId: allowed ? (groupId ?? null) : null },
						{
							onSuccess: () =>
								replaceStep({
									bookId: book.id,
									page: String(next),
									groupId: allowed ? (groupId ?? "private") : "private",
								}),
						},
					),
				)}
			>
				<div className="min-w-0 flex-1">
					<Controller
						control={form.control}
						name="page"
						render={({ field }) => (
							<TextField
								label="읽고 있는 페이지"
								value={Number.isNaN(field.value) ? "" : String(field.value)}
								onValueChange={({ value }) =>
									field.onChange(value === "" ? Number.NaN : Number(value))
								}
								invalid={!!form.formState.errors.page}
								errorMessage={form.formState.errors.page?.message}
							>
								<TextFieldInput
									type="number"
									inputMode="numeric"
									min={1}
									max={book.pageCount}
									ref={field.ref}
									name={field.name}
									onBlur={field.onBlur}
								/>
							</TextField>
						)}
					/>
				</div>
				<ActionButton variant="neutralWeak" type="submit" loading={progress.isPending}>
					이동
				</ActionButton>
			</form>
			{progress.isError && (
				<Text color="fg.critical" role="alert">
					읽던 페이지를 저장하지 못했어요. 이동 버튼으로 다시 시도해주세요.
				</Text>
			)}
		</>
	);
}
