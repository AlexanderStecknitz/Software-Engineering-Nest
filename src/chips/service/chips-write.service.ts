/**
 * Das Modul besteht aus der Klasse {@linkcode AuthService} für die
 * Authentifizierung.
 * @packageDocumentation
 */

import { type Chips, type ChipsDocument, modelName } from '../entity/index.js';
import {
    type ChipsNotExists,
    type CreateError,
    type ProduktnameExists,
    type UpdateError,
    type VersionInvalid,
    type VersionOutdated,
} from './errors';
import { ChipsValidationService } from './chips-validation.service.js';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service.js';
import { ObjectID } from 'bson';
import RE2 from 're2';
import { getLogger } from '../../logger/index.js';
import mongoose from 'mongoose';

// API-Dokumentation zu Mongoose:
// http://mongoosejs.com/docs/api.html
// https://github.com/Automattic/mongoose/issues/3949

/**
 * Die Klasse `ChipsWriteService` implementiert den Anwendungskern für das
 * Schreiben von Chips und greift mit _Mongoose_ auf MongoDB zu.
 */
@Injectable()
export class ChipsWriteService {
    private static readonly UPDATE_OPTIONS: mongoose.QueryOptions = {
        new: true,
    };

    private static readonly VERSION_PATTERN = new RE2('^"\\d*"');

    readonly #chipsModel: mongoose.Model<ChipsDocument>;

    readonly #validationService: ChipsValidationService;

    readonly #mailService: MailService;

    readonly #logger = getLogger(ChipsWriteService.name);

    constructor(
        @InjectModel(modelName) chipsModel: mongoose.Model<ChipsDocument>,
        validationService: ChipsValidationService,
        mailService: MailService,
    ) {
        this.#chipsModel = chipsModel;
        this.#validationService = validationService;
        this.#mailService = mailService;
    }

    /**
     * Ein neues Chips-Produkt soll angelegt werden.
     * @param chips Das neu abzulegende Chips-Produkt
     * @returns Die ID des neu angelegten Chips-Produktes oder im Fehlerfall
     * {@linkcode CreateError}
     */
    async create(chips: Chips): Promise<CreateError | ObjectID> {
        this.#logger.debug('create: chips=%o', chips);
        const validateResult = await this.#validateCreate(chips);
        if (validateResult !== undefined) {
            return validateResult;
        }

        const chipsDocument = new this.#chipsModel(chips);
        const saved = await chipsDocument.save();
        const id = saved._id;

        await this.#sendmail(saved);

        this.#logger.debug('create: id=%s', id);
        return id;
    }

    /**
     * Ein vorhandenes ChipsProdukt soll aktualisiert werden.
     * @param chips Das zu aktualisierende Chips-Produkt
     * @param id ID des zu aktualisierenden Chips-Produktes
     * @param version Die Versionsnummer für optimistische Synchronisation
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     *  oder im Fehlerfall {@linkcode UpdateError}
     */
    async update(
        id: string,
        chips: Chips,
        version: string,
    ): Promise<UpdateError | number> {
        this.#logger.debug(
            'update: id=%s,  chips=%o, version=%s',
            id,
            chips,
            version,
        );
        if (!ObjectID.isValid(id)) {
            this.#logger.debug('update: Keine gueltige ObjectID');
            return { type: 'ChipsNotExists', id };
        }

        const validateResult = await this.#validateUpdate(chips, id, version);
        if (validateResult !== undefined) {
            return validateResult;
        }

        // findByIdAndReplace ersetzt ein Document mit ggf. weniger Properties
        // Weitere Methoden zum Aktualisieren:
        //    Document.findOneAndUpdate(update)
        //    document.updateOne(bedingung)
        const options = ChipsWriteService.UPDATE_OPTIONS;
        const updated = await this.#chipsModel.findByIdAndUpdate(
            //NOSONAR
            new ObjectID(id),
            chips,
            options,
        );
        if (updated === null) {
            this.#logger.debug('update: Kein Chips-Produkt mit id=%s', id);
            return { type: 'ChipsNotExists', id };
        }

        const versionUpdated = updated.__v as number;
        this.#logger.debug('update: versionUpdated=%s', versionUpdated);

        return versionUpdated;
    }

    /**
     * Ein Chips-Produkt wird asynchron anhand seiner ID gelöscht.
     *
     * @param id ID des zu löschenden Chips-Produktes
     * @returns true, falls das Chips-Produkt vorhanden war und gelöscht wurde. Sonst false.
     */
    async delete(idStr: string) {
        this.#logger.debug('delete: idStr=%s', idStr);
        if (!ObjectID.isValid(idStr)) {
            this.#logger.debug('delete: Keine gueltige ObjectID');
            return false;
        }

        // Das Chips-Produkt zur gegebenen ID asynchron loeschen
        const deleted = await this.#chipsModel //NOSONAR
            .findByIdAndDelete(new ObjectID(idStr))
            .lean<Chips | null>();
        this.#logger.debug('delete: deleted=%o', deleted);
        return deleted !== null;

        // Weitere Methoden von mongoose, um zu loeschen:
        //  Chips.findByIdAndRemove(id)
        //  Chips.findOneAndRemove(bedingung)
    }

    async #validateCreate(chips: Chips): Promise<CreateError | undefined> {
        const messages = this.#validationService.validate(chips);
        if (messages.length > 0) {
            this.#logger.debug('#validateCreate: messages=%o', messages);
            return { type: 'ConstraintViolations', messages };
        }

        // statt 2 sequentiellen DB-Zugriffen waere 1 DB-Zugriff mit OR besser

        const { produktname } = chips;
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        if (await this.#chipsModel.exists({ produktname })) {
            //NOSONAR
            return { type: 'ProduktnameExists', produktname };
        }

        this.#logger.debug('#validateCreate: ok');
        return undefined;
    }

    async #sendmail(chips: ChipsDocument) {
        const subject = `Neues Chips-Produkt ${chips.id as string}`;
        const body = `Das Chips-Produkt mit dem Produktnamen <strong>${chips.produktname}</strong> ist angelegt`;
        await this.#mailService.sendmail(subject, body);
    }

    async #validateUpdate(
        chips: Chips,
        id: string,
        versionStr: string,
    ): Promise<UpdateError | undefined> {
        const result = this.#validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        this.#logger.debug(
            '#validateUpdate: chips=%o, version=%s',
            chips,
            version,
        );

        const messages = this.#validationService.validate(chips);
        if (messages.length > 0) {
            return { type: 'ConstraintViolations', messages };
        }

        const resultProduktname = await this.#checkProduktnameExists(chips);
        if (resultProduktname !== undefined && resultProduktname.id !== id) {
            return resultProduktname;
        }

        const resultIdAndVersion = await this.#checkIdAndVersion(id, version);
        if (resultIdAndVersion !== undefined) {
            return resultIdAndVersion;
        }

        this.#logger.debug('#validateUpdate: ok');
        return undefined;
    }

    #validateVersion(version: string | undefined): VersionInvalid | number {
        if (
            version === undefined ||
            !ChipsWriteService.VERSION_PATTERN.test(version)
        ) {
            const error: VersionInvalid = { type: 'VersionInvalid', version };
            this.#logger.debug('#validateVersion: VersionInvalid=%o', error);
            return error;
        }

        return Number.parseInt(version.slice(1, -1), 10);
    }

    async #checkProduktnameExists(
        chips: Chips,
    ): Promise<ProduktnameExists | undefined> {
        const { produktname } = chips;

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        const result = await this.#chipsModel.findOne(
            { produktname },
            { _id: true },
        ); //NOSONAR
        if (result !== null) {
            const id = result._id.toString();
            this.#logger.debug('#checkTitelExists: id=%s', id);
            return { type: 'ProduktnameExists', produktname, id };
        }

        this.#logger.debug('#checkTitelExists: ok');
        return undefined;
    }

    async #checkIdAndVersion(
        id: string,
        version: number,
    ): Promise<ChipsNotExists | VersionOutdated | undefined> {
        const chipsDb = await this.#chipsModel.findById(id); //NOSONAR
        if (chipsDb === null) {
            const result: ChipsNotExists = { type: 'ChipsNotExists', id };
            this.#logger.debug('#checkIdAndVersion: ChipsNotExists=%o', result);
            return result;
        }

        // nullish coalescing
        const versionDb = (chipsDb.__v ?? 0) as number;
        if (version < versionDb) {
            const result: VersionOutdated = {
                type: 'VersionOutdated',
                id,
                version,
            };
            this.#logger.debug(
                '#checkIdAndVersion: VersionOutdated=%o',
                result,
            );
            return result;
        }

        return undefined;
    }
}
