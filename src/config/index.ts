/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
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

/**
 * Das Modul ist ein Barrel und enthält die Konfigurationsdaten für
 * - _Node_
 * - DB-Zugriff auf _MongoDB_
 * - _JWT_ (JSON Web Token)
 * - Logging mit _Winston_
 * - MIME-Typen
 * - _nodemailer_
 * @packageDocumentation
 */

export { cloud } from './cloud.js';
export { dbConfig } from './db.js';
export { testdaten, testfiles, users } from './dev/index.js';
export { graphQlConfig } from './graphql.js';
export { jwtConfig } from './jwt.js';
export { k8sConfig } from './kubernetes.js';
export { parentLogger } from './logger.js';
export { mailConfig } from './mail.js';
export { configDir, nodeConfig } from './node.js';
export { paths } from './paths.js';
