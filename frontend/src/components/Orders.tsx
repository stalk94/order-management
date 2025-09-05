import { DataTable, ColumnDataTable, Typography, Button } from "mistui-kit";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { fetchWithTimeout, socket } from "../engine";
import { Order, CartItem, STATUSES } from "./types";
import CreateOrder from "./CreateOrder";
import { TiShoppingCart } from "react-icons/ti";
import { useEffect } from "react";

const API_URL = process.env.URL;



export default function MyOrders() {
    const queryClient = useQueryClient();
    const { data: orders = [], isLoading, isError } = useQuery<Order[]>({
        queryKey: ["my-orders"],
        queryFn: async () => {
            const res = await fetchWithTimeout(`${API_URL}/orders/my`);
            if (!res.ok) throw new Error("Ошибка загрузки заказов");
            return res.json();
        },
    });

    const cancelOrder = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetchWithTimeout(`${API_URL}/orders/${id}/cancel`, {
                method: "PATCH",
            });
            if (!res.ok) throw new Error("Ошибка отмены");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["my-orders"] });
        },
    });
    useEffect(()=> {
        socket.on("myOrderUpdated", (order: Order) => {
            console.log(order)
            queryClient.invalidateQueries({ queryKey: ["my-orders"] })
        });

        return () => {
            socket.off("myOrderUpdated");
        };
    }, []);


    if (isLoading) return <p>Загрузка...</p>;
    if (isError) return <p>Ошибка загрузки заказов</p>;
   
    

    return (
        <div className="h-full">
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
                header={
                    <Typography variant="subtitle1" color="gray">
                        my orders:
                    </Typography>
                }
                footer={
                    <CreateOrder />
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
                            style={{color: STATUSES[order.status]}}
                        >
                            { order.status }
                        </span>
                    }
                />
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
                    header=""
                    body={(o: Order) =>
                        (o.status !== "completed" && o.status !== "cancelled") ? (
                            <div className="flex">
                                <Button
                                    size='sm'
                                    className="mr-1"
                                    color='info'
                                    variant="link"
                                    onClick={() => console.log(o.items)}
                                >
                                    <TiShoppingCart />
                                </Button>
                                <Button
                                    size="sm"
                                    color="error"
                                    onClick={() => cancelOrder.mutate(o.id)}
                                >
                                    Отменить
                                </Button>
                            </div>
                        ) : null
                    }
                />
            </DataTable>
        </div>
    );
}