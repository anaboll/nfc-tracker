/* ------------------------------------------------------------------ */
/*  Generator numeru seryjnego certyfikatu autentycznosci.             */
/*                                                                     */
/*  Format: YYYY-NNNNNN (rok-numer), np. "2026-000042".                */
/*  Numery sa per-rok, rosnaco. Szesc cyfr daje prawie milion          */
/*  certyfikatow per rok — z zapasem na kazda skale.                   */
/*                                                                     */
/*  Wywolywane na backendzie w momencie zapisu certyfikatu — czyta     */
/*  aktualna liczbe certyfikatow w biezacym roku z DB, zwieksza o 1.   */
/* ------------------------------------------------------------------ */

import { prisma } from "@/lib/prisma";

/**
 * Generuje nastepny wolny serial number dla biezacego roku.
 * @returns sting w formacie "YYYY-NNNNNN" (np. "2026-000001")
 */
export async function generateCertificateSerial(): Promise<string> {
  const year = new Date().getFullYear();

  // Zlicz wszystkie Tag-i typu certificate stworzone w biezacym roku.
  // Uzywamy createdAt jako filtru bo to on jest indexowany, nie serialNumber.
  // serialNumber bedzie kolejnym numerem = count + 1.
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const count = await prisma.tag.count({
    where: {
      tagType: "certificate",
      createdAt: { gte: yearStart, lt: yearEnd },
    },
  });

  const nextNumber = count + 1;
  const padded = String(nextNumber).padStart(6, "0");
  return `${year}-${padded}`;
}
