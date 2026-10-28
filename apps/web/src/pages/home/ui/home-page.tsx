import "@seed-design/css/recipes/action-button.css";
import "@seed-design/css/recipes/list-item.css";
import "@seed-design/css/recipes/list-header.css";
import "@seed-design/css/recipes/page-banner.css";
import "@seed-design/css/recipes/tabs.css";
import {
	ActionButton,
	Box,
	List,
	ListHeader,
	PageBanner,
	Tabs,
	Text,
	VStack,
} from "@seed-design/react";
import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/shared/api";
import "./home-page.css";

export const HomePage: ActivityComponentType<"HomePage"> = () => {
	const {
		data: books,
		isLoading,
		isError,
		refetch,
	} = useQuery(orpc.reading.listBooks.queryOptions());

	const bookshelf = (
		<VStack gap="x2">
			<ListHeader as="h2">함께 읽는 책</ListHeader>
			{isLoading && <Text color="fg.neutralMuted">책을 불러오고 있어요.</Text>}
			{isError && (
				<VStack gap="x3" px="x4">
					<Text color="fg.critical">책을 불러오지 못했어요.</Text>
					<ActionButton variant="neutralWeak" onClick={() => refetch()}>
						다시 시도
					</ActionButton>
				</VStack>
			)}
			{books?.length === 0 && <Text color="fg.neutralMuted">아직 등록된 책이 없어요.</Text>}
			<List.Root>
				{books?.map((book) => (
					<List.Item key={book.id}>
						<List.Content>
							<List.Title>{book.title}</List.Title>
							<List.Detail>
								{book.author} · {book.pageCount}쪽
							</List.Detail>
						</List.Content>
					</List.Item>
				))}
			</List.Root>
		</VStack>
	);

	return (
		<AppScreen appBar={{ title: "함께 읽기" }}>
			<Tabs.Root defaultValue="home" className="home-tabs">
				<Tabs.Content value="home" className="home-content">
					<VStack gap="x6" py="x5">
						<VStack gap="x2" px="x4">
							<Text as="h1" textStyle="t8Bold">
								각자의 속도로, 함께 읽어요
							</Text>
							<Text color="fg.neutralMuted" textStyle="t4Regular">
								같은 책을 읽는 다른 사람의 생각을 천천히 만나보세요.
							</Text>
						</VStack>
						<PageBanner.Root tone="neutral">
							<PageBanner.Content>
								<PageBanner.Body>
									<PageBanner.Title>책갈피에 머문 생각들</PageBanner.Title>
									<PageBanner.Description>
										내가 원할 때, 같은 페이지에 남겨진 다른 시선을 발견해요.
									</PageBanner.Description>
								</PageBanner.Body>
							</PageBanner.Content>
						</PageBanner.Root>
						{bookshelf}
					</VStack>
				</Tabs.Content>
				<Tabs.Content value="books" className="home-content">
					<Box py="x5">{bookshelf}</Box>
				</Tabs.Content>
				<Tabs.List className="home-navigation" aria-label="메인 내비게이션">
					<Tabs.Trigger value="home">홈</Tabs.Trigger>
					<Tabs.Trigger value="books">책장</Tabs.Trigger>
					<Tabs.Indicator />
				</Tabs.List>
			</Tabs.Root>
		</AppScreen>
	);
};
