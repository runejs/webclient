import axios from 'axios';
import { Buffer } from 'buffer';
import { ArchiveConfig } from './archive-config';
import { SpriteState, SpriteTranscoder } from './sprites/sprite-transcoder';
import { ByteBuffer, logger } from '@runejs/common';
import { Font, fontNames } from './fonts/font';
import { createContext } from 'react';
import { Rs2Model } from './models/rs2-model';
import { Rs2ModelDecoder } from './models/rs2-model-decoder';
import { TextureFileDecoder } from './maps/texture-file-decoder';
import { DoubleSide, Material, MeshPhongMaterial, TextureLoader } from 'three';
import { Bzip2, Gzip } from './compress';


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


interface FileDetails {
    key: number;
    name: string;
    nameHash: number;
}


interface GroupDetails extends FileDetails {
    childCount: number;
    children: FileDetails[];
}


const decompress = (buffer: Buffer): Buffer | null => {
    const compressedData = new ByteBuffer(buffer);

    const compressionMethod = getCompressionMethod(compressedData.get('byte', 'unsigned'));
    const compressedLength = compressedData.get('int', 'unsigned');

    let data: Buffer;

    if (compressionMethod === 'none') {
        // Uncompressed file
        data = Buffer.alloc(compressedLength);
        compressedData.copy(data, 0, compressedData.readerIndex, compressedLength);
        compressedData.readerIndex = (compressedData.readerIndex + compressedLength);
    } else {
        // BZIP or GZIP compressed file
        const decompressedLength = compressedData.get('int', 'unsigned');
        if (decompressedLength < 0) {
            return null;
        } else {
            const fileData = new ByteBuffer(compressedLength);

            compressedData.copy(fileData, 0, compressedData.readerIndex);

            data = compressionMethod === 'bzip' ?
                Bzip2.decompress(fileData) :
                Gzip.decompress(fileData);
        }
    }

    return data;
};


const decodeGroup = (buffer: Buffer, groupDetails: GroupDetails): Map<number, ByteBuffer> | null => {
    if (groupDetails.childCount === 1) {
        return null;
    }

    const data = new ByteBuffer(buffer);

    data.readerIndex = (data.length - 1); // EOF - 1 byte

    const stripeCount = data.get('byte', 'unsigned');

    data.readerIndex = (data.length - 1 - stripeCount * groupDetails.childCount * 4); // Stripe data footer

    if (data.readerIndex < 0) {
        logger.error(`Invalid reader index of ${ data.readerIndex } for group ` +
            `${ groupDetails.name || groupDetails.key }.`);
        return null;
    }

    const fileSizeMap = new Map<number, number>();
    const fileStripeMap = new Map<number, number[]>();
    const fileDataMap = new Map<number, ByteBuffer>();
    const files = new Map<number, FileDetails>();

    // groupDetails.children.sort((a, b) => a.key - b.key);
    for (const file of groupDetails.children) {
        files.set(file.key, file);
    }

    for (const [ flatFileKey, ] of files) {
        fileSizeMap.set(flatFileKey, 0);
        fileStripeMap.set(flatFileKey, new Array(stripeCount));
    }

    for (let stripe = 0; stripe < stripeCount; stripe++) {
        let currentLength = 0;

        for (const [ flatFileKey, ] of files) {
            const delta = data.get('int');
            currentLength += delta;

            const fileStripes = fileStripeMap.get(flatFileKey);
            const size = fileSizeMap.get(flatFileKey) + currentLength;

            fileStripes[stripe] = currentLength;
            fileSizeMap.set(flatFileKey, size + currentLength);
        }
    }

    for (const [ flatFileKey, ] of files) {
        fileDataMap.set(flatFileKey, new ByteBuffer(fileSizeMap.get(flatFileKey)));
    }

    data.readerIndex = 0;

    for (let stripe = 0; stripe < stripeCount; stripe++) {
        for (const [ fileIndex, ] of files) {
            let stripeLength = fileStripeMap.get(fileIndex)[stripe];
            let sourceEnd: number = data.readerIndex + stripeLength;

            if (data.readerIndex + stripeLength >= data.length) {
                sourceEnd = data.length;
                stripeLength = (data.readerIndex + stripeLength) - data.length;
            }

            const stripeData = data.getSlice(data.readerIndex, stripeLength);
            const fileData = fileDataMap.get(fileIndex);

            fileData.putBytes(stripeData);

            data.readerIndex = sourceEnd;
        }
    }

    return fileDataMap;
};


export class Store {

    private readonly groupDetails = new Map<number, GroupDetails[]>();
    private readonly groups = new Map<number, Map<number | string, Buffer>>();
    private readonly files = new Map<number, Map<number | string, Map<number, Buffer>>>();
    private _archiveConfig: { [key: string]: ArchiveConfig };

    async get(archiveIndex: number, groupName: string): Promise<Buffer>;
    async get(archiveIndex: number, groupIndex: number): Promise<Buffer>;
    async get(archiveIndex: number, groupName: string, fileIndex: number): Promise<Buffer>;
    async get(archiveIndex: number, groupIndex: number, fileIndex: number): Promise<Buffer>;
    async get(archiveIndex: number, groupName: string, fileIndex?: number): Promise<Buffer>;
    async get(archiveIndex: number, groupIndex: number, fileIndex?: number): Promise<Buffer>;
    async get(archiveIndex: number, group: number | string, fileIndex?: number): Promise<Buffer> {
        if (!this.groupDetails.has(archiveIndex)) {
            const archiveGroupDetails = (await axios.get(`/store/archives/${ archiveIndex }/groups`)).data;
            this.groupDetails.set(archiveIndex, archiveGroupDetails);
        }

        const groupDetails = this.groupDetails.get(archiveIndex)
            .find(g => {
                if (typeof group === 'number' || /^\d+$/.test(group)) {
                    return g.key === Number(group);
                } else {
                    return g.name === group;
                }
            });

        if (!groupDetails) {
            logger.error(`Group details not found for group ${group} in archive ${archiveIndex}`);
        }

        if (!this.groups.has(archiveIndex)) {
            this.groups.set(archiveIndex, new Map<number, Buffer>());
        }

        if (!this.groups.get(archiveIndex).has(group)) {
            logger.info(`Requesting archive = ${ archiveIndex }, group = ${ group }`);

            const response = await axios.get(
                `/store/archives/${ archiveIndex }/groups/${ group }`, {
                    responseType: 'arraybuffer',
                    headers: {
                        'accept': 'arraybuffer'
                    }
                }
            );

            const compressedData = Buffer.from(response.data);
            const fileData = decompress(compressedData);
            this.groups.get(archiveIndex).set(group, fileData);
        }

        if (fileIndex !== undefined) {
            if (!this.files.has(archiveIndex)) {
                this.files.set(archiveIndex, new Map<number, Map<number, Buffer>>());
            }

            if (!this.files.get(archiveIndex).has(group)) {
                this.files.get(archiveIndex).set(group, new Map<number, Buffer>());

                const fileDataMap = decodeGroup(this.groups.get(archiveIndex).get(group), groupDetails);

                if (fileDataMap?.size) {
                    for (const [ fileIndex, fileData ] of fileDataMap) {
                        this.files.get(archiveIndex).get(group).set(fileIndex, fileData?.toNodeBuffer() || null);
                    }
                }
            }

            return this.files.get(archiveIndex).get(group).get(fileIndex);
        } else {
            return this.groups.get(archiveIndex).get(group);
        }
    }

    async getModel(modelId: number): Promise<Rs2Model> {
        return await Rs2ModelDecoder.getModel(modelId);
    }

    async getSprite(spriteName: string, spriteIndex: number): Promise<SpriteState> {
        return await SpriteTranscoder.getSprite(spriteName, spriteIndex);
    }

    private textureMaterials = new Map<number, Material>();

    async getTextureMaterial(textureId: number): Promise<Material | null> {
        const existingMaterial = this.textureMaterials.get(textureId);

        if (existingMaterial) {
            return existingMaterial;
        }

        const texture = await TextureFileDecoder.decode(textureId);

        if (!texture) {
            return null;
        }

        const material = new MeshPhongMaterial({
            side: DoubleSide,
            vertexColors: true,
        });
        texture.toBase64().then((value) => {
            material.map = new TextureLoader().load(
                "data:image/png;base64," + value
            );

            material.needsUpdate = true;
        });

        this.textureMaterials.set(textureId, material);

        return material;
    }

    async loadFonts(): Promise<Map<string, Font>> {
        for (const fontName of fontNames) {
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
        for (const [ , archiveConfig ] of Object.entries(this._archiveConfig)) {
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
