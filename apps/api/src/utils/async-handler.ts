import type { NextFunction, Request, Response } from "express";

export const asyncHandler =
  (
    fn: (request: Request, response: Response, next: NextFunction) => Promise<unknown>
  ) =>
  (request: Request, response: Response, next: NextFunction) => {
    Promise.resolve(fn(request, response, next)).catch(next);
  };
