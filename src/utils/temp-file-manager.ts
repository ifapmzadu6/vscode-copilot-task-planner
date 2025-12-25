import * as vscode from 'vscode';
import { Logger } from './logger';

/**
 * Manages temporary files in the extension's global storage directory.
 * This keeps the user's workspace clean while allowing subagents to write
 * detailed output that exceeds token limits.
 */
export class TempFileManager {
    private static instance: TempFileManager | null = null;
    private storageUri: vscode.Uri | null = null;
    private initialized = false;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    /**
     * Get the singleton instance
     */
    static getInstance(): TempFileManager {
        TempFileManager.instance ??= new TempFileManager();
        return TempFileManager.instance;
    }

    /**
     * Initialize with the extension context.
     * Must be called during extension activation.
     */
    async initialize(context: vscode.ExtensionContext): Promise<void> {
        if (this.initialized) {
            return;
        }

        this.storageUri = context.globalStorageUri;
        Logger.log(`TempFileManager initialized with storage: ${this.storageUri.fsPath}`);

        // Ensure the storage directory exists
        try {
            await vscode.workspace.fs.createDirectory(this.storageUri);
        } catch {
            // Directory might already exist, that's fine
        }

        // Create a subdirectory for temp files
        const tempDir = vscode.Uri.joinPath(this.storageUri, 'temp');
        try {
            await vscode.workspace.fs.createDirectory(tempDir);
        } catch {
            // Directory might already exist
        }

        this.initialized = true;
    }

    /**
     * Check if the manager is initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Get the temp directory URI
     */
    getTempDirectoryUri(): vscode.Uri {
        if (!this.storageUri) {
            throw new Error('TempFileManager not initialized. Call initialize() first.');
        }
        return vscode.Uri.joinPath(this.storageUri, 'temp');
    }

    /**
     * Get the temp directory path as a string (for use in prompts)
     */
    getTempDirectoryPath(): string {
        return this.getTempDirectoryUri().fsPath;
    }

    /**
     * Generate a unique temp file path for a given purpose
     */
    generateTempFilePath(prefix: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const filename = `${prefix}-${timestamp}-${random}.md`;
        return vscode.Uri.joinPath(this.getTempDirectoryUri(), filename).fsPath;
    }

    /**
     * Generate a temp file URI
     */
    generateTempFileUri(prefix: string): vscode.Uri {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const filename = `${prefix}-${timestamp}-${random}.md`;
        return vscode.Uri.joinPath(this.getTempDirectoryUri(), filename);
    }

    /**
     * Read content from a temp file
     */
    async readTempFile(filePath: string): Promise<string | null> {
        try {
            const uri = vscode.Uri.file(filePath);
            const content = await vscode.workspace.fs.readFile(uri);
            const text = Buffer.from(content).toString('utf-8');
            Logger.log(`Read temp file: ${filePath} (${text.length} chars)`);
            return text;
        } catch (error) {
            Logger.error(`Failed to read temp file: ${filePath}`, error);
            return null;
        }
    }

    /**
     * Write content to a temp file
     */
    async writeTempFile(filePath: string, content: string): Promise<boolean> {
        try {
            const uri = vscode.Uri.file(filePath);
            await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf-8'));
            Logger.log(`Wrote temp file: ${filePath} (${content.length} chars)`);
            return true;
        } catch (error) {
            Logger.error(`Failed to write temp file: ${filePath}`, error);
            return false;
        }
    }

    /**
     * Delete a temp file
     */
    async deleteTempFile(filePath: string): Promise<boolean> {
        try {
            const uri = vscode.Uri.file(filePath);
            await vscode.workspace.fs.delete(uri);
            Logger.log(`Deleted temp file: ${filePath}`);
            return true;
        } catch (error) {
            Logger.error(`Failed to delete temp file: ${filePath}`, error);
            return false;
        }
    }

    /**
     * Clean up old temp files (older than specified age in milliseconds)
     */
    async cleanupOldFiles(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
        try {
            const tempDir = this.getTempDirectoryUri();
            const files = await vscode.workspace.fs.readDirectory(tempDir);
            const now = Date.now();

            for (const [name, type] of files) {
                if (type !== vscode.FileType.File) {
                    continue;
                }

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

/**
 * Convenience function to get the TempFileManager instance
 */
export function getTempFileManager(): TempFileManager {
    return TempFileManager.getInstance();
}
