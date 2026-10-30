import { IconSparkle2Fill } from "@karrotmarket/react-monochrome-icon";
import { Text } from "@seed-design/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { orpc } from "@/shared/api";
import {
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
			<Callout
				tone="magic"
				prefixIcon={<IconSparkle2Fill />}
				title={ai.length ? "AI 질문" : "질문은 고르지 않아도 돼요"}
				description={
					ai.length
						? "이 쪽의 본문을 바탕으로 만든 질문이 있어요. 정답은 없으니 마음 가는 것만 골라요."
						: "마음 가는 질문이 있으면 골라보세요."
				}
			/>
			{generated.isFetching && (
				<Text textStyle="t3Regular" color="fg.neutralMuted" role="status">
					이 장면에 맞는 질문을 만들고 있어요
				</Text>
			)}
			<RadioSelectBoxRoot
				label="생각을 여는 질문"
				value={value ?? ""}
				onValueChange={(next) => onChange(next || null)}
			>
				<RadioSelectBoxItem value="" label="질문 없이 쓰기" suffix={<RadioSelectBoxRadiomark />} />
				{[...new Set(questions)].map((question) => (
					<RadioSelectBoxItem
						key={question}
						value={question}
						label={question}
						description={aiQuestions.has(question) ? "AI가 이 쪽을 읽고 만든 질문" : undefined}
						suffix={<RadioSelectBoxRadiomark />}
					/>
				))}
			</RadioSelectBoxRoot>
		</section>
	);
}
