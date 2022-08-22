import { ByteBuffer } from '@runejs/common';
import * as compressjs from '@ledgerhq/compressjs';
const bzip = compressjs.Bzip2;


const charCode = (letter: string) => letter.charCodeAt(0);


export class Bzip2 {

    static decompress(compressedFileData: ByteBuffer | Buffer): Buffer {
        const buffer = Buffer.alloc(compressedFileData.length + 4);
        compressedFileData.copy(buffer, 4);
        buffer[0] = charCode('B');
        buffer[1] = charCode('Z');
        buffer[2] = charCode('h');
        buffer[3] = charCode('1');

        return bzip.decompressFile(buffer);
    }

}
