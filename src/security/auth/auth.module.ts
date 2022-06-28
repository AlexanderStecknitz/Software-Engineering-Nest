import { AuthService, UserService } from './service/index.js';
import { AuthController } from './auth.controller.js';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt/index.js';
import { LocalStrategy } from './local/index.js';
import { LoginResolver } from './login.resolver.js';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { jwtConfig } from '../../config/index.js';

const { privateKey, signOptions, verifyOptions } = jwtConfig;

/**
 * Das Modul besteht aus den Klassen für die Authentifizierung.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse, so dass u.a. die Klasse `AuthService` injiziert
 * werden kann.
 */
@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        // https://stackoverflow.com/questions/55091698/nestjs-passport-jwtstrategy-never-being-called-with-rs256-tokens
        JwtModule.register({ privateKey, signOptions, verifyOptions }),
    ],
    controllers: [AuthController],
    // Provider sind z.B. injizierbare Klassen (Service-Klassen)
    providers: [
        AuthService,
        UserService,
        LocalStrategy,
        JwtStrategy,
        LoginResolver,
    ],
    exports: [AuthService, UserService],
})
export class AuthModule {}
