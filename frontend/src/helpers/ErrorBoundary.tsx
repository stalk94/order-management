import React from "react";
const API_URL = process.env.URL;

type Props = {
    children: React.ReactNode;
}
type State = {
    hasError: boolean;
}


export default class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Caught by ErrorBoundary:", error, errorInfo);

        // отправка на сервер
        fetch(API_URL + "/client-error", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                userAgent: navigator.userAgent,
            }),
        });
    }

    render() {
        if (this.state.hasError) {
            return (<h1>Что-то пошло не так 😢</h1>);
        }
        return this.props.children;
    }
}