// src/modules/users/user.service.ts

import { IUser } from './interfaces/user.interface';
import { User } from './user.model';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { config } from '../../config/env.config';
import knex from '../../config/knex';

export class UserService {
    // Check if a user is blacklisted
    static async isUserBlacklisted(email: string): Promise<boolean> {
        const response = await axios.get(`https://adjutor-karma-api/check/${email}`, {
            headers: { Authorization: `Bearer ${config.adjutorApiKey}` },
        });
        return response.data.isBlacklisted;
    }

    // Onboard a new user
    static async onboardUser(
        first_name: string,
        last_name: string,
        email: string,
        middle_name?: string
    ): Promise<IUser> {
        // Blacklist check
        const isBlacklisted = await this.isUserBlacklisted(email);
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

        return newUser;
    }
}
