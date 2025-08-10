// src/modules/users/user.controller.ts
import axios from 'axios';
import dotenv from 'dotenv';
import { Request, Response, Router, NextFunction } from 'express';
import { UserService } from './user.service';
import { validateUserOnboarding } from './user.validators';
import { validationResult } from 'express-validator';
import { asyncHandler } from '../../middleware/errorHandler';
import logger from '../../utils/logger';

const userRouter = Router();

// GET /users - Get all users with search and pagination
userRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search } = req.query;
    const users = await UserService.getAllUsers(
        parseInt(page as string),
        parseInt(limit as string),
        search as string
    );
    res.status(200).json(users);
}));

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieves a paginated and searchable list of all users in the system
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *           example: 1
 *           description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *           example: 10
 *           description: The number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: "john"
 *           description: Search term to filter users by first name, last name, email, or middle name
 *     responses:
 *       200:
 *         description: Paginated list of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "123e4567-e89b-12d3-a456-426614174000"
 *                       first_name:
 *                         type: string
 *                         example: "John"
 *                       middle_name:
 *                         type: string
 *                         example: "Michael"
 *                       last_name:
 *                         type: string
 *                         example: "Doe"
 *                       email:
 *                         type: string
 *                         example: "john.doe@example.com"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00.000Z"
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00.000Z"
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 25
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 *   post:
 *     summary: Onboard a new user
 *     description: Creates a new user if they are not blacklisted
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: "John"
 *                 description: User's first name
 *               middle_name:
 *                 type: string
 *                 example: "Michael"
 *                 description: User's middle name (optional)
 *               last_name:
 *                 type: string
 *                 example: "Doe"
 *                 description: User's last name
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *                 description: User's email address
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 first_name:
 *                   type: string
 *                   example: "John"
 *                 middle_name:
 *                   type: string
 *                   example: "Michael"
 *                 last_name:
 *                   type: string
 *                   example: "Doe"
 *                 email:
 *                   type: string
 *                   example: "john.doe@example.com"
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request or user is blacklisted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User is blacklisted"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "email"
 *                       message:
 *                         type: string
 *                         example: "Email is required"
 */
userRouter.post('/', validateUserOnboarding, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { first_name, middle_name, last_name, email } = req.body;
    
    const user = await UserService.onboardUser(first_name, last_name, email, middle_name);
    res.status(201).json(user);
}));

export default userRouter;
