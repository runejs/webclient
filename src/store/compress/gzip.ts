import { gunzipSync } from 'browserify-zlib';
import { ByteBuffer } from '@runejs/common';


export class Gzip {

    static decompress(buffer: ByteBuffer | Buffer): Buffer {
        return gunzipSync(buffer);
    }

}
