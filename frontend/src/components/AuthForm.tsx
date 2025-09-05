import React, { useCallback } from 'react';
import { useAuth } from "../hooks/useAuth";
import { Divider, GroupButton, Button, BaseInput, PasswordInput } from "mistui-kit";



export default function LoginForm() {
    const [pass, setPass] = React.useState("");
    const [login, setLogin] = React.useState("");
    const [mod, setMod] = React.useState<"auth" | "reg">("auth");
    const [error, setError] = React.useState<string | undefined>();
    const { login: doLogin, register: doRegister } = useAuth();


    const handleAuth = useCallback(async () => {
        if (pass.length < 6) {
            setError("Минимум 6 символов");
            return;
        }
        if (!login) {
            setError("Введите логин");
            return;
        }
        setError(undefined);

        const ok =
            mod === "auth"
                ? await doLogin(login, pass)
                : await doRegister(login, pass);

        if (!ok) {
            setError("Ошибка авторизации");
        }
    }, [pass, login, mod]);


    return (
        <div className="flex flex-col gap-2 justify-center p-4 bg-[#8d8c8c2a] w-70 shadow-md rounded-md backdrop-blur-xl m-auto">
            <div className="my-2">
                <Divider children={`or ${mod === "auth" ? "sign-in" : "sign-up"} login`} />
            </div>
            <GroupButton
                className="mb-1"
                size="sm"
                value={{ id: mod }}
                onChange={(select) => setMod(select.id as "auth" | "reg")}
                items={[
                    { id: "auth", label: "sign-in" },
                    { id: "reg", label: "sign-up" },
                ]}
            />
            <BaseInput
                color="primary"
                onChange={setLogin}
                labelLeft="@"
                placeholder="login"
                type="text"
                size="sm"
                required
            />
            <PasswordInput
                color="primary"
                onChange={setPass}
                labelLeft="ꄗ"
                required
                size="sm"
                placeholder="min 6 simbol"
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button
                size="sm"
                className="mt-4"
                variant="outline"
                disabled={!pass || !login}
                color={mod === "auth" ? "success" : "warning"}
                onClick={handleAuth}
            >
                {mod === "auth" ? "sign-in" : "sign-up"}
            </Button>
        </div>
    );
}