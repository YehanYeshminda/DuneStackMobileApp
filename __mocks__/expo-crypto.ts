/**
 * Jest manual mock for `expo-crypto`.
 *
 * `jest-expo` stubs the native module, so `randomUUID()` returns `undefined`.
 * Back it with Node's `crypto.randomUUID` so id generation behaves realistically
 * in tests.
 */
import { randomUUID as nodeRandomUUID } from 'crypto';

export const randomUUID = (): string => nodeRandomUUID();
