export const resolveExecutable = (bin: string) =>
  process.platform === "win32" ? `${bin}.cmd` : bin;
