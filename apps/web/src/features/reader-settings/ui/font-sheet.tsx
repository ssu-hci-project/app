import {
	BottomSheet,
	BottomSheetBody,
	BottomSheetContent,
	BottomSheetFooter,
	Button,
	Segmented,
	Slider,
} from "@/shared/ui";
import { type ReaderFont, useReaderSettings } from "../model/reader-settings";

/** Text size, line spacing and typeface. Changes apply to the page immediately. */
export function FontSheet({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { size, leading, font, setSize, setLeading, setFont } = useReaderSettings();
	return (
		<BottomSheet open={open} onOpenChange={onOpenChange}>
			<BottomSheetContent title="글자 설정" description="읽기 편한 크기로 맞춰보세요.">
				<BottomSheetBody withFooter className="flex flex-col gap-6">
					<div className="flex flex-col gap-3">
						<div className="flex items-center justify-between text-sm font-semibold">
							<span id="reader-size-label">글자 크기</span>
							<span className="tabular-nums">{size}px</span>
						</div>
						<div className="flex items-center gap-4">
							<span aria-hidden="true" className="font-serif text-[13px]">
								가
							</span>
							<Slider
								aria-labelledby="reader-size-label"
								min={14}
								max={26}
								step={1}
								value={[size]}
								onValueChange={(value) =>
									setSize(Array.isArray(value) ? (value[0] ?? size) : value)
								}
								className="py-3"
							/>
							<span aria-hidden="true" className="font-serif text-[22px]">
								가
							</span>
						</div>
					</div>
					<div className="flex flex-col gap-3">
						<span className="text-sm font-semibold">줄 간격</span>
						<Segmented
							label="줄 간격"
							value={leading}
							onValueChange={setLeading}
							options={[
								{ value: 1.6, label: "좁게" },
								{ value: 1.8, label: "보통" },
								{ value: 2.1, label: "넓게" },
							]}
						/>
					</div>
					<div className="flex flex-col gap-3">
						<span className="text-sm font-semibold">글꼴</span>
						<Segmented<ReaderFont>
							label="글꼴"
							value={font}
							onValueChange={setFont}
							options={[
								{ value: "serif", label: "명조", className: "font-serif" },
								{ value: "sans", label: "고딕", className: "font-sans" },
							]}
						/>
					</div>
				</BottomSheetBody>
				<BottomSheetFooter>
					<Button size="lg" onClick={() => onOpenChange(false)}>
						완료
					</Button>
				</BottomSheetFooter>
			</BottomSheetContent>
		</BottomSheet>
	);
}
