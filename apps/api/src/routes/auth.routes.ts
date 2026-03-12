import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";

const router = Router();

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

router.post(
  "/signup",
  asyncHandler(async (request, response) => {
    const payload = authSchema.parse(request.body);
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() }
    });

    if (existingUser) {
      throw new ApiError(409, "An account already exists for this email.");
    }

    const password = await bcrypt.hash(payload.password, 12);
    const user = await prisma.user.create({
      data: {
        email: payload.email.toLowerCase(),
        password
      }
    });

    response.status(201).json({
      token: signToken({ userId: user.id, email: user.email }),
      user: {
        id: user.id,
        email: user.email
      }
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (request, response) => {
    const payload = authSchema.parse(request.body);
    const user = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() }
    });

    if (!user) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const isValid = await bcrypt.compare(payload.password, user.password);

    if (!isValid) {
      throw new ApiError(401, "Invalid email or password.");
    }

    response.json({
      token: signToken({ userId: user.id, email: user.email }),
      user: {
        id: user.id,
        email: user.email
      }
    });
  })
);

export default router;
