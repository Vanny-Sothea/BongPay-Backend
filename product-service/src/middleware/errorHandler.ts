import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";

interface AppError extends Error {
  status?: number
}

const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.stack)
    return res.status(err.status || 500).json({
        message : err.message ?? 'Internal server error'
    });
}

export default errorHandler;