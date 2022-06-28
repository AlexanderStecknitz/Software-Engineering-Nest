import {
    ChipsFileController,
    ChipsGetController,
    ChipsWriteController,
} from './rest/index.js';
import {
    ChipsFileService,
    ChipsReadService,
    ChipsValidationService,
    ChipsWriteService,
} from './service/index.js';
import { ChipsMutationResolver, ChipsQueryResolver } from './graphql/index.js';
import { chipsSchema, collectionName } from './entity/index.js';
import { AuthModule } from '../security/auth/auth.module.js';
import { DbModule } from '../db/db.module.js';
import { MailModule } from '../mail/mail.module.js';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

/**
 * Das Modul besteht aus Controller- und Service-Klassen für die Verwaltung von
 * Chips-Produkten.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für Mongoose.
 */
@Module({
    imports: [
        MailModule,
        MongooseModule.forFeature([
            {
                name: collectionName,
                schema: chipsSchema,
                collection: collectionName,
            },
        ]),
        AuthModule,
        DbModule,
    ],
    controllers: [
        ChipsGetController,
        ChipsWriteController,
        ChipsFileController,
    ],
    // Provider sind z.B. Service-Klassen fuer DI
    providers: [
        ChipsReadService,
        ChipsWriteService,
        ChipsFileService,
        ChipsValidationService,
        ChipsQueryResolver,
        ChipsMutationResolver,
    ],
    // Export der Provider fuer DI in anderen Modulen
    exports: [
        ChipsReadService,
        ChipsWriteService,
        ChipsValidationService,
        ChipsFileService,
    ],
})
export class ChipsModule {}
