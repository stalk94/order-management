import "./style.css";
import { ThemeProvider, SnackbarProvider, Drawer, Modal, Button } from 'mistui-kit';
import React from 'react';
import ReactDOM from "react-dom/client";
import AuthProvider from "./hooks/AuthProvider";
import Application from './App';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


const queryClient = new QueryClient();


const App = () => {
    return (
        <React.StrictMode>
            <AuthProvider>
                <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <SnackbarProvider
                        maxSnack={3}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        autoHideDuration={4000}
                        preventDuplicate
                    >
                        <Application />
                    </SnackbarProvider>
                </ThemeProvider>
                </QueryClientProvider>
            </AuthProvider>
        </React.StrictMode>
    );
}


//------------------------------------------------------------------------
const container = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(container);
root.render(<App />);