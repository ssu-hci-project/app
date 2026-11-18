import { cn } from "@/shared/lib";
import greenHeart from "./assets/tds-reaction-green-heart.svg";
import idea from "./assets/tds-reaction-idea.svg";
import laugh from "./assets/tds-reaction-laugh.svg";
import redHeart from "./assets/tds-reaction-red-heart.svg";
import sad from "./assets/tds-reaction-sad.svg";
import seedling from "./assets/tds-reaction-seedling.svg";
import surprised from "./assets/tds-reaction-surprised.svg";
import thumbsUp from "./assets/tds-reaction-thumbs-up.svg";

const reactions: Record<string, { src: string; label: string }> = {
	"❤️": { src: redHeart, label: "공감해요" },
	"💚": { src: greenHeart, label: "마음에 남아요" },
	"👍": { src: thumbsUp, label: "좋아요" },
	"😢": { src: sad, label: "슬퍼요" },
	"😮": { src: surprised, label: "놀라워요" },
	"😂": { src: laugh, label: "재미있어요" },
	"💡": { src: idea, label: "새로운 생각이에요" },
	"🌱": { src: seedling, label: "성장해요" },
};

/** The same TDS artwork in the picker, passage markers, cards and reaction counts. */
export function ReactionEmoji({
	emoji,
	className,
	decorative = false,
}: {
	emoji: string;
	className?: string;
	decorative?: boolean;
}) {
	const reaction = reactions[emoji];
	return (
		<span
			data-slot="reaction-emoji"
			className={cn("relative inline-block size-6 shrink-0 align-middle", className)}
		>
			{reaction ? (
				<img
					src={reaction.src}
					alt={decorative ? "" : reaction.label}
					className="absolute inset-0 block size-full"
				/>
			) : (
				emoji
			)}
		</span>
	);
}
