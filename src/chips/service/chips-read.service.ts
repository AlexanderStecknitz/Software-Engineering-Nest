/**
 * Das Modul besteht aus der Klasse {@linkcode AuthService} für die
 * Authentifizierung.
 * @packageDocumentation
 */

import {
    type ChipsDocument,
    exactFilterProperties,
    modelName,
} from '../entity/index.js';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { ObjectID } from 'bson';
import { getLogger } from '../../logger/index.js';
import mongoose from 'mongoose';

// API-Dokumentation zu Mongoose:
// http://mongoosejs.com/docs/api.html
// https://github.com/Automattic/mongoose/issues/3949

/* eslint-disable unicorn/no-useless-undefined */

/**
 * Die Klasse `ChipsReadService` implementiert das Lesen für Chips und greift
 * mit _Mongoose_ auf MongoDB zu.
 */
@Injectable()
export class ChipsReadService {
    readonly #chipsModel: mongoose.Model<ChipsDocument>;

    readonly #logger = getLogger(ChipsReadService.name);

    constructor(
        @InjectModel(modelName) chipsModel: mongoose.Model<ChipsDocument>,
    ) {
        this.#chipsModel = chipsModel;
    }

    // Rueckgabetyp Promise bei asynchronen Funktionen
    //    ab ES2015
    //    vergleiche Task<> bei C# und Mono<> aus Project Reactor
    // Status eines Promise:
    //    Pending: das Resultat ist noch nicht vorhanden, weil die asynchrone
    //             Operation noch nicht abgeschlossen ist
    //    Fulfilled: die asynchrone Operation ist abgeschlossen und
    //               das Promise-Objekt hat einen Wert
    //    Rejected: die asynchrone Operation ist fehlgeschlagen and das
    //              Promise-Objekt wird nicht den Status "fulfilled" erreichen.
    //              Im Promise-Objekt ist dann die Fehlerursache enthalten.

    /**
     * Ein Chips asynchron anhand seiner ID suchen
     * @param id ID des gesuchten Chips
     * @returns Das gefundene Chips vom Typ {@linkcode Chips} oder undefined
     *          in einem Promise aus ES2015 (vgl.: Mono aus Project Reactor oder
     *          Future aus Java)
     */
    async findById(idStr: string) {
        this.#logger.debug('findById: idStr=%s', idStr);

        // ein Chips zur gegebenen ID asynchron mit Mongoose suchen
        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // Das Resultat ist null, falls nicht gefunden.
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document,
        // so dass u.a. der virtuelle getter "id" auch nicht mehr vorhanden ist.
        // ObjectID: 12-Byte Binaerwert, d.h. 24-stellinger HEX-String
        if (!ObjectID.isValid(idStr)) {
            this.#logger.debug('findById: Ungueltige ObjectID');
            return undefined;
        }

        const id = new ObjectID(idStr);
        const chips = await this.#chipsModel.findById(id); //NOSONAR
        this.#logger.debug('findById: chips=%o', chips);

        return chips || undefined;
    }

    /**
     * Chips asynchron suchen.
     * @param filter Die DB-Query als JSON-Objekt
     * @returns Ein JSON-Array mit den gefundenen Chips. Ggf. ist das Array leer.
     */
    // eslint-disable-next-line max-lines-per-function
    async find(filter?: mongoose.FilterQuery<ChipsDocument> | undefined) {
        this.#logger.debug('find: filter=%o', filter);

        // alle ChipsProdukte asynchron suchen u. aufsteigend nach titel sortieren
        // https://docs.mongodb.org/manual/reference/object-id
        // entries(): { titel: 'a', rating: 5 } => [{ titel: 'x'}, {rating: 5}]
        if (filter === undefined || Object.entries(filter).length === 0) {
            return this.#findAll();
        }

        // { titel: 'a', rating: 5, javascript: true }
        // Rest Properties
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { produktname, ungarisch, paprika, ...dbFilter } = filter;

        if (this.#checkInvalidProperty(dbFilter)) {
            return [];
        }

        // ChipsProdukte zur Query (= JSON-Objekt durch Express) asynchron suchen
        // Titel in der Query: Teilstring des Titels,
        // d.h. "LIKE" als regulaerer Ausdruck
        // 'i': keine Unterscheidung zw. Gross- u. Kleinschreibung
        // NICHT /.../, weil das Muster variabel sein muss
        // CAVEAT: KEINE SEHR LANGEN Strings wg. regulaerem Ausdruck
        // RegExp statt RE2 wegen Mongoose
        if (
            produktname !== undefined &&
            produktname !== null &&
            typeof produktname === 'string'
        ) {
            dbFilter.produktname =
                // TODO Komplexitaet des regulaeren Ausrucks analysieren
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                produktname.length < 10
                    ? new RegExp(produktname, 'iu') // eslint-disable-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr
                    : produktname;
        }

        // z.B. {javascript: true, typescript: true}
        const schlagwoerter = [];
        if (ungarisch === 'true') {
            schlagwoerter.push('UNGARISCH');
        }
        if (paprika === 'true') {
            schlagwoerter.push('PAPRIKA');
        }
        if (schlagwoerter.length === 0) {
            if (Array.isArray(dbFilter.schlagwoerter)) {
                dbFilter.schlagwoerter.splice(0);
            }
        } else {
            dbFilter.schlagwoerter = schlagwoerter;
        }

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // leeres Array, falls nichts gefunden wird
        // Model<Document>.findOne(query), falls das Suchkriterium eindeutig ist
        // bei findOne(query) wird null zurueckgeliefert, falls nichts gefunden
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
        const chips = await this.#chipsModel.find(
            //NOSONAR
            dbFilter,
        );
        this.#logger.debug('find: chips=%o', chips);

        return chips;
    }

    async #findAll() {
        this.#logger.debug('#findAll');
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
        const chips = await this.#chipsModel.find().sort('titel'); //NOSONAR
        this.#logger.debug('#findAll: chips=%o', chips);
        return chips;
    }

    #checkInvalidProperty(dbFilter: Record<string, string>) {
        const filterKeys = Object.keys(dbFilter);
        const result = filterKeys.some(
            (key) => !exactFilterProperties.includes(key),
        );
        this.#logger.debug('#checkInvalidProperty: result=%o', result);
        return result;
    }
}

/* eslint-enable unicorn/no-useless-undefined */
