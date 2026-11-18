import { hashKey, type QueryClient, type QueryKey } from "@tanstack/react-query";

export type CachePatch = {
	key: QueryKey;
	update: (value: unknown, result?: unknown) => unknown;
};

/** Keep overlapping optimistic writes as layers so one failure cannot undo another write. */
export class OptimisticCache {
	private entries = new Map<
		string,
		{
			key: QueryKey;
			base: unknown;
			layers: Map<symbol, CachePatch["update"]>;
		}
	>();
	private pending = 0;

	constructor(private client: QueryClient) {}

	get isPending() {
		return this.pending > 0;
	}

	begin(patches: CachePatch[]) {
		const id = Symbol();
		this.pending++;
		for (const patch of patches) {
			const hash = hashKey(patch.key);
			let entry = this.entries.get(hash);
			if (!entry) {
				entry = { key: patch.key, base: this.client.getQueryData(patch.key), layers: new Map() };
				this.entries.set(hash, entry);
			}
			entry.layers.set(id, patch.update);
			this.render(entry);
		}
		let finished = false;
		return (success: boolean, result?: unknown) => {
			if (finished) return;
			finished = true;
			this.pending--;
			for (const patch of patches) {
				const hash = hashKey(patch.key);
				const entry = this.entries.get(hash);
				if (!entry) continue;
				if (success) entry.base = patch.update(entry.base, result);
				entry.layers.delete(id);
				this.render(entry);
				if (!entry.layers.size) this.entries.delete(hash);
			}
		};
	}

	private render(entry: {
		key: QueryKey;
		base: unknown;
		layers: Map<symbol, CachePatch["update"]>;
	}) {
		let value = entry.base;
		for (const update of entry.layers.values()) value = update(value);
		this.client.setQueryData(entry.key, value);
	}
}
