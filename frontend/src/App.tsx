import LoginForm from './components/AuthForm';
import { useAuth } from "./hooks/useAuth";
import { Button, Avatar } from 'mistui-kit';
import AdminPanel from "./components/admin";
import MyOrders from "./components/orders"; 
import { useEffect } from 'react';
import { socket } from "./engine";



export default function Application() {
    const { user, loading, logout } = useAuth();

    function getInitials(login: string): string {
        if (!login) return "";
        return login.substring(0, 2).toUpperCase();
    }
    useEffect(() => {
        if (user) {
            socket.emit("registerUser", user.id);
            console.log("🔗 зарегистрировал пользователя в комнате:", `user:${user.id}`);
        }
    }, [user]);


    if (loading) return <p>Загрузка...</p>;
    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex flex-col w-full h-full">
                {!user 
                    ? <LoginForm />
                    : (
                        <>
                            <div className="flex justify-between items-center bg-[#0000003b] p-1">
                                <div className='flex items-center'>
                                    <Avatar
                                        size='xs'
                                        variant='round'
                                        children={getInitials(user.login)}
                                    />
                                    <p className='ml-2'>
                                        <b>{user.login}</b>
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    color='error'
                                    onClick={logout}
                                >
                                    Выйти
                                </Button>
                            </div>

                            {user.role === "ADMIN" 
                                ? <AdminPanel /> 
                                : <MyOrders />
                            }
                        </>
                    )
                }
            </div>
        </div>
    );
}