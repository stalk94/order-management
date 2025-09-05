import { Button, DataTable, ColumnDataTable, Select } from "mistui-kit";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GiConfirmed } from "react-icons/gi";
import { MdOutlineCancel } from "react-icons/md";
import { useEffect, useState } from "react";
import { fetchWithTimeout, socket } from "../../engine";
import { Order, STATUSES } from "../types";


const API_URL = process.env.URL;


export default function Orders() {
    const queryClient = useQueryClient();


    // загрузка заказов
    const { data: orders = [], isLoading, isError } = useQuery<Order[]>({
        queryKey: ["orders"],
        queryFn: async () => {
            const res = await fetchWithTimeout(`${API_URL}/orders`);
            if (!res.ok) throw new Error("Ошибка загрузки заказов");
            return res.json();
        },
    });
    // обновление статуса
    const updateStatus = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const res = await fetchWithTimeout(`${API_URL}/orders/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Ошибка обновления");
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
    });
    // отмена заказа
    const cancelOrder = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetchWithTimeout(`${API_URL}/orders/${id}/cancel`, {
                method: "PATCH",
            });
            if (!res.ok) throw new Error("Ошибка отмены");
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
    });
    useEffect(() => {
        socket.on("orderCreated", () => queryClient.invalidateQueries({ queryKey: ["orders"] }));
        socket.on("orderUpdated", () => queryClient.invalidateQueries({ queryKey: ["orders"] }));
        socket.on("orderCanceled", () => queryClient.invalidateQueries({ queryKey: ["orders"] }));

        return () => {
            socket.off("orderCreated");
            socket.off("orderUpdated");
            socket.off("orderCanceled");
        };
    }, [queryClient]);


    if (isLoading) return <p>Загрузка заказов...</p>;
    if (isError) return <p>Ошибка загрузки</p>;


    return (
        <DataTable
            value={orders}
            size="sm"
            emptyMessage={
                <div className="flex">
                    <div className="m-auto">
                        Нет заказов
                    </div>
                </div>
            }
        >
            <ColumnDataTable header="ID" field="id" sortable />
            <ColumnDataTable 
                header="Статус" 
                field="status" 
                sortable
                body={(order) =>
                    <span
                        className={`px-2 py-1 rounded`}
                        style={{ color: STATUSES[order.status] }}
                    >
                        {order.status}
                    </span>
                }
            />
            <ColumnDataTable header="Контакт" field="contact" />
            <ColumnDataTable 
                header="Сумма" 
                field="total" 
                body={(o) => `${o.total} $`} 
                sortable 
            />
            <ColumnDataTable
                header="Создан"
                field="createdAt"
                body={(o) => new Date(o.createdAt).toLocaleString()}
                sortable
            />
            <ColumnDataTable
                header="Действия"
                body={(o: Order) => (
                    <div className="flex gap-2">
                        <Select
                            size="sm" 
                            color="primary"
                            className='w-30'
                            items={Object.keys(STATUSES)}
                            value={o.status}
                            onChange={(opt) => {
                                if (opt) {
                                    updateStatus.mutate({ id: o.id, status: opt });
                                }
                            }}
                        />
                        <Button
                            size="sm" 
                            color="error" 
                            onClick={() => cancelOrder.mutate(o.id)}
                        >
                            Отменить
                        </Button>
                    </div>
                )}
            />
        </DataTable>
    );
}