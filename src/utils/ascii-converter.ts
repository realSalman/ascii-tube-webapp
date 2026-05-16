export const DEFAULT_CHAR_SET = "@%#*+=-:. ";
export const DETAILED_CHAR_SET = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzocvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ";

export interface AsciiOptions {
  width: number;
  height: number;
  contrast: number;
  brightness: number;
  inverted: boolean;
  charSet: string;
}
