/*
 * Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
export type {
    ChipsDTO,
    ChipsProdukteDTO,
} from '../src/chips/rest/chips-get.controller';
export type { Chips } from '../src/chips/entity/index.js';
export type { ChipsDTO as ChipsProdukteDTOGraphQL } from '../src/chips/graphql/chips-query.resolver.js'; // graphql-folder doesn't exist
export { loginGraphQL, loginRest } from './login.js';
export {
    apiPath,
    createTestserver,
    host,
    httpsAgent,
    loginPath,
    port,
    shutdownTestserver,
} from './testserver.js';
