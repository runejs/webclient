import axios from 'axios';
import { Buffer } from 'buffer';
import { ArchiveConfig } from './archive-config';
import { SpriteState, SpriteTranscoder } from './sprites/sprite-transcoder';
import { ByteBuffer } from '@runejs/common';
import { gunzipSync } from 'browserify-zlib';
import { Font, fontNames } from './fonts/font';
import { createContext } from 'react';
import { Rs2Model } from './models/rs2-model';
import { Rs2ModelDecoder } from './models/rs2-model-decoder';
import { TextureFileDecoder } from './maps/texture-file-decoder';


export enum FileCompression {
    none = 0,
    bzip = 1,
    gzip = 2
}

export type CompressionMethod = 'none' | 'bzip' | 'gzip';

export const getCompressionMethod = (compression: FileCompression | number): CompressionMethod => {
    if (compression === 0 || compression > 2) {
        return 'none';
    }

    return compression === 1 ? 'bzip' : 'gzip';
};


const charCode = (letter: string) => letter.charCodeAt(0);
export const bunzipSync = async (compressedFileData: ByteBuffer) => {
    const buffer = Buffer.alloc(compressedFileData.length + 4);
    compressedFileData.copy(buffer, 4);
    buffer[0] = charCode('B');
    buffer[1] = charCode('Z');
    buffer[2] = charCode('h');
    buffer[3] = charCode('1');

    // @TODO fix me!
    // return new ByteBuffer(bz2.decompress(buffer));
    return null;
};


export class Store {

    private readonly groups = new Map<number, Map<number | string, Buffer>>();
    private readonly files = new Map<number, Map<number | string, Map<number, Buffer>>>();
    private _archiveConfig: { [key: string]: ArchiveConfig };

    decompress(compressedData: ByteBuffer | Buffer): ByteBuffer | null {
        if (!compressedData?.length) {
            return null;
        }

        compressedData = new ByteBuffer(compressedData);
        compressedData.readerIndex = 0;

        console.log(compressedData);

        const compression = getCompressionMethod(compressedData.get('byte', 'unsigned'));
        const compressedLength = compressedData.get('int', 'unsigned');
        console.log(`compression = ${compression}, compressedLength = ${compressedLength}`);

        const readerIndex = compressedData.readerIndex;

        compressedData.readerIndex = readerIndex;
        // @TODO xtea
        let data: ByteBuffer;

        if (compression === 'none') {
            // Uncompressed file
            data = new ByteBuffer(compressedLength);
            compressedData.copy(data, 0, compressedData.readerIndex, compressedLength);
            compressedData.readerIndex = (compressedData.readerIndex + compressedLength);
        } else {
            // BZIP or GZIP compressed file
            const decompressedLength = compressedData.get('int', 'unsigned');
            if (decompressedLength < 0) {
                console.error(`Invalid decompressed file length: ${decompressedLength}`);
            } else {
                const decompressedData = new ByteBuffer(compression === 'bzip' ?
                    decompressedLength : (compressedData.length - compressedData.readerIndex + 2));

                compressedData.copy(decompressedData, 0, compressedData.readerIndex);

                try {
                    data = compression === 'bzip' ? bunzipSync(decompressedData) :
                        gunzipSync(decompressedData);

                    compressedData.readerIndex = compressedData.readerIndex + compressedLength;

                    if (data.length !== decompressedLength) {
                        console.error(`Compression length mismatch.`);
                        data = null;
                    }
                } catch (error) {
                    console.error(`Unable to decompress file: ${error?.message ?? error}`);
                    data = null;
                }
            }
        }

        // Read the file footer, if it has one
        if (compressedData.readable >= 2) {
            // @TODO
            const version = compressedData.get('short', 'unsigned');
        }

        return data ?? null;
    }

    async get(archiveIndex: number, groupName: string): Promise<Buffer>;
    async get(archiveIndex: number, groupIndex: number): Promise<Buffer>;
    async get(archiveIndex: number, groupName: string, fileIndex: number): Promise<Buffer>;
    async get(archiveIndex: number, groupIndex: number, fileIndex: number): Promise<Buffer>;
    async get(archiveIndex: number, groupName: string, fileIndex?: number): Promise<Buffer>;
    async get(archiveIndex: number, groupIndex: number, fileIndex?: number): Promise<Buffer>;
    async get(archiveIndex: number, group: number | string, fileIndex?: number): Promise<Buffer> {
        if(fileIndex !== undefined) {
            if(!this.files.has(archiveIndex)) {
                this.files.set(archiveIndex, new Map<number, Map<number, Buffer>>());
            }

            if(!this.files.get(archiveIndex).has(group)) {
                this.files.get(archiveIndex).set(group, new Map<number, Buffer>());
            }

            if(this.files.get(archiveIndex).get(group).has(fileIndex)) {
                return this.files.get(archiveIndex).get(group).get(fileIndex);
            }

            const response = await axios.get(
                `/store/archives/${ archiveIndex }/groups/${ group }/files/${ fileIndex }`, {
                    responseType: 'arraybuffer',
                    headers: {
                        'accept': 'arraybuffer'
                    }
                }
            );

            const compressedData = Buffer.from(response.data);
            const fileData = gunzipSync(compressedData);
            this.files.get(archiveIndex).get(group).set(fileIndex, fileData);
            return fileData;
        } else {
            if(!this.groups.has(archiveIndex)) {
                this.groups.set(archiveIndex, new Map<number, Buffer>());
            }

            if(this.groups.get(archiveIndex).has(group)) {
                return this.groups.get(archiveIndex).get(group);
            }

            const response = await axios.get(
                `/store/archives/${ archiveIndex }/groups/${ group }`, {
                    responseType: 'arraybuffer',
                    headers: {
                        'accept': 'arraybuffer'
                    }
                }
            );

            const compressedData = Buffer.from(response.data);
            const fileData = gunzipSync(compressedData);
            this.groups.get(archiveIndex).set(group, fileData);
            return fileData;
        }
    }

    async getModel(modelId: number): Promise<Rs2Model> {
        return await Rs2ModelDecoder.getModel(modelId);
    }

    async getSprite(spriteName: string, spriteIndex: number): Promise<SpriteState> {
        return await SpriteTranscoder.getSprite(spriteName, spriteIndex);
    }

    async getTexture(textureId: number) {
        const texture = await TextureFileDecoder.decode(textureId);

        if (!texture) {
            return null;
        }

        return texture;
    }

    async loadFonts(): Promise<Map<string, Font>> {
        for(const fontName of fontNames) {
            await new Font(fontName).load();
        }

        return Font.fonts;
    }

    async getLoginBackground(): Promise<string> {
        return 'data:image/jpg;base64,'
            + Buffer.from(await this.get(10, 0)).toString('base64');
    }

    async getArchiveConfig(): Promise<{ [key: string]: ArchiveConfig }> {
        const response = await axios.get<{ [key: string]: ArchiveConfig }>(`/store/config`);
        this._archiveConfig = response.data;
        for(const [ , archiveConfig ] of Object.entries(this._archiveConfig)) {
            this.groups.set(archiveConfig.index, new Map<number, Buffer>());
        }
        return this._archiveConfig;
    }

    get archiveConfig() {
        return this._archiveConfig;
    }
}


export interface StoreState {
    archiveConfig?: { [key: string]: ArchiveConfig };
    fontsLoaded?: boolean;
    fonts?: Map<string, Font>;
}


export const StoreContext = createContext<StoreState>({});


export const store = new Store();
