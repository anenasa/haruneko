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
        if (navigator.userAgent.includes('Android')) {
            // Downloads API not supported on Firefox for Android
            // https://bugzilla.mozilla.org/show_bug.cgi?id=1538348
            // Also note that a confirmation dialog is displayed,
            // if user has not click download before next download starts,
            // the new one is not started from my test.
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            return;
        }

        const result = await new IPC().Send("FileSystem.close", blob, this.filename);
        if (!result) throw new Error(`${this.filename} write error: ${result.error}`);
    }
}
