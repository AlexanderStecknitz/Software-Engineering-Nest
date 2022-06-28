/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */
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

import {
    type ChipsProdukteDTOGraphQL,
    createTestserver,
    host,
    httpsAgent,
    port,
    shutdownTestserver,
} from '../index.js';
import { type GraphQLRequest, type GraphQLResponse } from 'apollo-server-types';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { HttpStatus } from '@nestjs/common';
import each from 'jest-each';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idVorhanden = [
    '000000000000000000000001',
    '000000000000000000000002',
    '000000000000000000000003',
];

// ``produktname`` vielleicht besser => Propertygleichheit.
const produktnameVorhanden = ['Alpha', 'Beta', 'Gamma'];

const teilProduktnameVorhanden = ['a', 't', 'g'];

const teilProduktnameNichtVorhanden = ['Xyz', 'abc'];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Queries', () => {
    //``Axios``: Promise based HTTP client for the browser and node.js
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await createTestserver();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
        });
    });

    afterAll(async () => {
        await shutdownTestserver();
    });

    each(idVorhanden).test('Chips zu vorhandener ID %s', async (id: string) => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    chips(id: "${id}") {
                        produktname
                        geschmack
                        typ
                        version
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        //im header wird der content type auf das JSON-Format festgelegt => caseinsenitive && unicode (regex)
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { chips } = data.data!;
        const result: ChipsProdukteDTOGraphQL = chips;

        expect(result.produktname).toMatch(/^\w/u);
        expect(result.version).toBeGreaterThan(-1);
        expect(result.id).toBeUndefined();
    });

    test('Chips zu nicht-vorhandener ID', async () => {
        // given
        const id = '999999999999999999999999';
        const body: GraphQLRequest = {
            query: `
                {
                    chips(id: "${id}") {
                        produktname
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.chips).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error!;

        expect(message).toBe(
            `Es wurden keine Chips mit der ID ${id} gefunden.`,
        );
        expect(path).toBeDefined();
        // @JZimmermann: warum '2 !!'
        expect(path!![0]).toBe('chips');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    each(produktnameVorhanden).test(
        'Chips zu vorhandenem Titel %s',
        async (produktname: string) => {
            // given
            const body: GraphQLRequest = {
                query: `
                    {
                        chipsProdukte(produktname: "${produktname}") {
                            produktname
                            geschmack
                            typ
                        }
                    }
                `,
            };

            // when
            const response: AxiosResponse<GraphQLResponse> = await client.post(
                graphqlPath,
                body,
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.errors).toBeUndefined();

            expect(data.data).toBeDefined();

            const { chipsProdukte } = data.data!;

            expect(chipsProdukte).not.toHaveLength(0);

            const chipsProdukteArray: ChipsProdukteDTOGraphQL[] = chipsProdukte;

            expect(chipsProdukteArray).toHaveLength(1);

            const [chips] = chipsProdukteArray;

            expect(chips!.produktname).toBe(produktname);
        },
    );

    each(teilProduktnameVorhanden).test(
        'Chips zu vorhandenem Teil-Titel %s',
        async (teilProduktname: string) => {
            // given
            const body: GraphQLRequest = {
                query: `
                    {
                        chipsProdukte(produktname: "${teilProduktname}") {
                            produktname
                            geschmack
                            typ
                        }
                    }
                `,
            };

            // when
            const response: AxiosResponse<GraphQLResponse> = await client.post(
                graphqlPath,
                body,
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.errors).toBeUndefined();
            expect(data.data).toBeDefined();

            const { chipsProdukte } = data.data!;

            expect(chipsProdukte).not.toHaveLength(0);

            (chipsProdukte as ChipsProdukteDTOGraphQL[])
                .map((chips) => chips.produktname!)
                .forEach((produktname: string) =>
                    expect(produktname.toLowerCase()).toEqual(
                        expect.stringContaining(teilProduktname),
                    ),
                );
        },
    );

    each(teilProduktnameNichtVorhanden).test(
        'Chips zu nicht vorhandenem Titel %s',
        async (teilProduktname: string) => {
            // given
            const body: GraphQLRequest = {
                query: `
                    {
                        chipsProdukte(produktname: "${teilProduktname}") {
                            produktname
                            geschmack
                            typ
                        }
                    }
                `,
            };

            // when
            const response: AxiosResponse<GraphQLResponse> = await client.post(
                graphqlPath,
                body,
            );

            // then
            const { status, headers, data } = response;

            //jest kapselt express
            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.data!.chipsProdukte).toBeNull();

            const { errors } = data;

            expect(errors).toHaveLength(1);

            const [error] = errors!;
            const { message, path, extensions } = error!;

            expect(message).toBe('Es wurden keine Chips gefunden.');
            expect(path).toBeDefined();
            expect(path!![0]).toBe('chipsProdukte');
            expect(extensions).toBeDefined();
            expect(extensions!.code).toBe('BAD_USER_INPUT');
        },
    );
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */
