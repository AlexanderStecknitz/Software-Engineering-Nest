/*
 * Copyright (C) 2020 - present Juergen Zimmermann, Hochschule Karlsruhe
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
import { type Chips } from '../../chips/entity/index.js';
import { ObjectID } from 'bson';

// eslint-disable-next-line @typescript-eslint/naming-convention
type ChipsIdVersion = Chips & { _id: ObjectID; __v: number };

/* eslint-disable @typescript-eslint/naming-convention */
export const testdaten: ChipsIdVersion[] = [
    // -------------------------------------------------------------------------
    // L e s e n
    // -------------------------------------------------------------------------
    {
        _id: new ObjectID('000000000000000000000001'),
        produktname: 'Alpha',
        geschmack: 'A',
        typ: 'KARTOFFEL',
        bestand: 1,
        preis: 11.1,
        rabatt: 0.011,
        lieferbar: true,
        schlagwoerter: ['Klassisch'],
        __v: 0,
    },
    {
        _id: new ObjectID('000000000000000000000002'),
        produktname: 'Beta',
        geschmack: 'B',
        typ: 'SUESSKARTOFFEL',
        bestand: 2,
        preis: 22.2,
        rabatt: 0.022,
        lieferbar: true,
        schlagwoerter: ['UNGARISCH'],
        __v: 0,
    },
    {
        _id: new ObjectID('000000000000000000000003'),
        produktname: 'Gamma',
        geschmack: 'G',
        typ: 'GEMUESE',
        bestand: 3,
        preis: 3.33,
        rabatt: 0.33,
        lieferbar: true,
        schlagwoerter: ['Bio'],
        __v: 0,
    },
    // -------------------------------------------------------------------------
    // A e n d e r n
    // -------------------------------------------------------------------------
    {
        _id: new ObjectID('000000000000000000000040'),
        produktname: 'Delta',
        geschmack: 'D',
        typ: 'LINSE',
        bestand: 4,
        preis: 4.44,
        rabatt: 0.04,
        lieferbar: true,
        schlagwoerter: ['PAPRIKA'],
        __v: 0,
    },
    // -------------------------------------------------------------------------
    // L o e s c h e n
    // -------------------------------------------------------------------------
    {
        _id: new ObjectID('000000000000000000000050'),
        produktname: 'Epsilon',
        geschmack: 'E',
        typ: 'KARTOFFEL',
        bestand: 5,
        preis: 55.5,
        rabatt: 0.05,
        lieferbar: false,
        schlagwoerter: ['Neu'],
        __v: 0,
    },
    // -------------------------------------------------------------------------
    // z u r   f r e i e n   V e r f u e g u n g
    // -------------------------------------------------------------------------
    {
        _id: new ObjectID('000000000000000000000060'),
        produktname: 'Phi',
        geschmack: 'P',
        typ: 'KARTOFFEL',
        bestand: 6,
        preis: 6.66,
        rabatt: 0.06,
        lieferbar: false,
        schlagwoerter: ['Neu'],
        __v: 0,
    },
];
/* eslint-enable @typescript-eslint/naming-convention */
