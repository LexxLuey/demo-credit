import { IUser } from './interfaces/user.interface';
import { User } from './user.model';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/env.config';
import knex from '../../config/knex';
import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import { WalletService } from '../wallet/wallet.service';

// Load environment variables from .env file
dotenv.config();

// Define the base URL for the Karma endpoint
const BASE_URL = 'https://adjutor.lendsqr.com/v2/verification/karma';

export class UserService {
    // Function to check if a customer is on the blacklist
    static async checkCustomerKarma(identity: string): Promise<boolean> {
        try {
            const response = await axios.get(`${BASE_URL}/${identity}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.ADJUTOR_API_KEY}`,
                },
                validateStatus: (status) => status === 200 || status === 404
            });

            // If response status is 200, the user is blacklisted
            if (response.status === 200) {
                console.log('User is blacklisted:', response.data);
                return true;
            }

            // If response status is 404, the user is not blacklisted
            console.log('User is not blacklisted');
            return false;

        } catch (error) {
            // Handle any other errors that are not 404 or 200 statuses
            console.error('Error fetching Karma data:', error);
            return true;
        }
    }

    // Onboard a new user
    static async onboardUser(
        first_name: string,
        last_name: string,
        email: string,
        middle_name?: string
    ): Promise<IUser> {
        // Blacklist check
        const isBlacklisted = await this.checkCustomerKarma(email);
        if (isBlacklisted) throw new Error('User is blacklisted');

        // Create user
        const userId = uuidv4();
        const newUser: IUser = new User(userId, first_name, last_name, email, middle_name);

        // Insert user in the database
        await knex('users').insert({
            id: newUser.id,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            middle_name: newUser.middle_name,
            email: newUser.email,
            created_at: newUser.createdAt,
            updated_at: newUser.updatedAt
        });

        await WalletService.createWalletForUser(newUser.id)


        return newUser;
    }
}
