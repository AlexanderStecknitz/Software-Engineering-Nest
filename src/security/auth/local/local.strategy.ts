import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../service/auth.service.js';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { getLogger } from '../../../logger/index.js';

/**
 * Implementierung der _lokalen Strategie_ für Passport, so dass zu gegebenem
 * Benutzername und Passwort das `User`-Objekt ermittelt wird, falls das
 * mitgelieferte Passwort korrekt ist. Bei Passport http://www.passportjs.org
 * gibt es über 300 verschiedene Strategien.
 * `local` ist der Default-Name fuer _Passport Local Strategy_.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    readonly #authService: AuthService;

    readonly #logger = getLogger(LocalStrategy.name);

    /**
     * DI, so dass mit dem `AuthService` ein `User`-Objekt ermittelt werden
     * kann und dass dabei auch protokolliert werden kann.
     */
    constructor(authService: AuthService) {
        // Passport verwendet als Default die Properties "username"und "password"
        // http://www.passportjs.org/docs/configure
        super();
        this.#authService = authService;
    }

    /**
     * Validierung gemäß Passport, d.h. zu gegebenem Benutzername und Passwort
     * wird das `User`-Objekt ermittelt, falls das mitgelieferte Passwort
     * korrekt ist.
     * @param username Benutzername
     * @param password Passwort
     * @return Das User-Objekt bei erfolgreicher Validierung. Passwort verwendet
     *  den allgemeinen Typ any.
     */
    async validate(username: string, password: string): Promise<any> {
        this.#logger.debug('validate: username=%s, password=*****', username); //NOSONAR
        const user = await this.#authService.validateUser(username, password);
        this.#logger.debug('validate: user=%o', user);
        if (user === undefined) {
            // Zur userid in der Payload des Tokens gibt es keinen User
            // Was ist das fuer ein Token? Wer verwendet einen solchen Token?!
            // Deshalb: KEINE Information liefern, dass es keinen User gibt
            //          d.h. nicht 401 sondern 403 als Statuscode
            throw new UnauthorizedException();
        }
        return user;
    }
}
