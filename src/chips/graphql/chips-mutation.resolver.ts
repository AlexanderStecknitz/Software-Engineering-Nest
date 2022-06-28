import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
    ChipsWriteService,
    type CreateError,
    type UpdateError,
} from '../service/index.js';
import {
    JwtAuthGraphQlGuard,
    Roles,
    RolesGraphQlGuard,
} from '../../security/index.js';
import { ResponseTimeInterceptor, getLogger } from '../../logger/index.js';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Chips } from '../entity/index.js';
import { type ObjectId } from 'bson';
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

// Authentifizierung und Autorisierung durch
//  GraphQL Shield
//      https://www.graphql-shield.com
//      https://github.com/maticzav/graphql-shield
//      https://github.com/nestjs/graphql/issues/92
//      https://github.com/maticzav/graphql-shield/issues/213
//  GraphQL AuthZ
//      https://github.com/AstrumU/graphql-authz
//      https://www.the-guild.dev/blog/graphql-authz

@Resolver()
// alternativ: globale Aktivierung der Guards https://docs.nestjs.com/security/authorization#basic-rbac-implementation
@UseGuards(JwtAuthGraphQlGuard, RolesGraphQlGuard)
@UseInterceptors(ResponseTimeInterceptor)
export class ChipsMutationResolver {
    readonly #service: ChipsWriteService;

    readonly #logger = getLogger(ChipsMutationResolver.name);

    constructor(service: ChipsWriteService) {
        this.#service = service;
    }

    @Mutation()
    @Roles('admin', 'mitarbeiter')
    async create(@Args() input: Chips) {
        this.#logger.debug('createChips: input=%o', input);
        const result = await this.#service.create(input);
        this.#logger.debug('createChips: result=%o', result);
        if (Object.prototype.hasOwnProperty.call(result, 'type')) {
            // UserInputError liefert Statuscode 200
            throw new UserInputError(
                this.#errorMsgCreateChips(result as CreateError),
            );
        }
        return (result as ObjectId).toString();
    }

    @Mutation()
    @Roles('admin', 'mitarbeiter')
    async update(@Args() chipsDTO: ChipsUpdateInput) {
        this.#logger.debug('updateChips: chipsDTO=%o', chipsDTO);
        // nullish coalescing
        const { id, version, chips } = chipsDTO;
        const versionStr = `"${(version ?? 0).toString()}"`;

        const result = await this.#service.update(id!, chips, versionStr); // eslint-disable-line @typescript-eslint/no-non-null-assertion
        if (typeof result === 'object') {
            throw new UserInputError(this.#errorMsgUpdateChips(result));
        }
        this.#logger.debug('updateChips: result=%d', result);
        return result;
    }

    @Mutation()
    @Roles('admin')
    async delete(@Args() id: Id) {
        const idStr = id.id;
        this.#logger.debug('deleteChips: id=%s', idStr);
        const result = await this.#service.delete(idStr);
        this.#logger.debug('deleteChips: result=%s', result);
        return result;
    }

    #errorMsgCreateChips(err: CreateError) {
        switch (err.type) {
            case 'ConstraintViolations':
                return err.messages.join(' ');
            case 'ProduktnameExists':
                return `Der Produktname "${err.produktname}" existiert bereits`;
            default:
                return 'Unbekannter Fehler';
        }
    }

    #errorMsgUpdateChips(err: UpdateError) {
        switch (err.type) {
            case 'ConstraintViolations':
                return err.messages.join(' ');
            case 'ProduktnameExists':
                return `Der Produktname "${err.produktname}" existiert bereits`;
            case 'ChipsNotExists':
                return `Es gibt kein Chips-Produkt mit der ID ${err.id}`;
            case 'VersionInvalid':
                return `"${err.version}" ist keine gueltige Versionsnummer`;
            case 'VersionOutdated':
                return `Die Versionsnummer "${err.version}" ist nicht mehr aktuell`;
            default:
                return 'Unbekannter Fehler';
        }
    }
}
