declare module 'asciichart' {
  export const green: number;
  export const red: number;
  export const blue: number;
  export const yellow: number;
  export const cyan: number;
  export const magenta: number;
  export const white: number;

  export function plot(data: number[], options?: {
    height?: number;
    offset?: number;
    padding?: string;
    colors?: number[];
    format?: (x: number) => string;
  }): string;
}
