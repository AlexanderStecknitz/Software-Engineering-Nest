// file deepcode ignore XSS: <please specify a reason of ignoring this>
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ChipsFileService, type FileFindError } from '../service/index.js';
import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Put,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { Express, Response } from 'express';
import { JwtAuthGuard, Roles, RolesGuard } from '../../security/index.js';
import { ResponseTimeInterceptor, getLogger } from '../../logger/index.js';
import { FileInterceptor } from '@nestjs/platform-express';
import fileTypePkg from 'file-type';

@Controller('file')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('REST-API')
export class ChipsFileController {
    readonly #service: ChipsFileService;

    readonly #logger = getLogger(ChipsFileController.name);

    constructor(service: ChipsFileService) {
        this.#service = service;
    }

    @Put(':id')
    @Roles('admin', 'mitarbeiter')
    @HttpCode(HttpStatus.NO_CONTENT)
    // name= innerhalb von "multipart/form-data" ist auf "file" gesetzt
    // und wird zu File.fieldname
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    async upload(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        this.#logger.debug('upload: id=%s', id);
        const { fieldname, originalname, size, buffer } = file;
        this.#logger.debug(
            'upload: fieldname=%s, originalname=%s, mimetype=%s, size=%d',
            fieldname,
            originalname,
            size,
        );

        const fileType = await fileTypePkg.fromBuffer(buffer);
        this.#logger.debug('upload: fileType=%o', fileType);

        await this.#service.save(id, buffer, fileType);
    }

    @Get(':id')
    async download(@Param('id') id: string, @Res() res: Response) {
        this.#logger.debug('download: %s', id);

        const findResult = await this.#service.find(id);
        if (findResult.type !== 'FileFindSuccess') {
            return this.#handleFileFindError(findResult, res);
        }

        const file = findResult;
        const { readStream, contentType } = file;
        res.contentType(contentType);
        // https://www.freecodecamp.org/news/node-js-streams-everything-you-need-to-know-c9141306be93
        return readStream.pipe(res);
    }

    #handleFileFindError(err: FileFindError, res: Response) {
        switch (err.type) {
            case 'ChipsNotExists': {
                const { id } = err;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const msg = `Es gibt kein Chips mit der ID "${id!}".`;
                this.#logger.debug(
                    'ChipsFileRequestHandler.handleDownloadError(): msg=%s',
                    msg,
                );
                return res
                    .status(HttpStatus.PRECONDITION_FAILED)
                    .set('Content-Type', 'text/plain')
                    .send(msg);
            }

            case 'FileNotFound': {
                const { filename } = err;
                const msg = `Es gibt kein File mit Name ${filename}`;
                this.#logger.debug(
                    'ChipsFileRequestHandler.handleDownloadError(): msg=%s',
                    msg,
                );
                return res.status(HttpStatus.NOT_FOUND).send(msg);
            }

            case 'MultipleFiles': {
                const { filename } = err;
                const msg = `Es gibt mehr als ein File mit Name ${filename}`;
                this.#logger.debug(
                    'ChipsFileRequestHandler.handleDownloadError(): msg=%s',
                    msg,
                );
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(msg);
            }

            default:
                return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
