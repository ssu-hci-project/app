/** Draws a moving paper edge over a clipped, non-interactive copy of the previous page. */
export function animatePageTurn(
	layer: HTMLDivElement,
	columns: HTMLDivElement,
	forward: boolean,
	foldOrigin = 0.5,
): (() => void) | undefined {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	const width = layer.clientWidth;
	const height = layer.clientHeight;
	const viewport = columns.offsetParent;
	if (!width || !height || !viewport) return;

	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) return;
	const scale = Math.min(2, window.devicePixelRatio || 1);
	canvas.width = Math.ceil(width * scale);
	canvas.height = Math.ceil(height * scale);
	Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });
	ctx.scale(scale, scale);
	if (!forward) {
		ctx.translate(width, 0);
		ctx.scale(-1, 1);
	}

	const outgoing = document.createElement("div");
	outgoing.className = "absolute inset-0 overflow-hidden bg-paper";
	const copy = columns.cloneNode(true) as HTMLDivElement;
	const pageBox = viewport.getBoundingClientRect();
	const layerBox = layer.getBoundingClientRect();
	Object.assign(copy.style, {
		position: "absolute",
		left: `${pageBox.left - layerBox.left + columns.offsetLeft}px`,
		top: `${pageBox.top - layerBox.top + columns.offsetTop}px`,
	});
	outgoing.append(copy);
	layer.replaceChildren(outgoing, canvas);

	let frame = 0;
	const started = performance.now();
	const paper = getComputedStyle(outgoing).backgroundColor;
	const curve = Array.from({ length: 9 }, (_, index) => {
		const fraction = index / 8;
		const ratio =
			fraction <= 0.5
				? fraction * 2 * foldOrigin
				: foldOrigin + (fraction * 2 - 1) * (1 - foldOrigin);
		return { offset: Math.sin(Math.PI * fraction) - fraction * 0.7, y: ratio * height };
	});
	const stop = () => {
		cancelAnimationFrame(frame);
		outgoing.remove();
		canvas.remove();
	};
	const draw = (now: number) => {
		const progress = Math.min(1, Math.max(0, (now - started) / 380));
		if (progress === 1) return stop();
		const eased = progress * progress * (3 - 2 * progress);
		const curl = Math.sin(Math.PI * progress) * Math.min(width * 0.19, 90);
		const edge = width * (1 - eased) - curl * 0.4;
		const points = curve.map(({ offset, y }) => ({ x: edge + curl * offset, y }));
		const outerEdge = forward ? 0 : width;
		outgoing.style.clipPath = `polygon(${outerEdge}px 0px, ${points
			.map(({ x, y }) => `${forward ? x : width - x}px ${y}px`)
			.join(", ")}, ${outerEdge}px ${height}px)`;
		ctx.clearRect(0, 0, width, height);
		if (curl > 0) {
			const shade = ctx.createLinearGradient(edge - curl, 0, edge + curl * 2, 0);
			shade.addColorStop(0, "transparent");
			shade.addColorStop(0.45, "rgba(0, 0, 0, 0.20)");
			shade.addColorStop(1, "transparent");
			ctx.fillStyle = shade;
			ctx.fillRect(edge - curl, 0, curl * 3, height);

			ctx.beginPath();
			for (const { x, y } of points) ctx.lineTo(x, y);
			for (const { x, y } of points.slice().reverse()) {
				ctx.lineTo(x + curl * (0.65 + (0.6 * y) / height), y);
			}
			ctx.closePath();
			const fold = ctx.createLinearGradient(edge - curl * 0.7, 0, edge + curl * 2, 0);
			fold.addColorStop(0, "#0005");
			fold.addColorStop(0.36, paper);
			fold.addColorStop(0.65, paper);
			fold.addColorStop(1, "#0003");
			ctx.fillStyle = fold;
			ctx.fill();
		}
		frame = requestAnimationFrame(draw);
	};
	draw(started);
	return stop;
}
