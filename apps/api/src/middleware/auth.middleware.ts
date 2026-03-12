import type { NextFunction, Request, Response } from "express";

import { verifyToken } from "../lib/jwt";
import { ApiError } from "../utils/api-error";

export const requireAuth = (request: Request, _response: Response, next: NextFunction) => {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authorization token is required."));
  }

  try {
    request.user = verifyToken(authorization.replace("Bearer ", ""));
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired authorization token."));
  }
};
