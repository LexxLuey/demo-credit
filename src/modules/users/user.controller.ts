// src/modules/users/user.controller.ts

import { Request, Response, Router } from 'express';
import { UserService } from './user.service';

const userRouter = Router();

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Onboard a new user
 *     description: Creates a new user if they are not blacklisted
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               middle_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request or user is blacklisted
 */
userRouter.post('/', async (req: Request, res: Response) => {
    const { first_name, middle_name, last_name, email } = req.body;

    try {
        const user = await UserService.onboardUser(first_name, last_name, email, middle_name);
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: error });
    }
});

export default userRouter;
