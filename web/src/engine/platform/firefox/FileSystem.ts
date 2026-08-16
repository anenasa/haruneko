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
        const result = await new Promise((resolve, reject) => {
            const downloadId = crypto.randomUUID();
            function handler(event) {
                if (event.data?.downloadReturnId !== downloadId) return;
                window.removeEventListener("message", handler);
                const result = event.data.result;
                resolve(result);
            }
            window.addEventListener("message", handler);
            window.postMessage({type: "download", downloadId, blob, filename: this.filename}, "*");
        });
        if (!result.success) throw new Error(`${this.filename} write error: ${result.error}`);
    }
}
