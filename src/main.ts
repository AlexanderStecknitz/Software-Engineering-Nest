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
// Modul (in JS) = Datei
// Pfad innerhalb von Packages in node_modules ("nicht-relative Imports")
import {
    DocumentBuilder,
    type SwaggerCustomOptions,
    SwaggerModule,
} from '@nestjs/swagger';
// relativer Import
import { corsOptions, helmetHandlers } from './security/index.js';
import { nodeConfig, paths } from './config/index.js';
import { AppModule } from './app.module.js';
import { type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';

// Destructuring ab ES 2015
const { httpsOptions, port } = nodeConfig;

// "Arrow Function" ab ES 2015
const setupSwagger = (app: INestApplication) => {
    const config = new DocumentBuilder()
        .setTitle('Chips')
        .setDescription('Gruppenprojekt für Software Engineering von Gruppe 6.')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    const options: SwaggerCustomOptions = {
        customSiteTitle: 'Software Engineering SS/22',
    };
    SwaggerModule.setup(paths.swagger, app, document, options);
};

// Promise ab ES 2015, vgl: Future in Java
// async/await ab ES 2017, vgl: C#
const bootstrap = async () => {
    const app =
        httpsOptions === undefined
            ? await NestFactory.create(AppModule)
            : await NestFactory.create(AppModule, { httpsOptions }); // "Shorthand Properties" ab ES 2015

    // https://docs.nestjs.com/security/helmet
    app.use(helmetHandlers);

    setupSwagger(app);
    // compression von Express fuer GZip-Komprimierung
    // Default "Chunk Size" ist 16 KB: https://github.com/expressjs/compression#chunksize
    app.use(compression());
    // cors von Express fuer CORS (= cross origin resource sharing)
    app.enableCors(corsOptions);
    app.enableShutdownHooks();

    await app.listen(port);
};

// Top-level await ab ES 2020
await bootstrap();

// IIFE  = Immediately Invoked Function Expression
// IIAFE = Immediately Invoked Asynchronous Function Expression
// (async () => {
//     await bootstrap(); // ab ES 2017
// })();

// Promise mit then() ab ES 2015
// bootstrap()
//     .then(() => console.log(`Server gestartet auf Port ${port}`)) // eslint-disable-line security-node/detect-crlf
//     .catch((err) => console.error('Fehler bei bootstrap():', err));
