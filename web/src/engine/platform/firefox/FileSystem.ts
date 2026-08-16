import IPC from './InterProcessCommunication';

export class FirefoxDirectoryHandle {
    constructor(private filename: string) {}
    async getFileHandle(filename: string, options = {}) {
        return new FirefoxFileHandle(`${this.filename}/${filename}`);
    }
    async getDirectoryHandle(filename: string, options = {}) {
        return new FirefoxDirectoryHandle(`${this.filename}/${filename}`);
    }
}

export class FirefoxFileHandle {
    constructor(private filename: string) {}
    async createWritable() {
        return new FirefoxWritable(this.filename);
    }
}

class FirefoxWritable {
    private chunks = [];

    constructor(private filename: string) {}

    async write(data: any) {
        this.chunks.push(data);
    }

    async close() {
        const blob = new Blob(this.chunks);
        const result = await new IPC().Send("FileSystem.close", blob, this.filename);
        if (!result) throw new Error(`${this.filename} write error: ${result.error}`);
    }
}
