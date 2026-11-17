import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/shared/api";

/** My name and colour; both null until I leave my first trace. */
export function useProfile() {
	return useQuery(orpc.profile.get.queryOptions());
}
