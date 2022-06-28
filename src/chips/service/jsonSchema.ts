import { type GenericJsonSchema } from './GenericJsonSchema.js';

export const jsonSchema: GenericJsonSchema = {
    // naechstes Release: 2021-02-01
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://acme.com/chips.json#',
    title: 'Chips',
    description: 'Eigenschaften eines Chips-Produktes: Typen und Constraints',
    type: 'object',
    properties: {
        /* eslint-disable @typescript-eslint/naming-convention */
        _id: { type: 'object' },
        __v: {
            type: 'number',
            minimum: 0,
        },
        /* eslint-enable @typescript-eslint/naming-convention */
        // fuer GraphQL
        version: {
            type: 'number',
            minimum: 0,
        },
        produktname: {
            type: 'string',
            pattern: '^\\w.*',
        },
        geschmack: {
            type: 'string',
            pattern: '^\\w.*',
        },
        typ: {
            type: 'string',
            enum: ['KARTOFFEL', 'SUESSKARTOFFEL', 'GEMUESE', 'LINSE', ''],
        },
        bestand: {
            type: 'number',
            minimum: 0,
        },
        preis: {
            type: 'number',
            minimum: 0,
        },
        rabatt: {
            type: 'number',
            exclusiveMinimum: 0,
            exclusiveMaximum: 1,
        },
        lieferbar: { type: 'boolean' },
        schlagwoerter: {
            type: 'array',
            items: { type: 'string' },
        },
    },
    // Mongoose bietet dazu die Funktion Document.findByIdAndUpdate()
    required: ['produktname', 'geschmack', 'typ'],
    additionalProperties: false,
    errorMessage: {
        properties: {
            version: 'Die Versionsnummer muss mindestens 0 sein.',
            produktname:
                'Ein Produktname muss mit einem Buchstaben, einer Ziffer oder _ beginnen.',
            geschmack:
                'Die Geschmacksrichtung muss mit einem Buchstaben, einer Ziffer oder _ beginnen.',
            typ: 'Die Art eines Chips-Produktes muss KARTOFFEL, SUESSKARTOFFEL, GEMUESE oder LINSE sein.',
            bestand:
                'Der Bestand eines Chips-Produktes muss mindestens 0 sein.',
            preis: 'Der Preis darf nicht negativ sein.',
            rabatt: 'Der Rabatt muss ein Wert zwischen 0 und 1 sein.',
            lieferbar: '"lieferbar" muss auf true oder false gesetzt sein.',
        },
    },
};
