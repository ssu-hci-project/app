import { IconSparkle2Fill } from "@karrotmarket/react-monochrome-icon";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib";

const GRADIENT_ID = "seed-gradient-highlight-magic";

/**
 * SEED `$gradient.highlight-magic`를 SVG 채우기로 쓸 수 있게 한 번만 정의합니다.
 * 토큰은 배경용 CSS 그라디언트라 아이콘에는 바로 쓸 수 없어서, 같은 색 정지점(라이트·다크 동일)을
 * SVG linearGradient로 옮겼어요. 토큰 값이 바뀌면 여기도 함께 바꿔요.
 */
export function AiGradientDefs() {
	return (
		<svg width="0" height="0" aria-hidden="true" className="absolute">
			<defs>
				<linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0.2" stopColor="#ff6600" />
					<stop offset="1" stopColor="#d25aca" />
				</linearGradient>
			</defs>
		</svg>
	);
}

/** AI 기능을 나타내는 반짝임 아이콘. SEED의 AI 그라디언트로 칠해요. */
export function AiSparkleIcon({ className, ...props }: ComponentProps<typeof IconSparkle2Fill>) {
	return (
		<IconSparkle2Fill
			{...props}
			// Tailwind는 문자 그대로 적힌 클래스만 만들어서 id를 직접 적어요(GRADIENT_ID와 같아야 해요).
			className={cn("[&_path]:fill-[url(#seed-gradient-highlight-magic)]", className)}
		/>
	);
}
