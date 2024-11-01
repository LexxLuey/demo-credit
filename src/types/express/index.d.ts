// @types/express/index.d.ts
import 'express';
import { User } from "../custom";

declare global {
    namespace Express {
        interface Request {
            authenticatedUser: {
                id: string,
                walletId: string,
                first_name: string,
                last_name: string,
                email: string
            };
        }
        export interface Response {
            authenticatedUser: {
                id: string,
                walletId: string,
                first_name: string,
                last_name: string,
                email: string
            };
        }
    }
}
