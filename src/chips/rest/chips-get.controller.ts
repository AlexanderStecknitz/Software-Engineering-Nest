// file deepcode ignore XSS: <please specify a reason of ignoring this>
/**
 * Das Modul besteht aus der Controller-Klasse für Lesen an der REST-Schnittstelle.
 * @packageDocumentation
 */

// eslint-disable-next-line max-classes-per-file
import {
    ApiBearerAuth,
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Chips, type ChipsDocument, type ChipsTyp } from '../entity/index.js';
import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    Param,
    Query,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../security/index.js';
import { Request, Response } from 'express';
import { ResponseTimeInterceptor, getLogger } from '../../logger/index.js';
import { ChipsReadService } from '../service/index.js';
import { type ObjectID } from 'bson';
import { getBaseUri } from './getBaseUri.js';
import { paths } from '../../config/index.js';

// TypeScript
interface Link {
    href: string;
}
interface Links {
    self: Link;
    // optional
    list?: Link;
    add?: Link;
    update?: Link;
    remove?: Link;
}

// Interface fuer GET-Request mit Links fuer HATEOAS
// DTO = data transfer object
export interface ChipsDTO extends Chips {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links: Links;
}

export interface ChipsProdukteDTO {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _embedded: {
        chipsProdukte: ChipsDTO[];
    };
}

/**
 * Klasse für `ChipsGetController`, um Queries in _OpenAPI_ bzw. Swagger zu
 * formulieren. `ChipsController` hat dieselben Properties wie die Basisklasse
 * `Chips` - allerdings mit dem Unterschied, dass diese Properties beim Ableiten
 * so überschrieben sind, dass sie auch nicht gesetzt bzw. undefined sein
 * dürfen, damit die Queries flexibel formuliert werden können. Deshalb ist auch
 * immer der zusätzliche Typ undefined erforderlich.
 * Außerdem muss noch `string` statt `Date` verwendet werden, weil es in OpenAPI
 * den Typ Date nicht gibt.
 */
export class ChipsQuery extends Chips {
    @ApiProperty({ required: false })
    declare readonly produktname: string | undefined;

    @ApiProperty({ required: false })
    declare readonly geschmack: string | undefined;

    @ApiProperty({ required: false })
    declare readonly chipsTyp: ChipsTyp | undefined;

    @ApiProperty({ required: false })
    declare readonly preis: number | undefined;

    @ApiProperty({ required: false })
    declare readonly bestand: number | undefined;

    @ApiProperty({ required: false })
    declare readonly rabatt: number | undefined;

    @ApiProperty({ required: false })
    declare readonly lieferbar: boolean | undefined;

    @ApiProperty({ example: true, type: Boolean, required: false })
    readonly javascript: boolean | undefined;

    @ApiProperty({ example: true, type: Boolean, required: false })
    readonly typescript: boolean | undefined;
}

/**
 * Die Controller-Klasse für die Verwaltung von Chips.
 */
// Decorator in TypeScript
@Controller(paths.api)
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('REST-API')
@ApiBearerAuth()
// Klassen ab ES 2015
export class ChipsGetController {
    // readonly in TypeScript, vgl. C#
    // private ab ES 2019
    readonly #service: ChipsReadService;

    readonly #logger = getLogger(ChipsGetController.name);

    // Dependency Injection (DI) bzw. Constructor Injection
    // constructor(private readonly service: ChipsReadService) {}
    constructor(service: ChipsReadService) {
        this.#service = service;
    }

    /**
     * Ein Chips wird asynchron anhand seiner ID als Pfadparameter gesucht.
     *
     * Falls es ein solches Chips gibt und `If-None-Match` im Request-Header
     * auf die aktuelle Version des Chipses gesetzt war, wird der Statuscode
     * `304` (`Not Modified`) zurückgeliefert. Falls `If-None-Match` nicht
     * gesetzt ist oder eine veraltete Version enthält, wird das gefundene
     * Chips im Rumpf des Response als JSON-Datensatz mit Atom-Links für HATEOAS
     * und dem Statuscode `200` (`OK`) zurückgeliefert.
     *
     * Falls es kein Chips zur angegebenen ID gibt, wird der Statuscode `404`
     * (`Not Found`) zurückgeliefert.
     *
     * @param id Pfad-Parameter `id`
     * @param req Request-Objekt von Express mit Pfadparameter, Query-String,
     *            Request-Header und Request-Body.
     * @param version Versionsnummer im Request-Header bei `If-None-Match`
     * @param accept Content-Type bzw. MIME-Type
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // vgl Kotlin: Schluesselwort "suspend"
    // eslint-disable-next-line max-params, max-lines-per-function
    @Get(':id')
    @ApiOperation({ summary: 'Chips mit der ID suchen' })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 000000000000000000000001',
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header für bedingte GET-Requests, z.B. "0"',
        required: false,
    })
    @ApiOkResponse({ description: 'Diese Chips wurden gefunden' })
    @ApiNotFoundResponse({ description: 'Keine Chips zur ID gefunden' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Diese Chips wurden bereits heruntergeladen',
    })
    async findById(
        @Param('id') id: string,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ) {
        this.#logger.debug('findById: id=%s, version=%s"', id, version);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('findById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        let chips: ChipsDocument | undefined;
        try {
            // vgl. Kotlin: Aufruf einer suspend-Function
            chips = await this.#service.findById(id);
        } catch (err) {
            // err ist implizit vom Typ "unknown", d.h. keine Operationen koennen ausgefuehrt werden
            // Exception einer export async function bei der Ausfuehrung fangen:
            // https://strongloop.com/strongblog/comparing-node-js-promises-trycatch-zone-js-angular
            this.#logger.error('findById: error=%o', err);
            return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        if (chips === undefined) {
            this.#logger.debug('findById: NOT_FOUND');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }
        this.#logger.debug('findById(): chip=%o', chips);

        // ETags
        const versionDb = chips.__v as number;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('findById: NOT_MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        this.#logger.debug('findById: versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        // HATEOAS mit Atom Links und HAL (= Hypertext Application Language)
        const chipsDTO = this.#toDTO(chips, req, id);
        this.#logger.debug('findById: chipDTO=%o', chipsDTO);
        return res.json(chipsDTO);
    }

    /**
     * Chips werden mit Query-Parametern asynchron gesucht. Falls es mindestens
     * ein solches Chips gibt, wird der Statuscode `200` (`OK`) gesetzt. Im Rumpf
     * des Response ist das JSON-Array mit den gefundenen Chips, die jeweils
     * um Atom-Links für HATEOAS ergänzt sind.
     *
     * Falls es kein Chips zu den Suchkriterien gibt, wird der Statuscode `404`
     * (`Not Found`) gesetzt.
     *
     * Falls es keine Query-Parameter gibt, werden alle Chips ermittelt.
     *
     * @param query Query-Parameter von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get()
    @ApiOperation({ summary: 'Chips mit Suchkriterien suchen' })
    @ApiOkResponse({ description: 'Eine evtl. leere Liste mit Chips' })
    async find(
        @Query() query: ChipsQuery,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        this.#logger.debug('find: query=%o', query);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('find: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const chipsProdukte = await this.#service.find(query);
        this.#logger.debug('find: %o', chipsProdukte);
        if (chipsProdukte.length === 0) {
            this.#logger.debug('find: NOT_FOUND');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }

        // HATEOAS: Atom Links je Chips
        const chipsProdukteDTO = chipsProdukte.map((chips) => {
            const id = (chips.id as ObjectID).toString();
            return this.#toDTO(chips, req, id, false);
        });
        this.#logger.debug('find: chipsDTO=%o', chipsProdukteDTO);

        const result: ChipsProdukteDTO = {
            _embedded: { chipsProdukte: chipsProdukteDTO },
        };
        return res.json(result).send();
    }

    // eslint-disable-next-line max-params
    #toDTO(chips: ChipsDocument, req: Request, id: string, all = true) {
        const baseUri = getBaseUri(req);
        this.#logger.debug('#toDTO: baseUri=%s', baseUri);
        const links = all
            ? {
                  self: { href: `${baseUri}/${id}` },
                  list: { href: `${baseUri}` },
                  add: { href: `${baseUri}` },
                  update: { href: `${baseUri}/${id}` },
                  remove: { href: `${baseUri}/${id}` },
              }
            : { self: { href: `${baseUri}/${id}` } };

        this.#logger.debug('#toDTO: chips=%o, links=%o', chips, links);
        const chipsDTO: ChipsDTO = {
            produktname: chips.produktname,
            geschmack: chips.geschmack,
            typ: chips.typ,
            bestand: chips.bestand,
            preis: chips.preis,
            rabatt: chips.rabatt,
            lieferbar: chips.lieferbar,
            schlagwoerter: chips.schlagwoerter,
            _links: links,
        };
        return chipsDTO;
    }
}
