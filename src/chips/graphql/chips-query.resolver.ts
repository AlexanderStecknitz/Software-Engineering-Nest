import { Args, Query, Resolver } from '@nestjs/graphql';
import { type Chips, type ChipsDocument } from '../entity/index.js';
import { ResponseTimeInterceptor, getLogger } from '../../logger/index.js';
import { ChipsReadService } from '../service/index.js';
import { UseInterceptors } from '@nestjs/common';
import { UserInputError } from 'apollo-server-express';

export type ChipsDTO = Chips & {
    id: string;
    version: number;
};

export interface ChipsUpdateInput {
    id?: string;
    version?: number;
    chips: Chips;
}

interface Id {
    id: string;
}

@Resolver()
@UseInterceptors(ResponseTimeInterceptor)
export class ChipsQueryResolver {
    readonly #service: ChipsReadService;

    readonly #logger = getLogger(ChipsQueryResolver.name);

    constructor(service: ChipsReadService) {
        this.#service = service;
    }

    @Query('chips')
    async findById(@Args() id: Id) {
        const idStr = id.id;
        this.#logger.debug('findById: id=%s', idStr);

        const chips = await this.#service.findById(idStr);
        if (chips === undefined) {
            // UserInputError liefert Statuscode 200
            // Weitere Error-Klasse in apollo-server-errors:
            // SyntaxError, ValidationError, AuthenticationError, ForbiddenError,
            // PersistedQuery, PersistedQuery
            // https://www.apollographql.com/blog/graphql/error-handling/full-stack-error-handling-with-graphql-apollo
            throw new UserInputError(
                `Es wurden keine Chips mit der ID ${idStr} gefunden.`,
            );
        }
        const chipsDTO = this.#toChipsDTO(chips);
        this.#logger.debug('findById: chipsDTO=%o', chipsDTO);
        return chipsDTO;
    }

    @Query('chipsProdukte')
    async find(@Args() produktname: { produktname: string } | undefined) {
        const produktnameStr = produktname?.produktname;
        this.#logger.debug('find: produktname=%s', produktnameStr);
        const suchkriterium =
            produktnameStr === undefined ? {} : { produktname: produktnameStr };
        const chipsProdukte = await this.#service.find(suchkriterium);
        if (chipsProdukte.length === 0) {
            // UserInputError liefert Statuscode 200
            throw new UserInputError('Es wurden keine Chips gefunden.');
        }

        const chipsProdukteDTO = chipsProdukte.map((chips) =>
            this.#toChipsDTO(chips),
        );
        this.#logger.debug('find: chipsProdukteDTO=%o', chipsProdukteDTO);
        return chipsProdukteDTO;
    }

    // Resultat mit id (statt _id) und version (statt __v)
    // __ ist bei GraphQL fuer interne Zwecke reserviert
    #toChipsDTO(chips: ChipsDocument) {
        const chipsDTO: ChipsDTO = {
            id: chips._id.toString(),
            version: chips.__v as number,
            produktname: chips.produktname,
            geschmack: chips.geschmack,
            typ: chips.typ,
            bestand: chips.bestand,
            preis: chips.preis,
            rabatt: chips.rabatt,
            lieferbar: chips.lieferbar,
            schlagwoerter: chips.schlagwoerter,
        };
        return chipsDTO;
    }
}
