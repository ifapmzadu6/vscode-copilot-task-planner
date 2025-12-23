/**
 * Component styles: header, panels, inputs, buttons, etc.
 */
export function generateComponentStyles(): string {
    return `
        .header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
        }
        .header-icon { font-size: 16px; }
        .header-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }
        .task-info {
            background: var(--vscode-textBlockQuote-background);
            border-left: 2px solid var(--vscode-textLink-activeForeground);
            padding: 8px 12px;
            margin-bottom: 16px;
            font-size: 12px;
            color: var(--vscode-foreground);
        }
        .task-info strong { color: var(--vscode-foreground); }
        .qa-history { margin-bottom: 12px; }
        .qa-item {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            padding: 10px 12px;
            margin-bottom: 8px;
            font-size: 12px;
        }
        .qa-item .q {
            color: var(--vscode-textLink-foreground);
            font-weight: 500;
            margin-bottom: 4px;
        }
        .qa-item .a { color: var(--vscode-foreground); }
        .question-panel {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-focusBorder);
            border-radius: 4px;
            padding: 16px;
            margin-bottom: 12px;
        }
        .question-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 6px;
        }
        .question-text {
            font-size: 13px;
            color: var(--vscode-foreground);
            margin-bottom: 12px;
            font-weight: 500;
        }
        .options-list { display: flex; flex-direction: column; gap: 6px; }
        .option-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            cursor: pointer;
            transition: border-color 0.1s, background 0.1s;
        }
        .option-item:hover {
            background: var(--vscode-list-hoverBackground);
            border-color: var(--vscode-focusBorder);
        }
        .option-item input[type="radio"] {
            accent-color: var(--vscode-focusBorder);
        }
        .option-item.other-option { flex-wrap: wrap; }
        .option-item.other-option input[type="text"] {
            flex: 1;
            min-width: 150px;
            margin-left: 4px;
        }
        input[type="text"], textarea {
            width: 100%;
            padding: 6px 8px;
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            color: var(--vscode-input-foreground);
            border-radius: 2px;
            font-family: inherit;
            font-size: 13px;
            outline: none;
        }
        input[type="text"]:focus, textarea:focus {
            border-color: var(--vscode-focusBorder);
        }
        textarea { resize: vertical; min-height: 60px; }
        .button-row {
            display: flex;
            gap: 8px;
            margin-top: 12px;
        }
        button {
            padding: 6px 14px;
            border-radius: 2px;
            font-size: 13px;
            cursor: pointer;
            border: none;
            font-family: inherit;
        }
        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .btn-primary:hover { background: var(--vscode-button-hoverBackground); }
        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
        .status-panel {
            display: none;
            text-align: center;
            padding: 24px;
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }
    `;
}
