import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ResponseTimeInterceptor, getLogger } from '../../logger/index.js';
import { AuthService } from './service/index.js';
import { UseInterceptors } from '@nestjs/common';
import { UserInputError } from 'apollo-server-express';

// @nestjs/graphql fasst die Input-Daten zu einem Typ zusammen
interface LoginInput {
    readonly username: string;
    readonly password: string;
}

@Resolver('login')
@UseInterceptors(ResponseTimeInterceptor)
export class LoginResolver {
    readonly #service: AuthService;

    readonly #logger = getLogger(LoginResolver.name);

    constructor(service: AuthService) {
        this.#service = service;
    }

    @Mutation()
    async login(@Args() input: LoginInput) {
        this.#logger.debug('login: input=%o', input);
        const { username, password } = input;
        const user = await this.#service.validateUser(username, password);
        if (user === undefined) {
            throw new UserInputError(
                'Falscher Benutzername oder falsches Passwort',
            );
        }
        const result = await this.#service.login(user);
        this.#logger.debug('login: result=%o', result);
        return result;
    }
}
