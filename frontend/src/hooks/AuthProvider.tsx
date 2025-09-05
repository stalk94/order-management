import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchWithTimeout, socket } from "../engine";
import { AuthContext, User } from "./useAuth";


const API_URL = process.env.URL;


export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    
    async function login(login: string, password: string) {
        const res = await fetchWithTimeout(`${API_URL}/login`, {
            method: "POST",
            body: JSON.stringify({ login, password }),
        });

        if (res.ok) {
            const data = await res.json();
            if (data.user) setUser(data.user);
            else await refresh();
            return true;
        }
        return false;
    }
    async function register(login: string, password: string) {
        const res = await fetchWithTimeout(`${API_URL}/register`, {
            method: "POST",
            body: JSON.stringify({ login, password }),
        });

        if (res.ok) {
            const data = await res.json();
            if (data.user) setUser(data.user);
            else await refresh();
            return true;
        }
        return false;
    }
    async function logout() {
        await fetchWithTimeout(`${API_URL}/logout`, { method: "POST" });
        setUser(null);
    }
    async function refresh() {
        try {
            const res = await fetchWithTimeout(`${API_URL}/me`);
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                return data.user;
            } 
            else {
                setUser(null);
                return null;
            }
        } 
        catch {
            setUser(null);
            return null;
        } 
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        refresh();
    }, []);


    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                refresh
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}