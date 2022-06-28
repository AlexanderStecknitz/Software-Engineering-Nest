/*
 * Copyright (C) 2020 - present Juergen Zimmermann, Hochschule Karlsruhe
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

// https://jestjs.io/docs/configuration
// https://kulshekhar.github.io/ts-jest/docs/guides/esm-support
// https://github.com/BenSjoberg/nest-esm-import-issue-example

import { type Config } from '@jest/types';

const jestConfig: Config.InitialOptions = {
    // Verzeichnis in node_modules mit einer Datei jest-preset.js
    preset: 'ts-jest',

    extensionsToTreatAsEsm: ['.ts', '.json'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1', // eslint-disable-line @typescript-eslint/naming-convention
    },
    // transform: {
    //     '^.+\\.(t|j)s$': 'ts-jest', // eslint-disable-line @typescript-eslint/naming-convention
    // },

    testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
    collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
    // coverageDirectory: 'coverage',
    testEnvironment: 'node',

    bail: true,
    coveragePathIgnorePatterns: [
        '<rootDir>/src/main.ts',
        '.*\\.module\\.ts$',
        '<rootDir>/src/health/',
    ],
    coverageReporters: ['text-summary', 'html'],
    errorOnDeprecated: true,
    testTimeout: 10_000,
    verbose: true,
};

export default jestConfig;
