import { memoTextSchema, textLimits } from "@app/contract";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { orpc } from "@/shared/api";
import {
	AiSparkleIcon,
	Alert,
	AlertDescription,
	BottomSheet,
	BottomSheetBody,
	BottomSheetContent,
	BottomSheetFooter,
	Button,
	ChoiceCard,
	RefreshCwIcon,
	Skeleton,
	Spinner,
	StepSlide,
	Textarea,
	useStepOverlay,
} from "@/shared/ui";
import type { Passage } from "../model/reader-store";
import { useReaderStore } from "../model/reader-store";
import { PassageQuote } from "./passage-quote";

/** 이 구절로 생각해 볼 질문: three AI questions as cards, then an answer. Bound to `question`. */
export function QuestionSheet({
	libraryId,
	bookId,
	ch,
	passage,
	onSkip,
	onAnswered,
}: {
	libraryId: string;
	bookId: string;
	ch: number;
	passage: Passage | null;
	onSkip: () => void;
	onAnswered: () => void;
}) {
	const overlay = useStepOverlay();
	return (
		<BottomSheet {...overlay.bind("question", !!passage)}>
			<BottomSheetContent
				title={
					<span className="flex items-center gap-1.5">
						<AiSparkleIcon className="size-5" />이 구절로 생각해 볼 질문
					</span>
				}
			>
				{passage && (
					<QuestionForm
						key={`${passage.p}-${passage.s}-${passage.e}`}
						libraryId={libraryId}
						bookId={bookId}
						ch={ch}
						passage={passage}
						onSkip={onSkip}
						onAnswered={onAnswered}
					/>
				)}
			</BottomSheetContent>
		</BottomSheet>
	);
}

function QuestionForm({
	libraryId,
	bookId,
	ch,
	passage,
	onSkip,
	onAnswered,
}: {
	libraryId: string;
	bookId: string;
	ch: number;
	passage: Passage;
	onSkip: () => void;
	onAnswered: () => void;
}) {
	const overlay = useStepOverlay();
	const [again, setAgain] = useState(false);
	const [picked, setPicked] = useState<string | undefined>(
		() => useReaderStore.getState().failedDraft?.q,
	);
	const [text, setText] = useState(() => useReaderStore.getState().failedDraft?.text ?? "");
	const [step, setStep] = useState<"pick" | "answer">(() =>
		useReaderStore.getState().failedDraft?.q ? "answer" : "pick",
	);
	const [direction, setDirection] = useState<1 | -1>(1);
	const goTo = (next: "pick" | "answer") => {
		setDirection(next === "answer" ? 1 : -1);
		setStep(next);
	};
	const questions = useQuery({
		...orpc.questions.generate.queryOptions({
			input: { libraryId, bookId, ch, quote: passage.quote.slice(0, 2000), again },
		}),
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	});
	const create = useMutation(
		orpc.traces.create.mutationOptions({
			onMutate: (values) => {
				if (values.kind !== "qa") return;
				useReaderStore.setState({ answered: { q: values.q, passage }, failedDraft: null });
				overlay.switchTo("same");
				onAnswered();
			},
			onError: (_error, values) => {
				if (values.kind !== "qa") return;
				useReaderStore.setState({
					answered: null,
					failedDraft: { kind: "qa", q: values.q, text: values.text },
				});
				overlay.switchTo("question");
			},
		}),
	);
	const list = questions.data?.questions ?? [];
	const valid = !!picked && memoTextSchema.safeParse(text).success;
	return (
		<form
			className="contents"
			onSubmit={(event) => {
				event.preventDefault();
				if (step === "pick") return picked && goTo("answer");
				if (!picked || !valid) return;
				create.mutate({ libraryId, bookId, ch, ...passage, kind: "qa", q: picked, text });
			}}
		>
			<BottomSheetBody withFooter className="relative flex flex-col gap-4 overflow-x-clip pt-2">
				<StepSlide step={step} direction={direction} className="flex flex-col gap-4">
					{step === "answer" && picked ? (
						<>
							<PassageQuote quote={passage.quote} />
							<p className="text-t5 leading-[1.35] font-semibold text-strong break-keep">
								Q. {picked}
							</p>
							<Textarea
								autoFocus
								aria-label="질문에 대한 답"
								value={text}
								onChange={(event) => setText(event.target.value)}
								maxLength={textLimits.memo}
								placeholder="떠오른 생각을 적어보세요"
								className="min-h-28"
							/>
						</>
					) : (
						<>
							<div className="flex items-center justify-between gap-2">
								<PassageQuote quote={passage.quote} className="flex-1" />
								<Button
									type="button"
									variant="ghost"
									className="h-11 shrink-0 text-muted-foreground"
									disabled={questions.isFetching}
									onClick={() => {
										setPicked(undefined);
										setAgain(!again);
									}}
								>
									<RefreshCwIcon data-icon="inline-start" />
									다른 질문 보기
								</Button>
							</div>
							{questions.isFetching && !questions.data ? (
								<div
									className="flex flex-col gap-2"
									role="status"
									aria-label="질문을 만드는 중이에요"
								>
									{[0, 1, 2].map((row) => (
										<Skeleton key={row} className="h-14 rounded-xl bg-magic/10" />
									))}
								</div>
							) : (
								<fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
									<legend className="sr-only">질문 고르기</legend>
									{(questions.data?.source === "fallback" || questions.isError) && (
										<Alert className="border-magic/40">
											<AlertDescription>
												AI 질문을 만들지 못해 기본 질문을 보여드려요.
											</AlertDescription>
										</Alert>
									)}
									{list.map((question) => (
										<ChoiceCard
											key={question.q}
											selected={picked === question.q}
											onSelect={() => setPicked(question.q)}
											className={picked === question.q ? undefined : "border-magic/30"}
										>
											{question.q}
										</ChoiceCard>
									))}
								</fieldset>
							)}
						</>
					)}
				</StepSlide>
				{create.isError && (
					<p role="alert" className="text-st9 text-destructive">
						남기지 못했어요. 다시 시도해주세요.
					</p>
				)}
			</BottomSheetBody>
			<BottomSheetFooter>
				{step === "pick" ? (
					<>
						<Button
							type="button"
							variant="weak"
							size="lg"
							onClick={() => {
								overlay.close();
								onSkip();
							}}
						>
							건너뛰기
						</Button>
						<Button type="button" size="lg" disabled={!picked} onClick={() => goTo("answer")}>
							다음
						</Button>
					</>
				) : (
					<>
						<Button type="button" variant="weak" size="lg" onClick={() => goTo("pick")}>
							뒤로
						</Button>
						<Button type="submit" size="lg" disabled={!valid || create.isPending}>
							{create.isPending && <Spinner data-icon="inline-start" />}
							남기기
						</Button>
					</>
				)}
			</BottomSheetFooter>
		</form>
	);
}
