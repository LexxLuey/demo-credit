// src/modules/users/interfaces/user.interface.ts

import { IBaseEntity } from '../../shared/interfaces/base.interface';

export interface IUser extends IBaseEntity {
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
}
