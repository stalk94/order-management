import { Modal, Card, Typography, BaseInput, Button, SwitchBox, NumberInput } from "mistui-kit";
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { fetchWithTimeout } from "../../engine";

const API_URL = process.env.URL;


export default function CreateProductModal() {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const ref = useRef<HTMLDialogElement>(null);
    const [name, setName] = useState("");
    const [price, setPrice] = useState(0);
    const [category, setCategory] = useState("");
    const [available, setAvailable] = useState(true);

    const createProduct = useMutation({
        mutationFn: async () => {
            const res = await fetchWithTimeout(`${API_URL}/products`, {
                method: "POST",
                body: JSON.stringify({
                    name,
                    price: parseFloat(price),
                    category,
                    available,
                }),
            });
            if (!res.ok) throw new Error("Ошибка создания продукта");
            return res.json();
        },
        onSuccess: () => {
            enqueueSnackbar("✅ Продукт создан", { variant: "success" });
            setName("");
            setPrice("");
            setCategory("");
            setAvailable(true);
            queryClient.invalidateQueries({ queryKey: ["products"] });
            ref.current?.close();
        },
        onError: () => enqueueSnackbar("❌ Ошибка при создании продукта", { variant: "error" }),
    });


    return (
        <>
            <Modal ref={ref}>
                <Typography variant="h6">
                    Создать продукт
                </Typography>

                <BaseInput
                    type="text"
                    color="primary"
                    className='mt-2'
                    placeholder="Название"
                    labelLeft={'🏷️'}
                    value={name}
                    onChange={setName}
                />
                <NumberInput
                    placeholder="Цена"
                    color="primary"
                    className='mt-1'
                    labelLeft={'💵'}
                    value={price}
                    onChange={setPrice}
                />
                <BaseInput
                    type="text"
                    placeholder="Категория"
                    color="primary"
                    className='mt-1'
                    labelLeft={'🗃️'}
                    value={category}
                    onChange={setCategory}
                />

                <div className="flex items-center gap-2 mt-2">
                    <SwitchBox
                        className='mt-2'
                        value={available}
                        onChange={setAvailable}
                    />
                    <span>{available ? "Доступен" : "Недоступен"}</span>
                </div>

                <Button
                    color="secondary"
                    fullWidth
                    className="mt-4"
                    onClick={() => createProduct.mutate()}
                    disabled={!name || !price}
                >
                    Создать
                </Button>
            </Modal>

            <Button
                variant="outline"
                size="sm"
                color="warning"
                className="ml-auto"
                onClick={() => ref.current?.showModal()}
            >
                + продукт
            </Button>
        </>
    );
}