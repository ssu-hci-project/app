import type { ComponentProps } from "react";
import { cn } from "@/shared/lib";
import ai from "./assets/tds-ai-twinkle.svg";
import asset0 from "./assets/tds-arrow-back-ios-center-mono.svg";
import asset2 from "./assets/tds-arrow-down-mono.svg";
import arrowLeft from "./assets/tds-arrow-left-mono.svg";
import asset1 from "./assets/tds-arrow-right-mono.svg";
import asset3 from "./assets/tds-arrow-up-mono.svg";
import asset7 from "./assets/tds-bin-line-mono.svg";
import asset6 from "./assets/tds-book-opened-mono.svg";
import bookmark from "./assets/tds-bookmark-mono.svg";
import asset16 from "./assets/tds-bulb-mono.svg";
import question from "./assets/tds-chat-bubble-question-mono.svg";
import asset17 from "./assets/tds-chat-bubble-text-square-mono.svg";
import asset23 from "./assets/tds-check-circle-mono.svg";
import asset8 from "./assets/tds-check-mono.svg";
import asset9 from "./assets/tds-copy-mono.svg";
import document from "./assets/tds-document-mono.svg";
import asset12 from "./assets/tds-dots-mono.svg";
import asset13 from "./assets/tds-dots-vertical-1-mono.svg";
import asset25 from "./assets/tds-emoji-mono.svg";
import asset24 from "./assets/tds-exclamation-circle-mono.svg";
import asset10 from "./assets/tds-exit-mono.svg";
import asset22 from "./assets/tds-filter-mono.svg";
import asset4 from "./assets/tds-heart-mono.svg";
import asset5 from "./assets/tds-heart-whiteline-mono.svg";
import home from "./assets/tds-home.svg";
import asset20 from "./assets/tds-line-pencil-mono.svg";
import pencil from "./assets/tds-pencil-mono.svg";
import asset15 from "./assets/tds-refresh-mono.svg";
import search from "./assets/tds-search.svg";
import asset11 from "./assets/tds-share-dots-mono.svg";
import asset21 from "./assets/tds-text-mono.svg";
import asset18 from "./assets/tds-underline-mono-0.svg";
import asset19 from "./assets/tds-underline-mono-1.svg";
import asset14 from "./assets/tds-x-mono.svg";

const assets = {
	"icon-chat-bubble-question-mono": [{ src: question, inset: "0", original: false }],
	"icon-pencil-mono": [{ src: pencil, inset: "0", original: false }],
	"icon-bookmark-mono": [{ src: bookmark, inset: "0", original: false }],
	"icon-document-mono": [{ src: document, inset: "8.33% 14.58%", original: false }],
	ai: [{ src: ai, inset: "0", original: false }],
	"icon-arrow-back-ios-center-mono": [{ src: asset0, inset: "0", original: false }],
	"icon-arrow-right-mono": [{ src: asset1, inset: "0", original: false }],
	"icon-arrow-left-mono": [{ src: arrowLeft, inset: "0", original: false }],
	"icon-arrow-down-mono": [{ src: asset2, inset: "0", original: false }],
	"icon-arrow-up-mono": [{ src: asset3, inset: "0", original: false }],
	"icon-heart-mono": [{ src: asset4, inset: "0", original: false }],
	"icon-heart-whiteline-mono": [{ src: asset5, inset: "0", original: false }],
	"icon-book-opened-mono": [{ src: asset6, inset: "15.31% 4.17% 11.14% 4.17%", original: false }],
	"icon-bin-line-mono": [{ src: asset7, inset: "3.5% 9.79% 7.74% 9.79%", original: false }],
	"icon-check-mono": [{ src: asset8, inset: "0", original: false }],
	"icon-copy-mono": [{ src: asset9, inset: "5.42%", original: false }],
	"icon-exit-mono": [{ src: asset10, inset: "2.08% 6.25% 2.09% 6.25%", original: false }],
	"icon-share-dots-mono": [{ src: asset11, inset: "5.83% 9.58%", original: false }],
	"icon-dots-mono": [{ src: asset12, inset: "0", original: false }],
	"icon-dots-vertical-1-mono": [{ src: asset13, inset: "0", original: false }],
	"icon-x-mono": [{ src: asset14, inset: "0", original: false }],
	"icon-refresh-mono": [{ src: asset15, inset: "0", original: false }],
	"icon-bulb-mono": [{ src: asset16, inset: "0.14% 10.72%", original: false }],
	"icon-chat-bubble-text-square-mono": [{ src: asset17, inset: "0", original: false }],
	"icon-underline-mono": [
		{ src: asset18, inset: "75% 21.67% 15% 21.67%", original: false },
		{ src: asset19, inset: "13.33% 24.17% 29.17% 23.75%", original: false },
	],
	"icon-line-pencil-mono": [{ src: asset20, inset: "0", original: false }],
	"icon-text-mono": [{ src: asset21, inset: "0", original: false }],
	"icon-filter-mono": [{ src: asset22, inset: "0", original: false }],
	"icon-check-circle-mono": [{ src: asset23, inset: "0", original: false }],
	"icon-exclamation-circle-mono": [{ src: asset24, inset: "0", original: false }],
	"icon-emoji-mono": [{ src: asset25, inset: "0", original: false }],
	home: [{ src: home, inset: "0", original: false }],
	search: [{ src: search, inset: "0", original: false }],
};
type IconProps = Omit<ComponentProps<"span">, "children"> & { size?: number; strokeWidth?: number };
export function TdsIcon({
	name,
	className,
	size,
	strokeWidth: _strokeWidth,
	style,
	...props
}: IconProps & { name: keyof typeof assets }) {
	return (
		<span
			data-slot="tds-icon"
			aria-hidden={props["aria-label"] ? undefined : true}
			role={props["aria-label"] ? "img" : undefined}
			className={cn(
				"pointer-events-none relative inline-block size-6 shrink-0 align-middle",
				className,
			)}
			style={{ ...(size ? { width: size, height: size } : {}), ...style }}
			{...props}
		>
			{assets[name].map((layer) => (
				<span key={layer.src} className="absolute block" style={{ inset: layer.inset }}>
					{layer.original ? (
						<img src={layer.src} alt="" className="block size-full" />
					) : (
						<span
							className="absolute inset-0 bg-current"
							style={{
								maskImage: `url("${layer.src}")`,
								maskSize: "contain",
								maskRepeat: "no-repeat",
								maskPosition: "center",
							}}
						/>
					)}
				</span>
			))}
		</span>
	);
}
const makeIcon = (name: keyof typeof assets) => (props: IconProps) => (
	<TdsIcon name={name} {...props} />
);
export const ChevronLeftIcon = makeIcon("icon-arrow-left-mono");
export const ChevronRightIcon = makeIcon("icon-arrow-right-mono");
export const ChevronDownIcon = makeIcon("icon-arrow-down-mono");
export const ChevronUpIcon = makeIcon("icon-arrow-up-mono");
export const LibraryBigIcon = makeIcon("icon-bookmark-mono");
export const DocumentIcon = makeIcon("icon-document-mono");
export const BookOpenIcon = makeIcon("icon-book-opened-mono");
export const Trash2Icon = makeIcon("icon-bin-line-mono");
export const CheckIcon = makeIcon("icon-check-mono");
export const CopyIcon = makeIcon("icon-copy-mono");
export const LogOutIcon = makeIcon("icon-exit-mono");
export const Share2Icon = makeIcon("icon-share-dots-mono");
export const EllipsisIcon = makeIcon("icon-dots-mono");
export const EllipsisVerticalIcon = makeIcon("icon-dots-vertical-1-mono");
export const XIcon = makeIcon("icon-x-mono");
export const RefreshCwIcon = makeIcon("icon-refresh-mono");
export const LightbulbIcon = makeIcon("icon-bulb-mono");
export const MessageSquareTextIcon = makeIcon("icon-chat-bubble-text-square-mono");
export const UnderlineIcon = makeIcon("icon-underline-mono");
export const PenLineIcon = makeIcon("icon-line-pencil-mono");
export const PencilIcon = makeIcon("icon-pencil-mono");
export const QuestionIcon = makeIcon("icon-chat-bubble-question-mono");
export const ALargeSmallIcon = makeIcon("icon-text-mono");
export const LayersIcon = makeIcon("icon-filter-mono");
export const CircleCheckIcon = makeIcon("icon-check-circle-mono");
export const CircleAlertIcon = makeIcon("icon-exclamation-circle-mono");
export const SmileIcon = makeIcon("icon-emoji-mono");
export const SmilePlusIcon = makeIcon("icon-emoji-mono");
export const HouseIcon = makeIcon("home");
export const SearchIcon = makeIcon("search");
export function HeartIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
	return <TdsIcon name={filled ? "icon-heart-mono" : "icon-heart-whiteline-mono"} {...props} />;
}
