/**
 * Generates a random neutral tag code for new tags.
 *
 * The code becomes the URL slug on the NFC chip (e.g. /s/a3x7k), so it must be:
 * - short and memorable
 * - free of characters that look alike (no 0/O, no 1/l/I)
 * - case-insensitive friendly (lowercase only)
 * - large enough to avoid collisions with hundreds of tags
 *
 * 31-char alphabet × 5 positions = ~28M combinations.
 *
 * Neutrality matters: the admin may change a tag's type (url → vcard → multilink)
 * after the brelok is already printed. The URL must never hint at the content type
 * so clients don't see "/s/wizytowka-xxx" suddenly redirecting to a different page.
 */

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const DEFAULT_LENGTH = 5;

export function generateTagCode(length: number = DEFAULT_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return code;
}
