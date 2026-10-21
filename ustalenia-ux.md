# AI Interior — ustalenia UX i funkcjonalności

Zakres: wyłącznie UX i funkcjonalność aplikacji. Kwestie techniczne nie są tu rozstrzygane.

## Cel i persona

Aplikacja webowa (w języku angielskim), która pokazuje użytkownikowi jego własne pomieszczenie w innym stylu — bez samodzielnego projektowania. Czysta inspiracja: bez kosztów, wycen ani produktów.

Persona — osoba urządzająca mieszkanie, która:
- nie jest architektem,
- chce eksperymentować,
- nie wie jeszcze, jaki styl wybrać,
- chce zobaczyć możliwości przed podjęciem decyzji.

## Przebieg

1. **Wgranie zdjęcia** — z dysku lub galerii (bez aparatu w aplikacji).
   - Przed wgraniem: krótka instrukcja, jakie zdjęcie wybrać (np. zrobione z rogu, w dzień, cały pokój w kadrze).
   - Po wgraniu: sprawdzenie zdjęcia; przy problemie ostrzeżenie z powodem, z możliwością kontynuowania.
   - Jedno zdanie o prywatności: zdjęcia znikają po zakończeniu sesji.
2. **Wybór typu pomieszczenia** — wszystkie typy, w tym kuchnia i łazienka.
3. **Wybór stylu** — 1 z 4: Japandi, Scandinavian, Industrial, Mid-century modern.
   - Każdy styl opisany i pokazany na przykładach.
   - Styl we współczesnej interpretacji (np. Japandi tak, jak wygląda w 2026).
4. **Generowanie** — ekran oczekiwania z postępem / szacowanym czasem i możliwością anulowania.
5. **Wynik**:
   - zdjęcie przed i po, z suwakiem — dokładnie ten sam kadr, zmienia się tylko stan przed/po,
   - opis zmian: paleta kolorów (próbki), kluczowe elementy, co się zmieniło względem zdjęcia,
   - przycisk „copy details” — kopiuje opis zmian jako tekst.
6. **Dalsze akcje**:
   - wygeneruj inny wariant tego samego stylu,
   - zobacz to samo zdjęcie w innym stylu (bez ponownego wgrywania),
   - przeglądaj i porównuj wyniki z bieżącej sesji,
   - pobierz obraz wyniku.

## Elementy nienaruszalne

| Element | Zasada |
|---|---|
| Bryła, ściany, wysokość, rozmiar pomieszczenia | Identyczne |
| Okna | Identyczne we wszystkim: pozycja, kształt, kolor ram |
| Drzwi | Pozycja i kształt bez zmian; wygląd (skrzydło, klamka, kolor) może się zmienić |
| Elementy techniczne: grzejniki, gniazdka, belki, kominek, schody, wnęki | Zostają na swoim miejscu; wygląd (kolor, obudowa) dopasowany do stylu |
| Sufit | Bez obniżania; dozwolone elementy dekoracyjne (np. sztukateria, belki dekoracyjne) |

## Co AI może zmieniać

Wszystko poza elementami nienaruszalnymi — pełna metamorfoza: meble, tekstylia, dekoracje, podłoga, kolor i wykończenie ścian, oświetlenie, zabudowy (w tym kuchenne).

## Gdy wynik się nie udaje

- Przycisk „coś się nie zgadza”: użytkownik wskazuje problem (okno, drzwi, ściana, element techniczny) i dostaje nową próbę.
- Po 2–3 nieudanych próbach na tym samym zdjęciu: szczera podpowiedź, np. „this photo may be hard to process — try another angle or lighting”.

## Sesja i dane

- Bez konta.
- Bez limitu generowań.
- Zdjęcie i wyniki znikają po zakończeniu sesji.
- Przy odświeżeniu lub zamknięciu karty: ostrzeżenie przeglądarki o utracie wyników („download them first”).
- Pobranie: tylko obraz wyniku.

## Urządzenia

- Główne urządzenie: komputer.
- Telefon: pełne wsparcie z dopasowanym układem (suwak, porównanie wyników).

## Świadomie poza zakresem

- konto i historia projektów,
- linki do udostępniania,
- koszty, budżet, wyceny,
- produkty i linki do sklepów,
- wiele pokoi / spójny styl całego mieszkania,
- korekty wyniku typu „jaśniej”, „bez dywanu”,
- generowanie w tle podczas przeglądania innych wyników,
- aparat w aplikacji,
- pobieranie grafiki „przed / po” lub karty z opisem.
