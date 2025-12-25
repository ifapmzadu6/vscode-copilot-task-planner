import * as vscode from 'vscode';
import { Logger } from './logger';

/**
 * Manages temporary files in the extension's global storage directory.
 */
export class TempFileManager {
    private static instance: TempFileManager | null = null;
    private storageUri: vscode.Uri | null = null;
    private initialized = false;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    static getInstance(): TempFileManager {
        TempFileManager.instance ??= new TempFileManager();
        return TempFileManager.instance;
    }

    async initialize(context: vscode.ExtensionContext): Promise<void> {
        if (this.initialized) {
            return;
        }

        this.storageUri = context.globalStorageUri;
        Logger.log(`TempFileManager initialized: ${this.storageUri.fsPath}`);

        try {
            await vscode.workspace.fs.createDirectory(this.storageUri);
            await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(this.storageUri, 'temp'));
        } catch {
            // Directory might already exist
        }

        this.initialized = true;
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    private getTempDirectoryUri(): vscode.Uri {
        if (!this.storageUri) {
            throw new Error('TempFileManager not initialized');
        }
        return vscode.Uri.joinPath(this.storageUri, 'temp');
    }

    generateTempFilePath(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const filename = `output-${timestamp}-${random}.md`;
        return vscode.Uri.joinPath(this.getTempDirectoryUri(), filename).fsPath;
    }

    async readTempFile(filePath: string): Promise<string | null> {
        try {
            const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
            return Buffer.from(content).toString('utf-8');
        } catch (error) {
            Logger.error(`Failed to read temp file: ${filePath}`, error);
            return null;
        }
    }

    async cleanupOldFiles(maxAgeMs = 24 * 60 * 60 * 1000): Promise<void> {
        try {
            const tempDir = this.getTempDirectoryUri();
            const files = await vscode.workspace.fs.readDirectory(tempDir);
            const now = Date.now();

            for (const [name, type] of files) {
                if (type !== vscode.FileType.File) continue;

                const fileUri = vscode.Uri.joinPath(tempDir, name);
                try {
                    const stat = await vscode.workspace.fs.stat(fileUri);
                    if (now - stat.mtime > maxAgeMs) {
                        await vscode.workspace.fs.delete(fileUri);
                        Logger.log(`Cleaned up old temp file: ${name}`);
                    }
                } catch {
                    // Ignore errors for individual files
                }
            }
        } catch (error) {
            Logger.error('Failed to cleanup temp files', error);
        }
    }
}

export function getTempFileManager(): TempFileManager {
    return TempFileManager.getInstance();
}
