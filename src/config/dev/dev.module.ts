/*
 * Copyright (C) 2021 - present Juergen Zimmermann, Florian Goebel, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import { chipsSchema, modelName } from '../../chips/entity/index.js';
import { DbModule } from '../../db/db.module.js';
import { DbPopulateService } from './db-populate.service.js';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [
        DbModule,
        MongooseModule.forFeature([
            {
                name: modelName,
                schema: chipsSchema,
            },
        ]),
    ],
    providers: [DbPopulateService],
    exports: [DbPopulateService],
})
export class DevModule {}
