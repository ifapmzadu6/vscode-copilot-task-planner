import { MessageHandler, WebviewIncomingMessage, WebviewMessage } from '../types/messages';

type WebviewMessageType = typeof WebviewMessage[keyof typeof WebviewMessage];

/**
 * Fluent builder for creating message handler arrays.
 * Provides type-safe handler registration with a clean API.
 *
 * @example
 * const handlers = new MessageHandlerBuilder<string | null>()
 *   .on(WebviewMessage.ANSWER, (msg) => isAnswerMessage(msg) ? msg.answer : undefined)
 *   .on(WebviewMessage.CANCEL, () => null)
 *   .build();
 */
export class MessageHandlerBuilder<T> {
    private handlers: MessageHandler<T>[] = [];

    /**
     * Registers a handler for a specific message type.
     *
     * @param type - The message type to handle
     * @param handle - Handler function that returns the resolved value, or undefined to not resolve
     * @returns this builder for chaining
     */
    on(
        type: WebviewMessageType,
        handle: (message: WebviewIncomingMessage) => T | undefined | Promise<T | undefined>
    ): this {
        this.handlers.push({ type, handle });
        return this;
    }

    /**
     * Registers a handler that always returns a specific value.
     *
     * @param type - The message type to handle
     * @param value - The value to return when this message is received
     * @returns this builder for chaining
     */
    onReturn(type: WebviewMessageType, value: T): this {
        this.handlers.push({ type, handle: () => value });
        return this;
    }

    /**
     * Registers a handler that executes a callback but doesn't resolve the promise.
     * Useful for handling events like translation that should continue waiting.
     *
     * @param type - The message type to handle
     * @param callback - Callback to execute (can be async)
     * @returns this builder for chaining
     */
    onContinue(
        type: WebviewMessageType,
        callback: (message: WebviewIncomingMessage) => void | Promise<void>
    ): this {
        this.handlers.push({
            type,
            handle: async (msg) => {
                await callback(msg);
                return undefined;
            }
        });
        return this;
    }

    /**
     * Builds and returns the handlers array.
     * @returns Array of message handlers
     */
    build(): MessageHandler<T>[] {
        return [...this.handlers];
    }
}
