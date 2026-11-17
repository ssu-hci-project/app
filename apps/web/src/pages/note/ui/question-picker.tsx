import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { orpc } from "@/shared/api";
import {
	AiSparkleIcon,
	Alert,
	AlertDescription,
	AlertTitle,
	ChoiceGroup,
	ChoiceItem,
	Skeleton,
	TextField,
} from "@/shared/ui";

/** 기록의 prompt 길이 제한과 같아요. */
const PROMPT_LIMIT = 200;
const NONE = "none";
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
		<section className="flex flex-col gap-3" aria-label="생각을 여는 질문">
			{/* 질문을 만드는 동안에도 같은 문구로 보여서, 도착해도 내용이 바뀌지 않아요. */}
			{(generated.isFetching || ai.length > 0) && (
				// 제목과 본문이 한 줄로 이어 읽히니 본문을 "이"로 시작하지 않아요("AI 질문이 쪽의…").
				<Alert className="border-magic/30 bg-magic/5">
					<AiSparkleIcon />
					<AlertTitle>AI 질문</AlertTitle>
					<AlertDescription>
						방금 읽은 장면에서 골라봤어요. 끌리는 게 있으면 답해보세요.
					</AlertDescription>
				</Alert>
			)}
			<ChoiceGroup label="생각을 여는 질문" value={selected} onValueChange={choose}>
				<ChoiceItem value={NONE} label="질문 없이 쓰기" />
				{/* AI 질문이 들어올 자리를 스켈레톤으로 미리 보여줘요. */}
				{generated.isFetching && (
					<div role="status" className="flex flex-col gap-3">
						{[0, 1, 2].map((row) => (
							<Skeleton key={row} className="h-14 w-full rounded-xl bg-magic/10" />
						))}
						<span className="sr-only">이 장면에 맞는 AI 질문을 만들고 있어요</span>
					</div>
				)}
				{ai.map((question) => (
					<ChoiceItem key={question} value={question} icon={<AiSparkleIcon />} label={question} />
				))}
				<ChoiceItem value={CUSTOM} label="직접 질문 쓰기" />
			</ChoiceGroup>
			{selected === CUSTOM && (
				<TextField
					label="내 질문"
					value={custom}
					onChange={(event) => {
						setCustom(event.target.value);
						onChange(event.target.value.trim() || null);
					}}
					description="이 질문에 답하듯 아래에 생각을 적어요."
					name="custom-prompt"
					maxLength={PROMPT_LIMIT}
					placeholder="예: 이 인물은 왜 그렇게 말했을까?"
					autoFocus
				/>
			)}
		</section>
	);
}
