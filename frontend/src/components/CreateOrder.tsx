import { BaseInput, Button, Typography, Modal, DataTable, ColumnDataTable } from "mistui-kit";
import { useState, useRef } from "react";
import type { Product, CartItem } from './types';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithTimeout } from "../engine";
import { useSnackbar } from "notistack";

const API_URL = process.env.URL;


export default function CreateOrder() {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const ref = useRef<HTMLDialogElement>(null);
    const [customer, setCustomer] = useState("");
    const [contact, setContact] = useState("");
    const [items, setItems] = useState<CartItem[]>([]);


    // загрузка продуктов
    const { data: products = [] } = useQuery<Product[]>({
        queryKey: ["products"],
        queryFn: async () => {
            const res = await fetchWithTimeout(`${API_URL}/products`, {method: 'GET'});
            if (!res.ok) throw new Error("Ошибка загрузки продуктов");
            return res.json();
        },
    });
    const createOrder = useMutation({
        mutationFn: async () => {
            const orderData = {
                customer,
                contact,
                items: items.map(({ productId, quantity, price }) => ({
                    productId,
                    quantity,
                    price,
                })),
            };

            const res = await fetchWithTimeout(`${API_URL}/orders`, {
                method: "POST",
                body: JSON.stringify(orderData),
            });
            if (!res.ok) throw new Error("Ошибка создания заказа");
            return res.json();
        },
        onSuccess: () => {
            enqueueSnackbar("✅ Заказ успешно создан", { variant: "success" });
            setCustomer("");
            setContact("");
            setItems([]);
            queryClient.invalidateQueries({ queryKey: ["my-orders"] });
            ref.current?.close();
        },
        onError: () => enqueueSnackbar("❌ Ошибка при создании заказа", { variant: "error" }),
    });
    // добавить продукт в корзину
    const addToCart = (p: Product) => {
        setItems((prev) => {
            const exists = prev.find((i) => i.productId === p.id);

            if (exists) {
                return prev.map((i) =>
                    i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            } 
            else {
                return [
                    ...prev,
                    { productId: p.id, name: p.name, price: p.price, quantity: 1 },
                ];
            }
        });
    }
    // уменьшить количество или удалить
    const removeFromCart = (id: number) => {
        setItems((prev) =>
            prev
                .map((i) =>
                    i.productId === id ? { ...i, quantity: i.quantity - 1 } : i
                )
                .filter((i) => i.quantity > 0)
        );
    }

    // итоговая сумма
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    

    return (
        <>
            <Modal ref={ref}>
                <Typography variant="h6">
                    Создать заказ
                </Typography>

                <BaseInput
                    type="text"
                    value={customer}
                    onChange={setCustomer}
                    className="mt-2"
                    placeholder="Ваше имя"
                />
                <BaseInput
                    type="text"
                    value={contact}
                    onChange={setContact}
                    className="mt-1"
                    placeholder="Контакты"
                />

                {/* таблица продуктов */}
                <Typography variant="subtitle1" className="mt-4">
                    Каталог товаров:
                </Typography>
                <DataTable
                    value={products}
                    size="sm"
                >
                    <ColumnDataTable header="ID" field="id" />
                    <ColumnDataTable header="Название" field="name" />
                    <ColumnDataTable
                        sortable
                        header="Цена"
                        field="price"
                        body={(p: Product) => `${p.price} $`}
                    />
                    <ColumnDataTable
                        header="Действие"
                        body={(p: Product) => (
                            <Button
                                size="xs"
                                color="success"
                                onClick={() => addToCart(p)}
                            >
                                +
                            </Button>
                        )}
                    />
                </DataTable>

                {/* корзина */}
                <Typography variant="subtitle1" className="mt-4">
                    Ваш заказ:
                </Typography>
                <DataTable value={items} size="sm">
                    <ColumnDataTable header="Название" field="name" />
                    <ColumnDataTable header="Цена" field="price" body={(i: CartItem) => `${i.price} $`} />
                    <ColumnDataTable header="Кол-во" field="quantity" />
                    <ColumnDataTable
                        header="Действие"
                        body={(i: CartItem) => (
                            <Button size="xs" color="danger" onClick={() => removeFromCart(i.productId)}>
                                -
                            </Button>
                        )}
                    />
                </DataTable>

                <div className="flex justify-between items-center mt-4">
                    <Typography variant="subtitle1">
                        Итого: {total} $
                    </Typography>
                    <Button
                        color="primary"
                        onClick={() => createOrder.mutate()}
                        disabled={!customer || !contact || items.length === 0}
                    >
                        Создать заказ
                    </Button>
                </div>
            </Modal>

            <Button
                variant="outline"
                size="sm"
                color="success"
                className="ml-auto"
                onClick={() => ref.current?.showModal()}
            >
                + заказ
            </Button>
        </>
    );
}