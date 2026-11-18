import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "@/shared/lib/cn";

function Slider({
	className,
	defaultValue,
	value,
	min = 0,
	max = 100,
	...props
}: SliderPrimitive.Root.Props) {
	const _values = Array.isArray(value)
		? value
		: Array.isArray(defaultValue)
			? defaultValue
			: [min, max];

	return (
		<SliderPrimitive.Root
			className={cn("data-horizontal:w-full data-vertical:h-full", className)}
			data-slot="slider"
			defaultValue={defaultValue}
			value={value}
			min={min}
			max={max}
			thumbAlignment="edge"
			{...props}
		>
			<SliderPrimitive.Control className="relative flex w-full touch-none items-center py-[18.5px] select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
				<SliderPrimitive.Track
					data-slot="slider-track"
					className="relative grow overflow-hidden rounded-[2.5px] bg-progress-track select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
				>
					<SliderPrimitive.Indicator
						data-slot="slider-range"
						className="rounded-[2.5px] bg-primary select-none data-horizontal:h-full data-vertical:w-full"
					/>
				</SliderPrimitive.Track>
				{Array.from({ length: _values.length }, (_, index) => (
					<SliderPrimitive.Thumb
						data-slot="slider-thumb"
						// biome-ignore lint/suspicious/noArrayIndexKey: one thumb per value, in order.
						key={index}
						className="relative block size-[26px] shrink-0 rounded-full border border-[rgb(0_29_58/18%)] bg-white shadow-[0_4px_8px_rgb(0_29_58/18%),0_2px_4px_rgb(0_29_58/18%)] ring-ring/50 transition-[box-shadow] select-none after:absolute after:-inset-2.5 focus-visible:ring-3 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
					/>
				))}
			</SliderPrimitive.Control>
		</SliderPrimitive.Root>
	);
}

export { Slider };
