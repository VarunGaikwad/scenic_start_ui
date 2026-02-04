export const insertString = (original: string, insert: string, index: number) =>
  original.slice(0, index) + insert + original.slice(index);

export const sliceString = (
  original: string,
  startIndex: number,
  length: number,
): string =>
  original.slice(0, startIndex) + original.slice(startIndex + length);
