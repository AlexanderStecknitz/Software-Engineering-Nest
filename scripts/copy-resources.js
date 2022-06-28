/*
 * Copyright (C) 2017 - present Juergen Zimmermann, Hochschule Karlsruhe
 * Mit zusätzlichen Modifikationen von Henrik Chung, Hochschule Karlsruhe
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
import fs from 'fs';
import fsExtra from 'fs-extra';
import minimist from 'minimist';
import path from 'path';

const { copyFileSync, mkdirSync } = fs;
const { copySync } = fsExtra;
const { join } = path

const argv = minimist(process.argv.slice(2));
const noTls = argv._[0] === 'no-tls';

// BEACHTE: "assets" innerhalb von nest-cli.json werden bei "--watch" NICHT beruecksichtigt
// https://docs.nestjs.com/cli/monorepo#global-compiler-options

const src = 'src';
const dist = 'dist';

const configSrc = join(src, 'config');
const configDist = join(dist, src, 'config');

if (!noTls) {
    const tlsSrc = join(configSrc, 'tls');
    const tlsDist = join(configDist, 'tls');
    mkdirSync(tlsDist, { recursive: true });
    // PEM-Dateien und Zertifikatdatei fuer TLS kopieren
    copySync(tlsSrc, tlsDist);
}

// PEM-Dateien fuer JWT kopieren
const jwtPemSrc = join(configSrc, 'jwt');
const jwtPemDist = join(configDist, 'jwt');
mkdirSync(jwtPemDist, { recursive: true });
copySync(jwtPemSrc, jwtPemDist);

const graphqlSrc = join(src, 'chips', 'graphql');
const graphqlDist = join(dist, src, 'chips', 'graphql');
mkdirSync(graphqlDist, { recursive: true });
copyFileSync(join(graphqlSrc, 'chips.graphql'), join(graphqlDist, 'chips.graphql'));

const graphqlAuthSrc = join(src, 'security', 'auth');
const graphqlAuthDist = join(dist, src, 'security', 'auth');
mkdirSync(graphqlAuthDist, { recursive: true });
copyFileSync(join(graphqlAuthSrc, 'login.graphql'), join(graphqlAuthDist, 'login.graphql'));

const binaries = ['image.jpg', 'image.png'];
const binariesSrc = join(configSrc, 'dev');
const binariesDist = join(configDist, 'dev');
mkdirSync(binariesDist, { recursive: true });
binaries.forEach(file => copyFileSync(join(binariesSrc, file), join(binariesDist, file)));
