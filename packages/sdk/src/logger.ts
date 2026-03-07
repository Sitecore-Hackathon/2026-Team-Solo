/**
 * SDK debug logger. All output is prefixed with [PersonalizeConnect].
 * Enable by passing debug={true} on PersonalizeProvider.
 */

const PREFIX = "[PersonalizeConnectSDK]";

let enabled = false;

export function setDebug(on: boolean): void {
  enabled = on;
}

export function isDebugEnabled(): boolean {
  return enabled;
}

export function log(...args: unknown[]): void {
  if (enabled) console.log(PREFIX, ...args);
}

export function warn(...args: unknown[]): void {
  if (enabled) console.warn(PREFIX, ...args);
}

export function error(...args: unknown[]): void {
  if (enabled) console.error(PREFIX, ...args);
}

export function group(label: string): void {
  if (enabled) console.groupCollapsed(`${PREFIX} ${label}`);
}

export function groupEnd(): void {
  if (enabled) console.groupEnd();
}
