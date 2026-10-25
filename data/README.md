# Avoimet työpaikat — data/tyopaikat.json

Rekry-sivu (`rekry.html`) lukee avointen työpaikkojen listan tästä tiedostosta
JavaScriptillä (`assets/script.js`, `initAvoimetTyopaikat`). Listan päivittäminen
ei vaadi HTML- tai JS-koodin muokkaamista — riittää, että tämä JSON-tiedosto
päivitetään (esim. botilla, ajastetulla skriptillä tai commitilla).

## Kentät

| Kenttä        | Pakollinen | Kuvaus                                                        |
|---------------|------------|----------------------------------------------------------------|
| `id`          | kyllä      | Yksilöllinen tunniste (vapaamuotoinen merkkijono)              |
| `active`      | ei         | `false` piilottaa paikan näyttämättä sitä listalta             |
| `title`       | kyllä      | Työpaikan otsikko                                              |
| `type`        | ei         | Esim. "Kokoaikainen", "Osa-aikainen", "Kesätyö"                |
| `location`    | ei         | Paikkakunta                                                    |
| `deadline`    | ei         | Hakuaika tekstinä, esim. "31.12.2026" tai "Jatkuva haku"       |
| `description` | ei         | Lyhyt kuvaus (1–2 lausetta)                                    |
| `applyUrl`    | ei         | Linkki hakulomakkeeseen — jos puuttuu, hakupainiketta ei näytetä |

## Esimerkki uuden paikan lisäämisestä

Lisää uusi olio taulukon loppuun:

```json
{
  "id": "kuljettaja-kotka-2026-03",
  "active": true,
  "title": "Taksinkuljettaja, Kotka",
  "type": "Osa-aikainen",
  "location": "Kotka",
  "deadline": "31.3.2026",
  "description": "Etsimme kuljettajaa ilta- ja viikonloppuvuoroihin.",
  "applyUrl": "https://forms.office.com/..."
}
```

Jos listassa ei ole yhtään `active: true` -paikkaa, sivu näyttää viestin
"Ei tällä hetkellä avoimia haettavia paikkoja" ja ohjaa avoimen hakemuksen
lähettämiseen. Jos tiedostoa ei voida ladata lainkaan, sivu näyttää varalta
tekstin, joka ohjaa samaan paikkaan.

Tiedoston on oltava validia JSON:ia (taulukko olioita, `[...]`). Virheellinen
JSON estää koko listan latautumisen.

---

## Vaihtoehto: yhteistyökumppanin oma ilmoituslomake (Google Forms)

Jos haluat, että joku muu — esim. yhteistyökumppani — voi itse lisätä
työpaikkailmoituksia ilman, että kukaan koskee tiedostoihin, ota käyttöön
Google Forms -pohjainen ilmoituskanava. Se on ilmainen, eikä vaadi
palvelinta: lomakkeen vastaukset tallentuvat Google Sheetiin, ja rekry-sivu
hakee ne sieltä automaattisesti joka kerta kun sivu avataan.

### 1. Perusta Google-lomake

Luo [forms.google.com](https://forms.google.com)-palvelussa uusi lomake ja
lisää seuraavat kysymykset **täsmälleen tässä järjestyksessä** (muuten
mene askeleeseen 4, jossa otsikot voi muokata sarakenimiksi):

1. **Otsikko** (lyhyt vastaus) — esim. "Taksinkuljettaja, Kotka"
2. **Paikkakunta** (lyhyt vastaus)
3. **Tyyppi** (lyhyt vastaus) — esim. "Kokoaikainen", "Osa-aikainen"
4. **Hakuaika** (lyhyt vastaus) — esim. "31.3.2026" tai "Jatkuva haku"
5. **Kuvaus** (kappale) — 1–2 lauseen kuvaus tehtävästä
6. **Hakulinkki** (lyhyt vastaus) — linkki hakulomakkeeseen tai sähköposti
7. **Näytä sivulla** (monivalinta: "Kyllä" / "Ei")

Jaa lomakkeen linkki yhteistyökumppanille (Lähetä-painike → linkki-ikoni).
Kumppani ei tarvitse Google-tiliä eikä pääse muokkaamaan muuta sivustoa —
hän näkee vain tämän lomakkeen.

### 2. Yhdistä lomake Sheetiin

Lomakkeen "Vastaukset"-välilehdellä paina vihreää Sheets-kuvaketta
("Luo laskentataulukko"). Google luo automaattisesti taulukon, johon
jokainen lomakevastaus tallentuu uutena rivinä.

### 3. Julkaise taulukko verkkoon CSV-muodossa

Avaa taulukko → **Tiedosto → Jaa → Julkaise verkkoon**. Valitse oikea
välilehti ("Vastaukset 1") ja muoto **CSV**, paina Julkaise. Kopioi saatu
linkki (muotoa `https://docs.google.com/spreadsheets/d/.../pub?output=csv`).

### 4. Ota linkki käyttöön sivustolla

Avaa `assets/script.js` ja aseta kopioitu linkki tähän riviin tiedoston
alkupuolella:

```js
var JOBS_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/.../pub?output=csv';
```

Tämän jälkeen rekry-sivu lukee avoimet paikat suoraan Sheetistä eikä
`tyopaikat.json`-tiedostosta. Jos Sheet ei vastaisi (esim. tilapäinen
verkkokatko), sivu palaa automaattisesti näyttämään `tyopaikat.json`-sisällön
varalta.

**Huom:**
- Jos lomakkeen kysymysten järjestystä ei haluta muuttaa, sarakkeiden
  otsikot taulukossa pitää nimetä täsmälleen: `Otsikko`, `Paikkakunta`,
  `Tyyppi`, `Hakuaika`, `Kuvaus`, `Hakulinkki`, `Näytä sivulla` (skripti
  tunnistaa otsikot nimen perusteella, ei sarakejärjestyksen perusteella).
- Uusimmat vastaukset näytetään ylimpänä (lomakkeen aikaleiman mukaan).
- "Näytä sivulla" = "Ei" piilottaa ilmoituksen näyttämättä sitä poistamatta
  vastausta taulukosta — kätevä tapa sulkea haku ilman Sheetin muokkaamista
  käsin.
- Sheetin julkaisu verkkoon tekee vastausdatasta julkisesti luettavaa
  (kuka tahansa linkin tietävä näkee sen) — älä siis lisää lomakkeeseen
  kysymyksiä, joihin voisi tulla arkaluonteista tietoa (esim. henkilötunnuksia).
  Pelkät työpaikkailmoitustiedot ovat tähän tarkoitukseen turvallisia.
