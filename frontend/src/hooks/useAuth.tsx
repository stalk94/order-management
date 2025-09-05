import { createContext, useContext } from "react";


export type User = {
    id: number;
    login: string;
    role: string;
}
type AuthContextType = {
    user: User | null;
    loading: boolean;
    login: (login: string, password: string) => Promise<boolean>;
    register: (login: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}


export const AuthContext = createContext<AuthContextType | null>(null);


export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}