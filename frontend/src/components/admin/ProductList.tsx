import { useQuery } from "@tanstack/react-query";
import { fetchWithTimeout } from "../../engine";
import { DataTable, ColumnDataTable, Card, Typography } from "mistui-kit";
import CreateProductModal from "./CreateProductModal";

const API_URL = process.env.URL;


export default function ProductList() {
    const { data: products = [], isLoading } = useQuery({
        queryKey: ["products"],
        queryFn: async () => {
            const res = await fetchWithTimeout(`${API_URL}/products`);
            return res.json();
        },
    });

    if (isLoading) return <p>Загрузка продуктов...</p>;


    return (
        <div className="h-full">
            <DataTable
                value={products}
                header={
                    <Typography variant="subtitle1" color="gray">
                        products:
                    </Typography>
                }
                footer={
                    <CreateProductModal />
                }
                size="sm"
            >
                <ColumnDataTable header="ID" field="id" />
                <ColumnDataTable header="Название" field="name" sortable />
                <ColumnDataTable 
                    sortable
                    header="Цена" 
                    field="price" 
                    body={(p) => `${p.price} $`}   
                />
                <ColumnDataTable header="Категория" field="category" />
                <ColumnDataTable 
                    header="Доступен" 
                    field="available" 
                    body={(p) => (p.available ? "✅" : "❌")} 
                />
            </DataTable>
        </div>
    );
}