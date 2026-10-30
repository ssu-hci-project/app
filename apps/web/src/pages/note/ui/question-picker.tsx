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
} from "@/shared/ui";

/**
 * 생각을 여는 질문을 고르는 선택 영역입니다. 작성 화면을 열면 기본 질문을 바로 보여주고,
 * AI 질문은 도착하는 대로 위에 더해요. AI에는 지금 쪽까지의 본문과 고른 구절만 가고, 쓰던
 * 생각은 보내지 않아요. 고르지 않아도 자유롭게 쓸 수 있어요.
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
	const templates = useQuery({
		...orpc.reading.listQuestionTemplates.queryOptions(),
	});
	// 화면을 열 때의 구절로 한 번만 요청해요. 구절을 고쳐 쓸 때마다 다시 만들지 않아요.
	const [requestQuote] = useState(() => quote.trim() || undefined);
	const generated = useQuery({
		...orpc.reading.generateQuestions.queryOptions({
			input: { bookId, page, quote: requestQuote },
		}),
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	});
	const ai = generated.data?.source === "ai" ? generated.data.questions : [];
	const aiQuestions = new Set(ai.map((item) => item.question));
	const questions = [...aiQuestions, ...(templates.data ?? []).map((item) => item.question)];
	return (
		<section className="flex flex-col gap-x3" aria-label="생각을 여는 질문">
			{/* AI 질문을 받아왔을 때만 안내해요. 기본 질문만 있을 때는 목록만 보여줘요. */}
			{ai.length > 0 && (
				<Callout
					tone="magic"
					prefixIcon={<AiSparkleIcon />}
					title="AI 질문"
					description="반짝임이 붙은 질문은 이 쪽을 바탕으로 만들었어요. 정답은 없으니 마음 가는 것만 골라요."
				/>
			)}
			<RadioSelectBoxRoot
				label="생각을 여는 질문"
				value={value ?? ""}
				onValueChange={(next) => onChange(next || null)}
			>
				<RadioSelectBoxItem value="" label="질문 없이 쓰기" suffix={<RadioSelectBoxRadiomark />} />
				{/* AI 질문이 들어올 자리를 Magic 톤 스켈레톤으로 미리 보여줘요(SEED Loading 패턴). */}
				{generated.isFetching && (
					<div role="status" className="flex flex-col gap-x3">
						{[0, 1, 2].map((row) => (
							<Skeleton key={row} tone="magic" width="full" height="x14" radius="16" />
						))}
						<span className="sr-only">이 장면에 맞는 AI 질문을 만들고 있어요</span>
					</div>
				)}
				{[...new Set(questions)].map((question) => (
					<RadioSelectBoxItem
						key={question}
						value={question}
						// AI 질문은 Callout과 같은 반짝임 아이콘으로만 구분하고, 화면 낭독기에는 말로 알려요.
						prefixIcon={aiQuestions.has(question) ? <AiSparkleIcon /> : undefined}
						label={
							aiQuestions.has(question) ? (
								<>
									<span className="sr-only">AI 질문: </span>
									{question}
								</>
							) : (
								question
							)
						}
						suffix={<RadioSelectBoxRadiomark />}
					/>
				))}
			</RadioSelectBoxRoot>
		</section>
	);
}
