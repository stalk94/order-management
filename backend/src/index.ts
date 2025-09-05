import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcrypt';
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthRequest } from "./middleware.js";

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);
const PORT = 4000;

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3001",        // фронт
        credentials: true
    },
});


app.use(cors({
    origin: "http://localhost:3001",        // фронт
    credentials: true
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());


// ----------------------[API]--------------------------------------
app.post("/login", async (req, res) => {
    const { login, password } = req.body;
    const user = await prisma.user.findUnique({ where: { login } });
    if (!user) return res.status(401).json({ error: "Invalid login" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "supersecret", {
        expiresIn: "7d",
    });

    res.cookie("token", token, {
        httpOnly: true,
        secure: false, // true в проде
        sameSite: "lax",
    });

    // 🔥 сразу возвращаем user, чтобы фронт мог обновить state
    res.json({ success: true, user: { id: user.id, login: user.login, role: user.role } });
});
app.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
});
app.post("/register", async (req, res) => {
    const { login, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { login } });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { login, password: hash, role: "USER" },
    });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "supersecret", {
        expiresIn: "7d",
    });

    res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    });

    // 🔥 возвращаем user
    res.json({ success: true, 
        user: { 
            id: user.id, 
            login: user.login, 
            role: user.role 
        }
    });
});
app.get("/me", authMiddleware, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    res.json({ user: req.user });
});
app.get("/orders/my", authMiddleware, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const orders = await prisma.order.findMany({
        where: { userId: req.user.id },
        include: {
            items: {
                include: { product: true },
            },
        },
    });

    res.json(orders);
});
app.get("/orders", authMiddleware, async (req: AuthRequest, res) => {
    if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
    }

    const orders = await prisma.order.findMany({ include: { items: true, user: true } });
    res.json(orders);
});
app.post("/orders", authMiddleware, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const { customer, contact, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Нет позиций в заказе" });
    }

    // Загружаем все продукты, которые заказаны
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
    });

    // Считаем total и формируем позиции заказа
    const orderItems = items.map((i: any) => {
        const product = products.find((p) => p.id === i.productId);
        if (!product) throw new Error(`Продукт с id=${i.productId} не найден`);

        return {
            productId: product.id,
            quantity: i.quantity,
            price: product.price,
            note: i.note,
        };
    });

    const total = orderItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
    );

    const order = await prisma.order.create({
        data: {
            customer,
            contact,
            status: "new",
            total,
            userId: req.user.id,
            items: {
                create: orderItems,
            },
        },
        include: {
            items: { include: { product: true } },
        },
    });

    io.emit("orderCreated", order);
    res.json(order);
});
app.patch("/orders/:id/status", authMiddleware, async (req: AuthRequest, res) => {
    if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
    }

    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.update({
        where: { id: Number(id) },
        data: { status },
        include: { items: true },
    });

    
    // 🔹 оповестим всех
    io.emit("orderUpdated", order);
    // 🔹 оповестим конкретного клиента
    io.to(`user:${order.userId}`).emit("myOrderUpdated", order);

    res.json(order);
});

// отмена заказа
app.patch("/orders/:id/cancel", authMiddleware, async (req: AuthRequest, res) => {
    const { id } = req.params;

    const order = await prisma.order.update({
        where: { id: Number(id) },
        data: { status: "cancelled" },
        include: { items: true },
    });

    io.emit("orderCanceled", order);
    io.to(`user:${order.userId}`).emit("myOrderUpdated", order);

    res.json(order);
});
app.patch("/orders/:id/cancel", authMiddleware, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const orderId = parseInt(req.params.id);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // 🔹 Проверка: клиент может отменить только свой заказ
    if (req.user.role !== "ADMIN" && order.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
    }

    // 🔹 Проверка: нельзя отменить завершённые/отменённые
    if (order.status === "completed" || order.status === "cancelled") {
        return res.status(400).json({ error: "Order already finished" });
    }

    const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: "cancelled" },
        include: { items: true },
    });

    io.emit("orderCanceled", updated);
    res.json(updated);
});
app.delete("/orders/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;

    const order = await prisma.order.update({
        where: { id: Number(id) },
        data: { status: "canceled" },
        include: { items: true },
    });

    io.emit("orderCanceled", order); // 🔥 уведомляем всех клиентов
    res.json(order);
});

app.get("/products", async (_req, res) => {
    const products = await prisma.product.findMany();
    res.json(products);
});
app.post("/products", authMiddleware, async (req: AuthRequest, res) => {
    if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
    }

    const { name, price, category, available } = req.body;
    const product = await prisma.product.create({
        data: { name, price, category, available },
    });

    res.json(product);
});
app.post("/products", authMiddleware, async (req: AuthRequest, res) => {
    if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
    }

    const { name, price, category, available } = req.body;
    if (!name || !price) {
        return res.status(400).json({ error: "Name and price are required" });
    }

    const product = await prisma.product.create({
        data: {
            name,
            price,
            category,
            available: available ?? true,
        },
    });

    res.json(product);
});


// 🔹 WebSocket
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("registerUser", (userId: number) => {
        socket.join(`user:${userId}`);
    });
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

httpServer.listen(PORT, () => {
    console.log(`🚀 Backend running at http://localhost:${PORT}`);
});