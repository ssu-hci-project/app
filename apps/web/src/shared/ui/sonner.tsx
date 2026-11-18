import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CircleAlertIcon, CircleCheckIcon } from "./tds-icon";

export function Toaster(props: ToasterProps) {
	return (
		<Sonner
			theme="system"
			icons={{
				success: <CircleCheckIcon className="size-6 text-secondary" />,
				error: <CircleAlertIcon className="size-6 text-toast-critical" />,
			}}
			toastOptions={{
				unstyled: true,
				classNames: {
					toast:
						"inset-x-0 mx-auto flex w-fit! max-w-[calc(100%-40px)] items-center gap-3 rounded-full bg-toast py-3.5 pr-[15px] pl-4 font-sans text-toast-foreground backdrop-blur-[15px]",
					icon: "flex size-6 shrink-0 items-center justify-center",
					content: "min-w-0",
					title: "text-t6 leading-[1.35] font-semibold break-keep",
					actionButton:
						"-my-1 ml-2 min-h-[31px] shrink-0 cursor-pointer rounded-full bg-toast-action px-3 text-t7 leading-[1.15] font-semibold text-toast-foreground",
				},
			}}
			{...props}
		/>
	);
}
