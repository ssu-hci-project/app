import axios from "axios";
import { env } from "@/shared/config";

export const apiClient = axios.create({
	baseURL: env.VITE_API_BASE_URL,
	timeout: 10_000,
});

apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (axios.isAxiosError(error)) {
			// Centralize cross-cutting error handling (e.g. auth redirect, toast) here
			// so feature code never has to special-case network failures itself.
		}
		return Promise.reject(error);
	},
);
