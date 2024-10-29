// src/modules/users/models/user.model.ts

import { BaseModel } from '../shared/models/base.model';
import { IUser } from './interfaces/user.interface';

export class User extends BaseModel implements IUser {
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;

    constructor(
        id: string,
        first_name: string,
        last_name: string,
        email: string,
        middle_name?: string,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        super(id, createdAt, updatedAt);
        this.first_name = first_name;
        this.middle_name = middle_name;
        this.last_name = last_name;
        this.email = email;
    }
}
