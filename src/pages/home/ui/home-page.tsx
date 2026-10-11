import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";
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

export const HomePage: ActivityComponentType<"HomePage"> = () => {
	return (
		<AppScreen appBar={{ title: "Home" }}>
			<main className="flex flex-col items-center gap-8 p-8">
				<div className="flex items-center gap-2">
					<h1 className="text-2xl font-bold">Hackathon Template</h1>
					<Dialog>
						<DialogTrigger render={<Button variant="ghost" size="sm" />}>
							이 템플릿에 대해
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Hackathon Template</DialogTitle>
								<DialogDescription>
									Bun · Vite · React · Stackflow · TanStack Query · Tailwind v4 · Feature-Sliced
									Design 기반 해커톤 스타터입니다. 자세한 컨벤션은 CLAUDE.md를 참고하세요.
								</DialogDescription>
							</DialogHeader>
						</DialogContent>
					</Dialog>
				</div>
				<TodoBoard />
			</main>
		</AppScreen>
	);
};
