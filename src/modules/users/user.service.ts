import { IUser } from './interfaces/user.interface';
import { User } from './user.model';
import { v4 as uuidv4 } from 'uuid';
import knex from '../../config/knex';
import axios from 'axios';
import dotenv from 'dotenv';
import { WalletService } from '../wallet/wallet.service';
import { BlacklistError, ExternalServiceError } from '../../types/errors';
import logger from '../../utils/logger';
import { QueryBuilder } from '../../utils/queryBuilder';

dotenv.config();

const BASE_URL = 'https://adjutor.lendsqr.com/v2/verification/karma';

export class UserService {
    static async checkCustomerKarma(identity: string): Promise<boolean> {
        try {
            const response = await axios.get(`${BASE_URL}/${identity}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.ADJUTOR_API_KEY}`,
                },
                validateStatus: (status) => status === 200 || status === 404,
                timeout: 10000 // 10 second timeout
            });

            // If response status is 200, the user is blacklisted
            if (response.status === 200) {
                logger.info('User blacklist check completed', { 
                    identity: identity, 
                    isBlacklisted: true 
                });
                return true;
            }

            // If response status is 404, the user is not blacklisted
            logger.info('User blacklist check completed', { 
                identity: identity, 
                isBlacklisted: false 
            });
            return false;

        } catch (error) {
            // Handle any other errors that are not 404 or 200 statuses
            logger.error('Error fetching Karma data', { 
                identity: identity, 
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            
            // For service unavailability, we should still allow the user to be onboarded
            // but log the issue for monitoring
            logger.warn('Karma API service unavailable, proceeding with user onboarding', {
                identity: identity
            });
            
            // Return false to allow onboarding when service is down
            return false;
        }
    }

    // Onboard a new user
    static async onboardUser(
        first_name: string,
        last_name: string,
        email: string,
        middle_name?: string
    ): Promise<IUser> {
        try {
            // Blacklist check
            const isBlacklisted = await this.checkCustomerKarma(email);
            if (isBlacklisted) {
                logger.warn('User onboarding rejected due to blacklist', { email });
                throw new BlacklistError();
            }

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

            // Create wallet for the user
            await WalletService.createWalletForUser(newUser.id);

            logger.info('User onboarded successfully', { 
                userId: newUser.id, 
                email: newUser.email 
            });

            return newUser;
        } catch (error) {
            logger.error('Error during user onboarding', {
                email,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error; // Re-throw to let the error handler deal with it
        }
    }

    // Get all users with search and pagination
    static async getAllUsers(page: number = 1, limit: number = 10, search?: string): Promise<{
        data: IUser[];
        page: number;
        limit: number;
        total: number;
    }> {
        // Sanitize and validate input
        const sanitizedSearch = search ? QueryBuilder.sanitizeSearchInput(search) : undefined;
        const { page: validatedPage, limit: validatedLimit } = QueryBuilder.validatePagination(page, limit);

        // Build query using QueryBuilder
        const result = await QueryBuilder.buildPaginatedQuery(
            knex,
            'users',
            ['id', 'first_name', 'middle_name', 'last_name', 'email', 'created_at', 'updated_at'],
            {
                search: sanitizedSearch,
                searchConfig: {
                    fields: ['first_name', 'last_name', 'email', 'middle_name']
                },
                pagination: {
                    page: validatedPage,
                    limit: validatedLimit
                },
                orderBy: { column: 'created_at', direction: 'desc' }
            }
        );

        // Transform data to User objects
        const users = result.data.map(user => new User(
            user.id,
            user.first_name,
            user.last_name,
            user.email,
            user.middle_name,
            user.created_at,
            user.updated_at
        ));

        return {
            data: users,
            page: result.page,
            limit: result.limit,
            total: result.total
        };
    }
}
