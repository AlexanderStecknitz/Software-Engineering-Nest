/**
 * Das Modul besteht aus dem Schema für _Mongoose_.
 * @packageDocumentation
 */

// import {
//     type Document,
//     type Schema as MongooseSchema,
//     type Query,
//     type SchemaOptions,
//     SchemaType,
// } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { type ObjectID } from 'bson';
import { dbConfig } from '../../config/index.js';
import mongoose from 'mongoose';

/**
 * Alias-Typ für gültige Strings bei dem Typ eines Chips-Produktes.
 */
export type ChipsTyp = 'GEMUESE' | 'KARTOFFEL' | 'LINSE' | 'SUESSKARTOFFEL';

mongoose.SchemaType.set('debug', true);

// Mongoose ist von Valeri Karpov, der auch den Begriff "MEAN-Stack" gepraegt hat:
// http://thecodebarbarian.com/2013/04/29//easy-web-prototyping-with-mongodb-and-nodejs

// @Schema(), @Prop() usw. von Nest kann man nicht mit "virtuellen Funktionen"
// verwenden, wie sie fuer _id vom Typ UUID verwendet werden.

/**
 * Document-Klasse für _Mongoose_
 */

// Mongoose Schema mit NestJS
// https://docs.nestjs.com/techniques/mongodb#model-injection
// Schemas can be created with NestJS decorators, or with Mongoose itself manually.
// Using decorators to create schemas greatly reduces boilerplate and improves
// overall code readability.

const MONGOOSE_OPTIONS: mongoose.SchemaOptions = {
    // createdAt und updatedAt als automatisch gepflegte Felder
    timestamps: true,

    // http://thecodebarbarian.com/whats-new-in-mongoose-5-10-optimistic-concurrency.html
    optimisticConcurrency: true,

    // sequentielle Aufrufe von createIndex() beim Starten der Anwendung
    autoIndex: dbConfig.autoIndex,
};

// Ein Schema in Mongoose definiert die Struktur und Methoden fuer die
// Dokumente in einer Collection, die aus Dokumenten im BSON-Format besteht.
// Ein Property im Schema definiert eine Property fuer jedes Dokument.
// Ein Schematyp (String, Number, Boolean, Date, Array, ObjectId) legt den Typ
// der Property fest.
// https://mongoosejs.com/docs/schematypes.html

/**
 * Das Schema für Mongoose, das dem Schema bei einem relationalen DB-System
 * entspricht, welches durch `CREATE TABLE`, `CREATE INDEX` usw. entsteht.
 */

@Schema(MONGOOSE_OPTIONS)
export class Chips {
    @Prop({ type: String, required: true, unique: true })
    @ApiProperty({ example: 'Chipsname', type: String })
    readonly produktname: string | null | undefined; //NOSONAR

    @Prop({ type: String, required: true, unique: true })
    @ApiProperty({ example: 'Ungarisch', type: String })
    readonly geschmack: string | null | undefined;

    @Prop({
        type: String,
        enum: ['KARTOFFEL', 'SUESSKARTOFFEL', 'GEMUESE', 'LINSE'],
    })
    @ApiProperty({ example: 'KARTOFFEL', type: String })
    readonly typ: ChipsTyp | '' | null | undefined;

    @Prop({ type: Number, required: true })
    @ApiProperty({ example: 1, type: Number })
    readonly bestand: number | undefined;

    @Prop({ type: Number, required: true })
    @ApiProperty({ example: 1, type: Number })
    readonly preis: number | undefined;

    @Prop({ type: Number })
    @ApiProperty({ example: 0.1, type: Number })
    readonly rabatt: number | undefined;

    @Prop({ type: Boolean })
    @ApiProperty({ example: true, type: Boolean })
    readonly lieferbar: boolean | undefined;

    // Metainformationen sind fuer Arrays und geschachtelte Objekte nicht verfuegbar
    @Prop({ type: [String], sparse: true })
    @ApiProperty({ example: ['JAVASCRIPT', 'TYPESCRIPT'] })
    readonly schlagwoerter: string[] | null | undefined;
}

// Optimistische Synchronisation durch das Feld __v fuer die Versionsnummer
// https://mongoosejs.com/docs/guide.html#versionKey
const optimistic = (schema: mongoose.Schema<mongoose.Document<Chips>>) => {
    schema.pre<
        mongoose.Query<mongoose.Document<Chips>, mongoose.Document<Chips>>
    >('findOneAndUpdate', function () {
        const update = this.getUpdate(); // eslint-disable-line @typescript-eslint/no-invalid-this
        if (update === null) {
            return;
        }

        const updateDoc = update as mongoose.Document<Chips>;
        if (updateDoc.__v !== null) {
            delete updateDoc.__v;
        }

        for (const key of ['$set', '$setOnInsert']) {
            /* eslint-disable security/detect-object-injection */
            // @ts-expect-error siehe https://mongoosejs.com/docs/guide.html#versionKey
            const updateKey = update[key]; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
            // Optional Chaining
            if (updateKey?.__v !== null) {
                delete updateKey.__v;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                if (Object.entries(updateKey).length === 0) {
                    // @ts-expect-error UpdateQuery laesst nur Lesevorgaenge zu: abgeleitet von ReadonlyPartial<...>
                    delete update[key]; // eslint-disable-line @typescript-eslint/no-dynamic-delete
                }
            }
            /* eslint-enable security/detect-object-injection */
        }
        // @ts-expect-error $inc ist in _UpdateQuery<TSchema> enthalten
        update.$inc = update.$inc || {}; // eslint-disable-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-assignment
        // @ts-expect-error UpdateQuery laesst nur Lesevorgaenge zu: abgeleitet von ReadonlyPartial<...>
        update.$inc.__v = 1;
    });
};

// Schema passend zur Entity-Klasse erzeugen
export const chipsSchema = SchemaFactory.createForClass(Chips);

// Indexe anlegen (max. 3 bei Atlas)
// hier: aufsteigend (1) sowie "unique" oder "sparse"
chipsSchema.index({ produktname: 1 }, { unique: true, name: 'produktname' });
chipsSchema.index({ typ: 1 }, { name: 'typ' });
chipsSchema.index(
    { schlagwoerter: 1 },
    { sparse: true, name: 'schlagwoerter' },
);

// Document: _id? (vom Type ObjectID) und __v? als Properties
export type ChipsDocument = Chips &
    mongoose.Document<ObjectID, any, Chips> & { _id: ObjectID; __v: number }; // eslint-disable-line @typescript-eslint/naming-convention

chipsSchema.plugin(optimistic);

export const modelName = 'Chips';
export const collectionName = modelName;

export const exactFilterProperties = [
    'geschmack',
    'typ',
    'bestand',
    'preis',
    'rabatt',
    'lieferbar',
];
