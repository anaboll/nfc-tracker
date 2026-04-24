/* ------------------------------------------------------------------ */
/*  Slugify — konwertuje dowolny tekst na bezpieczny slug URL.        */
/*                                                                     */
/*  Używane przy tworzeniu vCardów z opcją "Imie.Nazwisko" albo        */
/*  "Nazwa firmy" jako URL slug. Polskie znaki → ASCII (ł→l, ą→a,     */
/*  ż→z itd.). Dozwolone finalne znaki: [a-z 0-9 . -].                 */
/*                                                                     */
/*  Zasady:                                                            */
/*    - diakrytyki PL → Latin (ł→l, ą→a, ć→c, ę→e, ń→n, ó→o,           */
/*      ś→s, ź→z, ż→z, oraz wariantów wielkich liter)                  */
/*    - wielkie litery → małe                                          */
/*    - spacje i underscore → myślnik                                  */
/*    - wszystkie nie-dozwolone znaki → usunięte                       */
/*    - wielokrotne myślniki / kropki → pojedyncze                     */
/*    - przycinamy wiodące/końcowe myślniki i kropki                   */
/*    - max długość: 60 znaków (reasonable dla URL)                    */
/* ------------------------------------------------------------------ */

const PL_MAP: Record<string, string> = {
  "ą": "a", "Ą": "a",
  "ć": "c", "Ć": "c",
  "ę": "e", "Ę": "e",
  "ł": "l", "Ł": "l",
  "ń": "n", "Ń": "n",
  "ó": "o", "Ó": "o",
  "ś": "s", "Ś": "s",
  "ź": "z", "Ź": "z",
  "ż": "z", "Ż": "z",
};

/**
 * Konwertuje tekst na slug URL.
 * @param input dowolny string (imię, nazwa firmy, zdanie itd.)
 * @param options.separator separator dla spacji i myślników (default "-")
 * @returns slug lub pusty string jeśli input był pusty/same nie-dozwolone znaki
 */
export function slugify(input: string, options: { separator?: "-" | "." } = {}): string {
  if (!input) return "";
  const sep = options.separator || "-";

  let out = input;

  // 1. Diakrytyki PL → ASCII
  out = out.replace(/[ąĄćĆęĘłŁńŃóÓśŚźŹżŻ]/g, (ch) => PL_MAP[ch] || ch);

  // 2. Ogólnie NFD unicode normalize (złapie resztę diakrytyków — np. niemieckie ä,ö)
  //    Następnie usuwamy znaki łączące (combining diacriticals)
  out = out.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 3. lowercase
  out = out.toLowerCase();

  // 4. spacje, underscore, kropki (z imienia "Jan Kowalski" lub "Jan_Kowalski") → separator
  //    UWAGA: jeśli separator to ".", to zachowujemy istniejące kropki
  if (sep === ".") {
    out = out.replace(/[\s_]+/g, ".");
  } else {
    out = out.replace(/[\s_]+/g, "-");
  }

  // 5. Wszystko poza [a-z 0-9 . -] → usuń
  out = out.replace(/[^a-z0-9.-]/g, "");

  // 6. Wielokrotne separatory z rzędu → pojedynczy
  out = out.replace(/-+/g, "-");
  out = out.replace(/\.+/g, ".");

  // 7. Trim wiodących/końcowych separatorów
  out = out.replace(/^[-.]+|[-.]+$/g, "");

  // 8. Max 60 znaków
  if (out.length > 60) out = out.slice(0, 60).replace(/[-.]+$/, "");

  return out;
}

/**
 * Helper: buduje slug "imie.nazwisko" z firstName + lastName.
 * Pusty firstName lub lastName = zwraca sam drugi (slugified).
 */
export function slugifyPersonName(firstName: string, lastName: string): string {
  const fn = slugify(firstName);
  const ln = slugify(lastName);
  if (fn && ln) return `${fn}.${ln}`;
  return fn || ln || "";
}

/**
 * Walidacja: czy string jest poprawnym slug-em (taki jaki akceptujemy w DB jako Tag.id).
 * Zwraca true jeśli OK, false jeśli nie. Używane do walidacji inputa od usera.
 */
export function isValidSlug(slug: string): boolean {
  if (!slug) return false;
  if (slug.length > 60) return false;
  if (slug.length < 2) return false;  // minimum 2 znaki
  // Dozwolone: a-z, 0-9, kropka, myślnik. NIE może zaczynać ani kończyć się separatorem.
  return /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(slug);
}
