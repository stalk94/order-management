import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";


export interface AuthRequest extends Request {
    user?: User;
}


export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "No token" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) return res.status(401).json({ error: "User not found" });

        req.user = user;
        next();
    } 
    catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}