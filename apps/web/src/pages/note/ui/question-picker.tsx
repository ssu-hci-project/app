import { Skeleton } from "@seed-design/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { orpc } from "@/shared/api";
import {
	AiSparkleIcon,
	Callout,
	RadioSelectBoxItem,
	RadioSelectBoxRadiomark,
	RadioSelectBoxRoot,
	TextField,
	TextFieldInput,
} from "@/shared/ui";

/** 기록의 prompt 길이 제한과 같아요. */
const PROMPT_LIMIT = 200;
const NONE = "";
const CUSTOM = "custom";

/**
 * 생각을 여는 질문을 고르거나 직접 쓰는 영역입니다. AI 질문은 작성 화면을 열 때 한 번 요청하고,
 * 지금 쪽까지의 본문과 고른 구절만 보내요. 쓰던 생각은 보내지 않아요. AI가 질문을 만들지 못해도
 * 질문 없이 쓰거나 직접 질문을 적을 수 있어요.
 */
export function QuestionPicker({
	bookId,
	page,
	quote,
	value,
	onChange,
}: {
	bookId: string;
	page: number;
	quote: string;
	value: string | null;
	onChange: (prompt: string | null) => void;
}) {
	// 화면을 열 때의 구절로 한 번만 요청해요. 구절을 고쳐 쓸 때마다 다시 만들지 않아요.
	const [requestQuote] = useState(() => quote.trim() || undefined);
	const generated = useQuery({
		...orpc.reading.generateQuestions.queryOptions({
			input: { bookId, page, quote: requestQuote },
		}),
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	});
	const ai = [
		...new Set(
			generated.data?.source === "ai" ? generated.data.questions.map((item) => item.question) : [],
		),
	];
	// 저장된 질문이 이번 AI 질문에 없으면 직접 쓴 질문으로 보여줘요.
	const [custom, setCustom] = useState(() => (value && !ai.includes(value) ? value : ""));
	const [choice, setChoice] = useState(() => (value ? CUSTOM : NONE));
	const selected = choice === CUSTOM && value && ai.includes(value) ? value : choice;
	const choose = (next: string) => {
		setChoice(next);
		onChange(next === NONE ? null : next === CUSTOM ? custom.trim() || null : next);
	};
	return (
		<section className="flex flex-col gap-x3" aria-label="생각을 여는 질문">
			{ai.length > 0 && (
				<Callout
					tone="magic"
					prefixIcon={<AiSparkleIcon />}
					title="AI 질문"
					// 제목과 본문이 한 줄로 이어 읽히니 본문을 "이"로 시작하지 않아요("AI 질문이 쪽의…").
					description="지금 읽는 쪽의 본문을 바탕으로 만들었어요. 정답은 없으니 마음 가는 것만 골라요."
				/>
			)}
			<RadioSelectBoxRoot label="생각을 여는 질문" value={selected} onValueChange={choose}>
				<RadioSelectBoxItem
					value={NONE}
					label="질문 없이 쓰기"
					suffix={<RadioSelectBoxRadiomark />}
				/>
				{/* AI 질문이 들어올 자리를 Magic 톤 스켈레톤으로 미리 보여줘요(SEED Loading 패턴). */}
				{generated.isFetching && (
					<div role="status" className="flex flex-col gap-x3">
						{[0, 1, 2].map((row) => (
							<Skeleton key={row} tone="magic" width="full" height="x14" radius="16" />
						))}
						<span className="sr-only">이 장면에 맞는 AI 질문을 만들고 있어요</span>
					</div>
				)}
				{ai.map((question) => (
					<RadioSelectBoxItem
						key={question}
						value={question}
						prefixIcon={<AiSparkleIcon />}
						label={question}
						suffix={<RadioSelectBoxRadiomark />}
					/>
				))}
				<RadioSelectBoxItem
					value={CUSTOM}
					label="직접 질문 쓰기"
					suffix={<RadioSelectBoxRadiomark />}
				/>
			</RadioSelectBoxRoot>
			{selected === CUSTOM && (
				<TextField
					label="내 질문"
					value={custom}
					onValueChange={({ value: next }) => {
						setCustom(next);
						onChange(next.trim() || null);
					}}
					description="이 질문에 답하듯 아래에 생각을 적어요."
				>
					<TextFieldInput
						name="custom-prompt"
						maxLength={PROMPT_LIMIT}
						placeholder="예: 김 첨지는 왜 집에 가기를 미뤘을까?"
						autoFocus
					/>
				</TextField>
			)}
		</section>
	);
}
