import { Request, Response, NextFunction, RequestHandler } from 'express';
import knex from '../config/knex';

export const fauxAuth: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const lastUser = await knex('users').orderBy('created_at', 'asc').first();
        
        if (lastUser) {
            const wallet = await knex('wallets').where({ user_id: lastUser?.id }).first();
            req.authenticatedUser = {
                ...req.authenticatedUser,
                id: lastUser.id,
                walletId: wallet.id,
                first_name: lastUser.first_name,
                last_name: lastUser.last_name,
                email: lastUser.email,
            };
            // console.log('Request Object:', {
            //     method: req.method,
            //     url: req.url,
            //     // headers: req.headers,
            //     body: req.body,
            //     query: req.query,
            //     params: req.params,
            //     authenticatedUser: req.authenticatedUser, // Custom property if set by auth middleware
            // });
        } else {
            res.status(401).json({ message: 'No authenticated user available' });
            return;
        }
        next();
    } catch (error) {
        console.error(error);
        
        res.status(500).json({ message: 'Error retrieving authenticated user' });
    }
};

export function handleTokenBasedAuthentication(req: Request, res: Response, next: NextFunction) {
    const authenticationToken = req.headers["authorization"]

    if (authenticationToken !== undefined) {
        const isTokenValid = true;// verifying if authenticationToken is valid with a query or an API call...

        if (isTokenValid) {
            // moving to the next middleware
            return next()
        }
    }

    // if the authorization token is invalid or missing returning a 401 error
    res.status(401).send("Unauthorized")
}