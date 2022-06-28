import { Injectable } from '@nestjs/common';
import { type Role } from './role.js';
import { getLogger } from '../../../logger/index.js';
import { users } from '../../../config/dev/users.js';

/**
 * Das Interface `User` beschreibt die Properties zu einer vorhandenen
 * Benutzerkennung.
 */
export interface User {
    userId: number;
    username: string;
    password: string;
    email: string;
    roles: Role[];
}

/**
 * Die Klasse `UserService` implementiert Funktionen, um Objekte vom Typ
 * {@linkcode User} zu suchen.
 */
@Injectable()
export class UserService {
    readonly #users = users;

    readonly #logger = getLogger(UserService.name);

    constructor() {
        this.#logger.info('users=%o', users);
    }

    /**
     * Ein {@linkcode User} wird anhand seines Benutzernamens gesucht.
     *
     * @param username Benutzername.
     * @return Ein Objekt vom Typ {@linkcode User}, falls es einen Benutzer
     *  mit dem angegebenen Benutzernamen gibt. Sonst `undefined`.
     */
    // eslint-disable-next-line @typescript-eslint/require-await
    async findOne(username: string) {
        return this.#users.find((user: User) => user.username === username);
    }

    /**
     * Ein {@linkcode User} wird anhand seiner ID gesucht.
     *
     * @param id ID des gesuchten Benutzers.
     * @return Ein Objekt vom Typ {@linkcode User}, falls es einen Benutzer
     *  mit der angegebenen ID gibt. Sonst `undefined`.
     */
    // eslint-disable-next-line @typescript-eslint/require-await
    async findById(id: number | undefined) {
        return this.#users.find((user: User) => user.userId === id);
    }
}
