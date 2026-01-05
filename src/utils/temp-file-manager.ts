import * as vscode from 'vscode';
import { RuntimeConfig } from '../constants/runtime';
import { Logger } from './logger';

/**
 * Manages temporary files in the extension's global storage directory.
 */
export class TempFileManager {
    private static instance: TempFileManager | null = null;
    private storageUri: vscode.Uri | null = null;
    private initialized = false;
    private initializationError: Error | null = null;

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

        try {
            this.storageUri = context.globalStorageUri;
            Logger.log(`TempFileManager initialized: ${this.storageUri.fsPath}`);

            await vscode.workspace.fs.createDirectory(this.storageUri);
            await vscode.workspace.fs.createDirectory(
                vscode.Uri.joinPath(this.storageUri, RuntimeConfig.TEMP_FILES.SUBDIRECTORY)
            );

            this.initialized = true;
            this.initializationError = null;
        } catch (error) {
            // Directory might already exist, which is fine
            if (error instanceof vscode.FileSystemError && error.code === 'FileExists') {
                this.initialized = true;
                this.initializationError = null;
            } else {
                this.initializationError = error instanceof Error ? error : new Error(String(error));
                Logger.error('TempFileManager initialization failed:', this.initializationError);
                // Still mark as initialized to prevent repeated attempts
                this.initialized = true;
            }
        }
    }

    isInitialized(): boolean {
        return this.initialized && this.initializationError === null;
    }

    /**
     * Returns the initialization error if any occurred
     */
    getInitializationError(): Error | null {
        return this.initializationError;
    }

    private getTempDirectoryUri(): vscode.Uri {
        if (!this.storageUri) {
            throw new Error('TempFileManager not initialized');
        }
        return vscode.Uri.joinPath(this.storageUri, RuntimeConfig.TEMP_FILES.SUBDIRECTORY);
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

    async cleanupOldFiles(maxAgeMs = RuntimeConfig.TEMP_FILES.MAX_AGE_MS): Promise<void> {
        if (!this.isInitialized()) {
            Logger.warn('TempFileManager: Skipping cleanup - not properly initialized');
            return;
        }

        try {
            const tempDir = this.getTempDirectoryUri();
            const files = await vscode.workspace.fs.readDirectory(tempDir);
            const now = Date.now();
            let cleanedCount = 0;

            for (const [name, type] of files) {
                if (type !== vscode.FileType.File) continue;

                const fileUri = vscode.Uri.joinPath(tempDir, name);
                try {
                    const stat = await vscode.workspace.fs.stat(fileUri);
                    if (now - stat.mtime > maxAgeMs) {
                        await vscode.workspace.fs.delete(fileUri);
                        cleanedCount++;
                        Logger.log(`Cleaned up old temp file: ${name}`);
                    }
                } catch {
                    // Ignore errors for individual files
                }
            }

            if (cleanedCount > 0) {
                Logger.log(`TempFileManager: Cleaned up ${cleanedCount} old files`);
            }
        } catch (error) {
            Logger.error('Failed to cleanup temp files', error);
        }
    }
}

export function getTempFileManager(): TempFileManager {
    return TempFileManager.getInstance();
}
