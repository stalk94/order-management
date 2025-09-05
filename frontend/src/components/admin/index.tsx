import { useEffect, useState } from "react";
import { Button, DataTable, ColumnDataTable, GroupButton } from "mistui-kit";
import Products from './ProductList';
import Orders from "./Orders";
import { useAuth } from "../../hooks/useAuth";
import { useSnackbar } from "notistack";


// category admin dirs
const CATEGORY = {
    orders: <Orders />,
    products: <Products />
}


export default function AdminPanel() {
    const { enqueueSnackbar } = useSnackbar();
    const [category, setCategory] = useState<'orders' | 'products'>('orders');


    return(
        <div className="h-full w-full flex">
            <section className="flex flex-col w-1/8 p-2 bg-[#00000015]">
                { Object.entries(CATEGORY).map(([key, val])=> 
                    <div 
                        key={key} 
                        className="w-full hover:opacity-50 cursor-pointer"
                        onClick={()=> setCategory(key)}
                        style={{
                            color: category === key ? 'orange' : 'silver',
                        }}
                    >
                        • { key }
                    </div>
                )}
            </section>
            <section className="flex-1">
                { CATEGORY[category] }
            </section>
        </div>
    );
}