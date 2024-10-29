// src/modules/wallet/wallet.controller.ts

import { Request, Response, Router } from 'express';
import { WalletService } from './wallet.service';

const walletRouter = Router();

/**
 * @swagger
 * /wallet/fund:
 *   post:
 *     summary: Fund a wallet
 *     description: Adds funds to the specified wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walletId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Wallet funded successfully
 *       404:
 *         description: Wallet not found
 */
walletRouter.post('/fund', async (req: Request, res: Response) => {
    const { walletId, amount } = req.body;

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
 *     summary: Transfer funds from one wallet to another
 *     description: Allows a user to transfer funds to another user's wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderWalletId:
 *                 type: string
 *               receiverWalletId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Transfer successful
 *       400:
 *         description: Insufficient funds or invalid wallet
 */
walletRouter.post('/transfer', async (req: Request, res: Response) => {
    const { senderWalletId, receiverWalletId, amount } = req.body;

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
 *     description: Allows a user to withdraw funds from their wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walletId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *       400:
 *         description: Insufficient funds or invalid wallet
 */
walletRouter.post('/withdraw', async (req: Request, res: Response) => {
    const { walletId, amount } = req.body;

    try {
        const withdrawalResult = await WalletService.withdrawFunds(walletId, amount);
        res.status(200).json(withdrawalResult);
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : 'Withdrawal failed' });
    }
});

export default walletRouter;
