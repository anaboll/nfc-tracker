# Email: Oferta breloków NFC dla biur nieruchomości

## Temat
Brelok NFC z wizytówką agenta — od 8 PLN/szt | TwojeNFC

## Treść

Dzień dobry, {{IMIE}},

piszę, bo mam produkt, który rozwiązuje jeden z najczęstszych problemów w branży nieruchomości — utracony kontakt po spotkaniu z klientem.

**Brelok NFC z wizytówką agenta.**

Klient przykłada telefon do breloka — i od razu ma numer telefonu, email, stronę i zdjęcie agenta. Kontakt zapisuje się w telefonie jednym gestem. Bez aplikacji, bez wpisywania, działa na każdym iPhone i Androidzie.

**Jak to wygląda w praktyce:**
- Agent daje klientowi brelok-domek z kluczami do nowego mieszkania — klient przykłada telefon i ma wizytówkę agenta
- Brelok na recepcji biura — klient przykłada telefon i zostawia opinię Google
- Brelok z linkiem do konkretnej oferty nieruchomości — klient pokazuje znajomym

**Co jeszcze:**
- Brelok z logo Twojego biura (druk 3D + UV)
- Treść zmieniasz zdalnie — nowy agent? Nowa oferta? Zmieniasz w panelu, bez wymiany breloka
- Panel ze statystykami — ile osób skanuje, kiedy, skąd, jakim telefonem

**Cennik:**
- Do 50 szt. — 10 PLN netto/szt
- 51–99 szt. — 9 PLN netto/szt
- 100+ szt. — 8 PLN netto/szt

Przygotowałem stronę z pełnym opisem i przykładami zastosowań:
{{LINK_DO_OFERTY}}

Jeśli temat Pana/Panią zainteresuje — chętnie przygotujemy próbkę breloka z logo Waszego biura.

Pozdrawiam,
Marcin
TwojeNFC.pl
kontakt@twojenfc.pl

---

## Zmienne do podmienienia

| Zmienna | Opis | Przykład |
|---------|------|---------|
| `{{IMIE}}` | Imię osoby kontaktowej | Panie Janie |
| `{{LINK_DO_OFERTY}}` | Tracked link z UTM | `https://twojenfc.pl/oferta/nieruchomosci?utm_source=email&utm_medium=cold&utm_campaign=nieruchomosci-bydgoszcz&utm_content=re-max-bydgoszcz` |

## Jak generować linki

Każde biuro dostaje unikalny `utm_content`:
```
https://twojenfc.pl/oferta/nieruchomosci?utm_source=email&utm_medium=cold&utm_campaign=nieruchomosci-bydgoszcz&utm_content=SLUG_BIURA
```

Slug biura = nazwa biura bez spacji i polskich znaków, np.:
- RE/MAX Bydgoszcz → `remax-bydgoszcz`
- Freedom Nieruchomości → `freedom-nieruchomosci`
- Metrohouse → `metrohouse-bydgoszcz`

W panelu TwojeNFC w `data/offer-views.jsonl` zobaczysz kto otworzył stronę (po `utm_content`).
