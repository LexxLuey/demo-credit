// src/modules/wallet/wallet.controller.ts

import { Request, Response, Router } from 'express';
import { WalletService } from './wallet.service';

const walletRouter = Router();

/**
 * @swagger
 * /wallet/fund:
 *   post:
 *     summary: Fund a wallet
 *     description: Adds funds to the authenticated user's wallet.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to be added to the wallet
 *     responses:
 *       200:
 *         description: Wallet funded successfully
 *       401:
 *         description: User not authenticated or has no wallet
 *       404:
 *         description: Wallet not found
 */
walletRouter.post('/fund', async (req: Request, res: Response) => {
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
        res.status(404).json({ message: error });
    }
});


/**
 * @swagger
 * /wallets/transfer:
 *   post:
 *     summary: Transfer funds to another wallet
 *     description: Allows the authenticated user to transfer funds to another user's wallet.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiverWalletId:
 *                 type: string
 *                 description: The wallet ID of the receiving user
 *               amount:
 *                 type: number
 *                 description: Amount to transfer
 *     responses:
 *       200:
 *         description: Transfer successful
 *       400:
 *         description: Insufficient funds, invalid wallet, or self-transfer attempt
 *       401:
 *         description: User not authenticated or has no wallet
 */
walletRouter.post('/transfer', async (req: Request, res: Response) => {
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
 * /wallets/withdraw:
 *   post:
 *     summary: Withdraw funds from a wallet
 *     description: Allows the authenticated user to withdraw funds from their wallet.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to withdraw from the wallet
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *       400:
 *         description: Insufficient funds or invalid wallet
 *       401:
 *         description: User not authenticated or has no wallet
 */
walletRouter.post('/withdraw', async (req: Request, res: Response) => {
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
 * /wallets/transactions:
 *   get:
 *     summary: Retrieve a wallet's transaction history
 *     description: Fetches a paginated list of transactions for the authenticated user's wallet.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           description: The number of transactions per page
 *     responses:
 *       200:
 *         description: A paginated list of transactions
 *       400:
 *         description: Invalid wallet ID or failure to retrieve transactions
 *       401:
 *         description: User not authenticated or has no wallet
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
 * /wallets/balance:
 *   get:
 *     summary: Check wallet balance
 *     description: Retrieves the current balance of the authenticated user's wallet.
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
 *                   description: Wallet ID of the authenticated user
 *                 balance:
 *                   type: number
 *                   description: Current balance of the wallet
 *       400:
 *         description: Invalid wallet ID or failure to retrieve balance
 *       401:
 *         description: User not authenticated or has no wallet
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
