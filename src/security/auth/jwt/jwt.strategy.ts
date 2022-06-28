import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { getLogger } from '../../../logger/index.js';
import { jwtConfig } from '../../../config/index.js';

const { algorithm, publicKey } = jwtConfig;

export interface UserPayload {
    userId: number;
    username: string;
}

/**
 * Mit `JwtStrategy` wird im Konstruktor verifziert, wie ein JWT verifiziert
 * wird, z.B. mit _RS256_ (Public/Private Key) oder _HS256_ (Passwort, default).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    readonly #logger = getLogger(JwtStrategy.name);

    constructor() {
        // https://stackoverflow.com/questions/55091698/nestjs-passport-jwtstrategy-never-being-called-with-rs256-tokens
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: publicKey,
            algorithms: [algorithm],
            ignoreExpiration: false,
        });
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async validate(payload: any) {
        this.#logger.debug('validate: payload=%o', payload);
        /* eslint-disable @typescript-eslint/no-unsafe-assignment */
        const userPayload: UserPayload = {
            userId: payload.sub,
            username: payload.username,
        };
        /* eslint-enable @typescript-eslint/no-unsafe-assignment */
        this.#logger.debug('validate: userPayload=%o', userPayload);
        return userPayload;
    }
}
