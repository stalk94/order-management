import type { Request, Response, NextFunction } from "express";
import client from "prom-client";
import winston from "winston";
export const register = new client.Registry();


// счётчик запросов
const httpRequests = new client.Counter({
    name: "http_requests_total",
    help: "Количество HTTP-запросов",
    labelNames: ["method", "route", "status"],
});
// гистограмма времени ответа
const responseTime = new client.Histogram({
    name: "http_response_time_seconds",
    help: "Время ответа HTTP",
    labelNames: ["method", "route", "status"],
    buckets: [0.1, 0.3, 1, 3, 5],
});
// счетчик ошибок
const httpErrors = new client.Counter({
    name: "http_errors_total",
    help: "Количество ошибок HTTP",
    labelNames: ["method", "route", "status"],
});


// стандартные метрики Node.js (CPU, память, event-loop)
client.collectDefaultMetrics({ register });
register.registerMetric(httpRequests);
register.registerMetric(responseTime);
register.registerMetric(httpErrors);


// -----------------------------------------------------------[LOGGER]
export const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "log.log" }),
    ],
});

// -----------------------------------------------------------[express middleware]
export const logMetricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const end = responseTime.startTimer();

    res.on("finish", () => {
        httpRequests.inc({
            method: req.method,
            route: req.route ? req.route.path : req.path,
            status: res.statusCode,
        });

        end({ method: req.method, route: req.path, status: res.statusCode });

        logger.info(`${req.method} ${req.originalUrl} ${res.statusCode}`);
    });

    next();
}
export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(`Error: ${err.message}\n${err.stack}`);
    res.status(500).json({ error: "Internal Server Error" });
}
export const clientErrorHandler = (req: Request, res: Response) => {
    const { message, stack, userAgent } = req.body || {};

    httpErrors.inc({
        method: "CLIENT",
        route: req.path,
        status: 400, // условно ставим 400 как "клиентская ошибка"
    });

    logger.error(
        `📩 ClientError: ${message}\nStack: ${stack}\nUserAgent: ${userAgent}`
    );

    res.status(200).json({ status: "received" });
}
// -----------------------------------------------------------[process error]
process.on("uncaughtException", (err) => {
    logger.error(`❌ uncaughtException: ${err.message}\n${err.stack}`);
    // здесь можно сделать graceful shutdown или перезапуск
});

// глобальный перехват необработанных промисов
process.on("unhandledRejection", (reason, promise) => {
    logger.error(`❌ unhandledRejection: ${reason}`);
});