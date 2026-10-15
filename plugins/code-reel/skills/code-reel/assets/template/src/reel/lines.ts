import { C, Seg } from "./theme";

// Строки кода для ролика: массивы сегментов { t: текст, c: цвет }.
// Цвета: ключевые слова — accent, типы/значения — orange, строки — green, числа/ключи — violet, пунктуация — sec.

const prompt = { t: "$ ", c: C.accent };
export const cmd = (text: string): Seg[] => [prompt, { t: text, c: C.text }];
export const out = (text: string, c: string = C.sec): Seg[] => [{ t: text, c }];
