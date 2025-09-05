import { io } from "socket.io-client";

export const socket = io(process.env.URL);


// helper fetch
export async function fetchWithTimeout(
    url: string,
    opts: RequestInit = {},
    timeout = 5000
) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        return await fetch(url, {
            ...opts,
            signal: controller.signal,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(opts.headers || {}),
            },
        });
    } 
    finally {
        clearTimeout(id);
    }
}