// src/modules/shared/models/base.model.ts

import { IBaseEntity } from '../interfaces/base.interface';

export abstract class BaseModel implements IBaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(id: string, createdAt?: Date, updatedAt?: Date) {
        this.id = id;
        this.createdAt = createdAt || new Date();
        this.updatedAt = updatedAt || new Date();
    }
}
