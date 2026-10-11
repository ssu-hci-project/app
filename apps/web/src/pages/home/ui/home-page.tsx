import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";
import { Fragment } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/ui";
import { TodoBoard } from "@/widgets/todo-board";

const STACK = [
	{ label: "프론트엔드", value: "React 19 · Vite · Stackflow · Tailwind v4 · shadcn (Base UI)" },
	{ label: "데이터", value: "TanStack Query + oRPC (타입이 자동으로 맞는 API 호출)" },
	{ label: "API", value: "Hono on Cloudflare Workers" },
	{ label: "DB", value: "Cloudflare D1 (SQLite) + Drizzle ORM" },
	{ label: "구조", value: "Feature-Sliced Design · Bun workspaces · Turborepo" },
	{ label: "품질", value: "Biome · Steiger · knip · Vitest · lefthook" },
];

export const HomePage: ActivityComponentType<"HomePage"> = () => {
	return (
		<AppScreen appBar={{ title: "Home" }}>
			<main className="flex flex-col items-center gap-8 p-8">
				<div className="flex items-center gap-2">
					<h1 className="text-2xl font-bold">App</h1>
					<Dialog>
						<DialogTrigger render={<Button variant="ghost" size="sm" />}>
							이 템플릿에 대해
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>이 템플릿에 대해</DialogTitle>
								<DialogDescription>
									프론트엔드와 API를 한 저장소에서 관리하는 Bun + Turborepo 모노레포 스타터입니다.
								</DialogDescription>
							</DialogHeader>
							<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
								{STACK.map(({ label, value }) => (
									<Fragment key={label}>
										<dt className="font-medium text-muted-foreground">{label}</dt>
										<dd>{value}</dd>
									</Fragment>
								))}
							</dl>
							<p className="text-xs text-muted-foreground">
								API 문서는 /api/docs, 작업 규칙은 저장소의 CLAUDE.md를 참고하세요.
							</p>
						</DialogContent>
					</Dialog>
				</div>
				<TodoBoard />
			</main>
		</AppScreen>
	);
};
