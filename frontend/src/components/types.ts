export const STATUSES: Record<string, string> = {
    new: "gold",        // новый
    confirmed: "indigo",// подтвержден
    prepared: "purple", // готовится
    ready: "teal",      // готов
    completed: "green", // выполнен
    cancelled: "red",   // отменен
}


export type Order = {
    id: number
    customer: string
    contact: string
    status: keyof typeof STATUSES
    total: number
    createdAt: string
}

export type Product = {
    id: number
    name: string
    price: number
}

export type CartItem = {
    productId: number;
    name: string;
    price: number;
    quantity: number;
}