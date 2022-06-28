/**
 * Das Modul besteht aus der Controller-Klasse für Lesen an der REST-Schnittstelle.
 * @packageDocumentation
 */

import { cloud, nodeConfig } from '../../config/index.js';
import RE2 from 're2';
import { type Request } from 'express';

const ID_SUFFIX_PATTERN = new RE2('/[\\dA-Fa-f]{24}$');
const port = cloud === undefined ? `:${nodeConfig.port}` : '';

export const getBaseUri = (req: Request) => {
    const { protocol, hostname, url } = req;
    let basePath = url.includes('?') ? url.slice(0, url.lastIndexOf('?')) : url;
    if (ID_SUFFIX_PATTERN.test(basePath)) {
        basePath = basePath.slice(0, basePath.lastIndexOf('/'));
    }
    const schema = cloud === 'heroku' ? 'https' : protocol;
    return `${schema}://${hostname}${port}${basePath}`;
};
