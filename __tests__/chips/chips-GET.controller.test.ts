/* eslint-disable no-underscore-dangle, @typescript-eslint/no-non-null-assertion */
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

import { afterAll, beforeAll, describe, test } from '@jest/globals';
import {
    apiPath,
    createTestserver,
    host,
    httpsAgent,
    port,
    shutdownTestserver,
} from '../index.js';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type { ChipsProdukteDTO } from '../index.js';
import { HttpStatus } from '@nestjs/common';
import each from 'jest-each';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const produktnameVorhanden = ['a', 't', 'g'];
const produktnameNichtVorhanden = ['xx', 'yy'];
const schlagwoerterVorhanden = ['ungarisch'];
const schlagwoerterNichtVorhanden = ['csharp', 'php'];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GET /api', () => {
    let client: AxiosInstance;

    beforeAll(async () => {
        await createTestserver();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    afterAll(async () => {
        await shutdownTestserver();
    });

    test('Alle Chipsprodukte', async () => {
        // given

        // when
        const response: AxiosResponse<ChipsProdukteDTO> = await client.get(
            apiPath,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        const { chipsProdukte } = data._embedded;

        chipsProdukte
            .map((chips) => chips._links.self.href)
            .forEach((selfLink) => {
                expect(selfLink).toEqual(
                    expect.stringContaining(`/${apiPath}`),
                );
            });
    });

    each(produktnameVorhanden).test(
        'Chipsprodukte mit einem Titel, der "%s" enthaelt',
        async (teilProduktname: string) => {
            // given
            const params = { produktname: teilProduktname };

            // when
            const response: AxiosResponse<ChipsProdukteDTO> = await client.get(
                apiPath,
                { params },
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data).toBeDefined();

            const { chipsProdukte } = data._embedded;

            // Jedes Chips hat einen Titel mit dem Teilstring 'a'
            chipsProdukte
                .map((chips) => chips.produktname!)
                .forEach((produktname: string) =>
                    expect(produktname.toLowerCase()).toEqual(
                        expect.stringContaining(teilProduktname),
                    ),
                );
        },
    );

    each(produktnameNichtVorhanden).test(
        'Keine Chipsprodukte mit einem Titel, der "%s" enthaelt',
        async (teilProduktname: string) => {
            // given
            const params = { produktname: teilProduktname };

            // when
            const response: AxiosResponse<string> = await client.get(apiPath, {
                params,
            });

            // then
            const { status, data } = response;

            expect(status).toBe(HttpStatus.NOT_FOUND);
            expect(data).toMatch(/^not found$/iu);
        },
    );

    each(schlagwoerterVorhanden).test(
        'Mind. 1 Chips(produkt) mit dem Schlagwort "%s"',
        async (schlagwort: string) => {
            // given
            const params = { [schlagwort]: 'true' };

            // when
            const response: AxiosResponse<ChipsProdukteDTO> = await client.get(
                apiPath,
                { params },
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            // JSON-Array mit mind. 1 JSON-Objekt
            expect(data).toBeDefined();

            const { chipsProdukte } = data._embedded;

            // Jedes Chips hat im Array der Schlagwoerter z.B. "javascript"
            chipsProdukte
                .map((chips) => chips.schlagwoerter!)
                .forEach((schlagwoerter) =>
                    expect(schlagwoerter).toEqual(
                        expect.arrayContaining([schlagwort.toUpperCase()]),
                    ),
                );
        },
    );

    each(schlagwoerterNichtVorhanden).test(
        'Keine Chipsprodukte mit dem Schlagwort "%s"',
        async (schlagwort: string) => {
            // given
            const params = { [schlagwort]: 'true' };

            // when
            const response: AxiosResponse<string> = await client.get(apiPath, {
                params,
            });

            // then
            const { status, data } = response;

            expect(status).toBe(HttpStatus.NOT_FOUND);
            expect(data).toMatch(/^not found$/iu);
        },
    );

    test('Keine Chipsprodukte zu einer nicht-vorhandenen Property', async () => {
        // given
        const params = { foo: 'bar' };

        // when
        const response: AxiosResponse<string> = await client.get(apiPath, {
            params,
        });

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NOT_FOUND);
        expect(data).toMatch(/^not found$/iu);
    });
});
/* eslint-enable no-underscore-dangle, @typescript-eslint/no-non-null-assertion */
