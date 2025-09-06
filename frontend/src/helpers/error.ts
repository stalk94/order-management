const API_URL = process.env.URL;

function sendClientError(payload: Record<string, any>) {
    fetch(API_URL + "/client-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}


// глобальные JS ошибки
window.onerror = function (message, source, lineno, colno, error) {
    source = source.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, "");
    let position = `${lineno}:${colno}`;

    sendClientError({
        type: "window.onerror",
        message,
        source,
        position,
        stack: error?.stack,
        userAgent: navigator.userAgent,
    });
};

// необработанные промисы
window.onunhandledrejection = function (event) {
    sendClientError({
        type: "unhandledrejection",
        message: event.reason?.message || "Unhandled rejection",
        stack: event.reason?.stack,
        userAgent: navigator.userAgent,
    });
};