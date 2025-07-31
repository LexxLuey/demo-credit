// src/modules/wallet/wallet.controller.ts

import { Request, Response, Router } from 'express';
import { WalletService } from './wallet.service';
import { validateAmount } from './wallet.validators';
import { validationResult } from 'express-validator';

const walletRouter = Router();

/**
 * @swagger
 * /wallet:
 *   get:
 *     summary: Get all wallets
 *     description: Retrieves a paginated and searchable list of all wallets in the system
 *     tags:
 *       - Wallet
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
 *           description: The number of wallets per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: "john"
 *           description: Search term to filter wallets by user name, email, or wallet ID
 *     responses:
 *       200:
 *         description: Paginated list of wallets retrieved successfully
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
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                         example: "123e4567-e89b-12d3-a456-426614174000"
 *                       balance:
 *                         type: number
 *                         format: float
 *                         example: 1000.50
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
 */
walletRouter.get('/', async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const wallets = await WalletService.getAllWallets(
            parseInt(page as string),
            parseInt(limit as string),
            search as string
        );
        res.status(200).json(wallets);
    } catch (error: any) {
        console.error('Error fetching wallets:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /wallet:
 *   get:
 *     summary: Get all wallets
 *     description: Retrieves a paginated and searchable list of all wallets in the system
 *     tags:
 *       - Wallet
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
 *           description: The number of wallets per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: "john"
 *           description: Search term to filter wallets by user name, email, or wallet ID
 *     responses:
 *       200:
 *         description: Paginated list of wallets retrieved successfully
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
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                         example: "456e7890-e89b-12d3-a456-426614174001"
 *                       balance:
 *                         type: number
 *                         example: 1500.75
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00.000Z"
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:35:00.000Z"
 *                       user:
 *                         type: object
 *                         properties:
 *                           first_name:
 *                             type: string
 *                             example: "John"
 *                           last_name:
 *                             type: string
 *                             example: "Doe"
 *                           email:
 *                             type: string
 *                             example: "john.doe@example.com"
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
 */

/**
 * @swagger
 * /wallet/fund:
 *   post:
 *     summary: Fund a wallet
 *     description: Adds funds to the authenticated user's wallet.
 *     tags:
 *       - Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 1000.50
 *                 description: Amount to be added to the wallet
 *     responses:
 *       200:
 *         description: Wallet funded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 user_id:
 *                   type: string
 *                   format: uuid
 *                   example: "456e7890-e89b-12d3-a456-426614174001"
 *                 balance:
 *                   type: number
 *                   example: 1500.75
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:35:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Wallet funding successful"
 *       400:
 *         description: Bad request or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Amount must be greater than 0"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "amount"
 *                       message:
 *                         type: string
 *                         example: "Amount must be a positive number"
 *       401:
 *         description: User not authenticated or has no wallet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not authenticated"
 *       404:
 *         description: Wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Wallet not found"
 */
walletRouter.post('/fund', validateAmount, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return
    }
    const { amount } = req.body;
    const userId = req.authenticatedUser?.id;

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return
    }
    const walletId = req.authenticatedUser?.walletId;
    if (!walletId) {
        res.status(401).json({ message: 'User has no wallet' });
        return
    }

    try {
        const updatedWallet = await WalletService.fundWallet(walletId, amount);
        res.status(200).json(updatedWallet);
    } catch (error) {        
        res.status(400).json({ message: error instanceof Error ? error.message : 'Error Funding Wallet' });
    }
});


/**
 * @swagger
 * /wallet/transfer:
 *   post:
 *     summary: Transfer funds to another wallet
 *     description: Allows the authenticated user to transfer funds to another user's wallet.
 *     tags:
 *       - Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverWalletId
 *               - amount
 *             properties:
 *               receiverWalletId:
 *                 type: string
 *                 format: uuid
 *                 example: "789e0123-e89b-12d3-a456-426614174002"
 *                 description: The wallet ID of the receiving user
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 500.25
 *                 description: Amount to transfer
 *     responses:
 *       200:
 *         description: Transfer successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transfer successful"
 *                 amount:
 *                   type: number
 *                   example: 500.25
 *                 senderWalletId:
 *                   type: string
 *                   format: uuid
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 receiverWalletId:
 *                   type: string
 *                   format: uuid
 *                   example: "789e0123-e89b-12d3-a456-426614174002"
 *       400:
 *         description: Insufficient funds, invalid wallet, or self-transfer attempt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Insufficient funds"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "amount"
 *                       message:
 *                         type: string
 *                         example: "Amount must be greater than 0"
 *       401:
 *         description: User not authenticated or has no wallet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not authenticated"
 */
walletRouter.post('/transfer', validateAmount, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return
    }
    const { receiverWalletId, amount } = req.body;
    const userId = req.authenticatedUser?.id;

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return
    }
    const senderWalletId = req.authenticatedUser?.walletId;
    if (!senderWalletId) {
        res.status(401).json({ message: 'User has no wallet' });
        return
    }

    try {
        const transferResult = await WalletService.transferFunds(senderWalletId, receiverWalletId, amount);
        res.status(200).json(transferResult);
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : 'Transfer failed' });
    }
});


/**
 * @swagger
 * /wallet/withdraw:
 *   post:
 *     summary: Withdraw funds from a wallet
 *     description: Allows the authenticated user to withdraw funds from their wallet.
 *     tags:
 *       - Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 200.00
 *                 description: Amount to withdraw from the wallet
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Withdrawal successful"
 *                 walletId:
 *                   type: string
 *                   format: uuid
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 amount:
 *                   type: number
 *                   example: 200.00
 *       400:
 *         description: Insufficient funds or invalid wallet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Insufficient funds"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "amount"
 *                       message:
 *                         type: string
 *                         example: "Amount must be greater than 0"
 *       401:
 *         description: User not authenticated or has no wallet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not authenticated"
 */
walletRouter.post('/withdraw', validateAmount, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return
    }
    const { amount } = req.body;
    const userId = req.authenticatedUser?.id;

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return
    }
    const walletId = req.authenticatedUser?.walletId;
    if (!walletId) {
        res.status(401).json({ message: 'User has no wallet' });
        return
    }

    try {
        const withdrawalResult = await WalletService.withdrawFunds(walletId, amount);
        res.status(200).json(withdrawalResult);
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : 'Withdrawal failed' });
    }
});


/**
 * @swagger
 * /wallet/transactions:
 *   get:
 *     summary: Retrieve a wallet's transaction history
 *     description: Fetches a paginated list of transactions for the authenticated user's wallet.
 *     tags:
 *       - Wallet
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
 *           description: The number of transactions per page
 *     responses:
 *       200:
 *         description: A paginated list of transactions
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
 *                         example: "abc12345-e89b-12d3-a456-426614174000"
 *                       wallet_id:
 *                         type: string
 *                         format: uuid
 *                         example: "123e4567-e89b-12d3-a456-426614174000"
 *                       type:
 *                         type: string
 *                         enum: [FUND, TRANSFER, WITHDRAW]
 *                         example: "TRANSFER"
 *                       amount:
 *                         type: number
 *                         example: -500.25
 *                       target_wallet_id:
 *                         type: string
 *                         format: uuid
 *                         nullable: true
 *                         example: "789e0123-e89b-12d3-a456-426614174002"
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
 *       400:
 *         description: Invalid wallet ID or failure to retrieve transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve transactions"
 *       401:
 *         description: User not authenticated or has no wallet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not authenticated"
 */
walletRouter.get('/transactions', async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.authenticatedUser?.id;

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return
    }
    const walletId = req.authenticatedUser?.walletId;
    if (!walletId) {
        res.status(401).json({ message: 'User has no wallet' });
        return
    }

    try {
        const transactions = await WalletService.getTransactionHistory(
            walletId as string,
            parseInt(page as string),
            parseInt(limit as string)
        );
        res.status(200).json(transactions);
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to retrieve transactions' });
    }
});


/**
 * @swagger
 * /wallet/balance:
 *   get:
 *     summary: Check wallet balance
 *     description: Retrieves the current balance of the authenticated user's wallet.
 *     tags:
 *       - Wallet
 *     responses:
 *       200:
 *         description: The current balance of the wallet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 walletId:
 *                   type: string
 *                   format: uuid
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                   description: Wallet ID of the authenticated user
 *                 balance:
 *                   type: number
 *                   example: 1500.75
 *                   description: Current balance of the wallet
 *       400:
 *         description: Invalid wallet ID or failure to retrieve balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve balance"
 *       401:
 *         description: User not authenticated or has no wallet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not authenticated"
 */
walletRouter.get('/balance', async (req: Request, res: Response) => {
    const userId = req.authenticatedUser?.id;

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return
    }
    const walletId = req.authenticatedUser?.walletId;
    if (!walletId) {
        res.status(401).json({ message: 'User has no wallet' });
        return
    }

    try {
        const balance = await WalletService.getBalance(walletId as string);
        res.status(200).json({ walletId, balance });
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to retrieve balance' });
    }
});


export default walletRouter;
