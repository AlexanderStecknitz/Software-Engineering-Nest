/**
 * Das Modul besteht aus der Klasse {@linkcode ChipsFileService}, damit
 * Binärdateien mit dem Treiber von _MongoDB_ in _GridFS_ abgespeichert und
 * ausgelesen werden können.
 * @packageDocumentation
 */

import {
    type ChipsNotExists,
    type FileFindError,
    type FileNotFound,
    type MultipleFiles,
} from './errors.js';
import {
    GridFSBucket,
    type GridFSBucketReadStream,
    type GridFSFile,
} from 'mongodb';
import { ChipsReadService } from './chips-read.service.js';
import { DbService } from '../../db/db.service.js';
import { type FileTypeResult } from 'file-type';
import { Injectable } from '@nestjs/common';
import { dbConfig } from '../../config/index.js';
import { getLogger } from '../../logger/index.js';
import intoStream from 'into-stream';

/**
 * Das Interface {@linkcode FileFindSuccess} beschreibt das Resultat, wenn eine
 * Binärdatei gefunden wurde und besteht aus dem Stream zum Lesen sowie dem
 * MIME-Type.
 */
export interface FileFindSuccess {
    type: 'FileFindSuccess';
    readStream: GridFSBucketReadStream;
    contentType: string;
}

/**
 * Mit der Klasse {@linkcode ChipsFileService} können Binärdateien mit dem
 * Treiber von _MongoDB_ in _GridFS_ abgespeichert und ausgelesen werden.
 */
@Injectable()
export class ChipsFileService {
    readonly #service: ChipsReadService;

    readonly #dbService: DbService;

    readonly #logger = getLogger(ChipsFileService.name);

    constructor(service: ChipsReadService, dbService: DbService) {
        this.#service = service;
        this.#dbService = dbService;
    }

    /**
     * Asynchrones Abspeichern einer Binärdatei.
     *
     * @param filename ID der zugehörigen Chips, die als Dateiname verwendet wird.
     * @param buffer Node-Buffer mit den Binärdaten.
     * @param contentType MIME-Type, z.B. `image/png`.
     * @returns true, falls die Binärdaten abgespeichert wurden. Sonst false.
     */
    async save(
        filename: string,
        buffer: Buffer,
        fileType: FileTypeResult | undefined,
    ) {
        this.#logger.debug(
            'save: filename=%s, fileType=%o',
            filename,
            fileType,
        );

        if (fileType === undefined) {
            return false;
        }

        // Gibt es Chips zur angegebenen ID?
        const chips = await this.#service.findById(filename); //NOSONAR
        if (chips === undefined) {
            return false;
        }

        const client = await this.#dbService.connect();
        const bucket = new GridFSBucket(client.db(dbConfig.dbName));
        await this.#delete(filename, bucket);

        const stream = intoStream(buffer);
        const options = { contentType: fileType.mime };
        stream.pipe(bucket.openUploadStream(filename, options));
        return true;
    }

    /**
     * Asynchrones Suchen nach einer Binärdatei in _GridFS_ anhand des Dateinamens.
     * @param filename Der Dateiname der Binärdatei.
     * @returns GridFSBucketReadStream, falls es eine Binärdatei mit dem
     *  angegebenen Dateinamen gibt. Im Fehlerfall ein JSON-Objekt vom Typ:
     * - {@linkcode ChipsNotExists}
     * - {@linkcode FileNotFound}
     * - {@linkcode MultipleFiles}
     */
    async find(filename: string): Promise<FileFindError | FileFindSuccess> {
        this.#logger.debug('find: filename=%s', filename);
        const resultCheckFilename = await this.#checkFilename(filename);
        if (resultCheckFilename !== undefined) {
            return resultCheckFilename;
        }

        // https://mongodb.github.io/node-mongodb-native/3.5/tutorials/gridfs/streaming
        const client = await this.#dbService.connect();
        const bucket = new GridFSBucket(client.db(dbConfig.dbName));
        const contentType = await this.#getContentType(filename, bucket);
        if (typeof contentType !== 'string') {
            return { type: 'InvalidContentType' };
        }
        this.#logger.debug('find: contentType=%s', contentType);

        // https://mongodb.github.io/node-mongodb-native/3.5/tutorials/gridfs/streaming/#downloading-a-file
        // https://www.freecodecamp.org/news/node-js-streams-everything-you-need-to-know-c9141306be93
        const readStream = bucket.openDownloadStreamByName(filename);
        const result: FileFindSuccess = {
            type: 'FileFindSuccess',
            readStream,
            contentType,
        };
        return result;
    }

    async #delete(filename: string, bucket: GridFSBucket) {
        this.#logger.debug('#delete: filename=%s', filename);
        const idObjects: GridFSFile[] = await bucket
            .find({ filename })
            .toArray();
        const ids = idObjects.map((obj) => obj._id);
        this.#logger.debug('#delete: ids=%o', ids);
        ids.forEach((fileId) =>
            bucket.delete(fileId, () =>
                this.#logger.debug('#delete: geloeschte File-ID=%s', fileId),
            ),
        );
    }

    async #checkFilename(
        filename: string,
    ): Promise<ChipsNotExists | undefined> {
        this.#logger.debug('#checkFilename: filename=%s', filename);

        // Gibt es Chips mit dem gegebenen "filename" als ID?
        const chips = await this.#service.findById(filename); //NOSONAR
        if (chips === undefined) {
            const result: ChipsNotExists = {
                type: 'ChipsNotExists',
                id: filename,
            };
            this.#logger.debug('#checkFilename: ChipsNotExists=%o', result);
            return result;
        }

        this.#logger.debug('#checkFilename: chips vorhanden=%o', chips);
        return undefined;
    }

    async #getContentType(filename: string, bucket: GridFSBucket) {
        let files: GridFSFile[];
        try {
            files = await bucket.find({ filename }).toArray();
        } catch (err) {
            this.#logger.error('%o', err);
            files = [];
        }

        switch (files.length) {
            case 0: {
                const error = { type: 'FileNotFound', filename };
                this.#logger.debug('#getContentType: FileNotFound=%o', error);
                return error;
            }

            case 1: {
                const [file] = files;
                if (file === undefined) {
                    const error: FileNotFound = {
                        type: 'FileNotFound',
                        filename,
                    };
                    this.#logger.debug(
                        '#getContentType: FileNotFound=%o',
                        error,
                    );
                    return error;
                }

                const { contentType } = file;
                if (contentType === undefined) {
                    return { type: 'InvalidContentType' };
                }

                this.#logger.debug(
                    '#getContentType: contentType=%s',
                    contentType,
                );
                return contentType;
            }

            default: {
                const error: MultipleFiles = {
                    type: 'MultipleFiles',
                    filename,
                };
                this.#logger.debug('#getContentType: MultipleFiles=%o', error);
                return error;
            }
        }
    }
}
