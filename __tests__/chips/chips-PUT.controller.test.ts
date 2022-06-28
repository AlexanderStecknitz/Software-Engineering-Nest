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

import {
    type Chips,
    apiPath,
    createTestserver,
    host,
    httpsAgent,
    loginRest,
    port,
    shutdownTestserver,
} from '../index.js';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { HttpStatus } from '@nestjs/common';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------

const geaenderteChips: Omit<Chips, 'id'> = {
    //id wird nicht geaendet
    produktname: 'Geaendert',
    geschmack: 'Spicy hot',
    typ: 'KARTOFFEL',
    bestand: 20,
    preis: 44.4,
    rabatt: 0.044,
    lieferbar: true,
    schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
};
const idVorhanden = '000000000000000000000040';

const geaenderteChipsIdNichtVorhanden: Omit<Chips, 'bestand'> = {
    produktname: 'Koblauch Supreme',
    geschmack: 'Knoblauch',
    typ: 'SUESSKARTOFFEL',
    preis: 44.4,
    rabatt: 0.044,
    lieferbar: true,
    schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
};
const idNichtVorhanden = '900000000000000000000009';

const geaendertesChipsInvalid: Record<string, unknown> = {
    produktname: '???',
    geschmack: '???',
    typ: 'FEHLER',
    bestand: -1,
    preis: -999,
    rabatt: 2,
    lieferbar: true,
    schlagwoerter: [],
};

// id wird nicht geaendet
const veralteteChips: Omit<Chips, 'id'> = {
    produktname: 'Veraltet',
    typ: 'LINSE',
    geschmack: 'Spicy Curry',
    bestand: 20,
    preis: 44.4,
    rabatt: 0.044,
    lieferbar: true,
    schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('PUT /api/:id', () => {
    let client: AxiosInstance;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json', // eslint-disable-line @typescript-eslint/naming-convention
    };

    // Testserver sttypen und dabei mit der DB verbinden
    beforeAll(async () => {
        await createTestserver();

        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            headers,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownTestserver();
    });

    test('Vorhandenes Chips aendern', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaenderteChips,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NO_CONTENT);
        expect(data).toBe('');
    });

    test('Nicht-vorhandenes Chips aendern', async () => {
        // given
        const url = `${apiPath}/${idNichtVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaenderteChipsIdNichtVorhanden,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_FAILED);
        expect(data).toBe(
            `Es gibt kein Chips mit der ID "${idNichtVorhanden}".`,
        );
    });

    test('Vorhandene Chips aendern, aber mit ungueltigen Daten', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaendertesChipsInvalid,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(data).toEqual(
            expect.arrayContaining([
                'Ein Produktname muss mit einem Buchstaben, einer Ziffer oder _ beginnen.',
                'Die Geschmacksrichtung muss mit einem Buchstaben, einer Ziffer oder _ beginnen.',
                'Die Art eines Chips-Produktes muss KARTOFFEL, SUESSKARTOFFEL, GEMUESE oder LINSE sein.',
                'Der Bestand eines Chips-Produktes muss mindestens 0 sein.',
                'Der Preis darf nicht negativ sein.',
                'Der Rabatt muss ein Wert zwischen 0 und 1 sein.',
            ]),
        );
    });

    test('Vorhandene Chips aendern, aber ohne Versionsnummer', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        delete headers['If-Match'];

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaenderteChips,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_REQUIRED);
        expect(data).toBe('Header "If-Match" fehlt');
    });

    test('Vorhandene Chips aendern, aber mit alter Versionsnummer', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"-1"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            veralteteChips,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_FAILED);
        expect(data).toEqual(expect.stringContaining('Die Versionsnummer'));
    });

    test('Vorhandene Chips aendern, aber ohne Token', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        delete headers.Authorization;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaenderteChips,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    test('Vorhandene Chips aendern, aber mit falschem Token', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaenderteChips,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
});
