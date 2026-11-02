// GitHub Pages serves a project site from /<repo-name>/, so every local file
// path needs that prefix. The deploy workflow sets it; locally it's empty.
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const asset = (path: string) => `${BASE}${path}`;
