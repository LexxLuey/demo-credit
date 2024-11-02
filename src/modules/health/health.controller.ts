import { Request, Response, Router } from 'express';

const healthRouter = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: API is healthy!
 */
healthRouter.get('/', (req: Request, res: Response) => {
    res.status(200).send({ message: 'API is healthy! 🔋' });
});

export default healthRouter;
