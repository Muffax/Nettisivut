# Kymenlaakson Taksi — nettisivut

Kymenlaakson Taksin uudistetut verkkosivut. Staattinen HTML/CSS/JS-sivusto,
ei build-vaihetta, ei kehyksiä — tiedostot toimivat sellaisenaan missä
tahansa staattisessa hostingissa (ks. [DEPLOY.md](DEPLOY.md)).

**Live-esikatselu:** https://curious-sunflower-c1cefb.netlify.app
**Repo:** https://github.com/Muffax/Nettisivut

## Sivurakenne

| Sivu | Tiedosto | Kuvaus |
|---|---|---|
| Etusivu | `index.html` | Hero, hinnastoesittely, visio/missio/arvot |
| Palvelut (yleiskatsaus) | `palvelut.html` | Lyhyt yhteenveto + linkit Kela-/Sote-taksiin, taksikortti, appi |
| Kela-taksi | `kela-taksi.html` | Oma alisivu: tilausohjeet, haitari-FAQ |
| Sote-taksi | `sote-taksi.html` | Oma alisivu: vaikeavammaisten kuljetuspalvelu, haitari-FAQ |
| Hinnasto | `hinnasto.html` | Hinnat + hintalaskuri (katso alla) |
| Yrityksille | `yrityksille.html` | Sopimusasiakkuus, Web Booking |
| Rekry | `rekry.html` | Avoimet työpaikat (katso alla) + hakutavat |
| Ota yhteyttä | `ota-yhteytta.html` | Yhteystiedot, toimisto, laadunvalvonta |

Palvelut-, Kela-taksi- ja Sote-taksi-sivut ovat yhdistetty päävalikkoon
"Palvelut ▾" -pudotusvalikolla (ks. `assets/script.js`, `.nav-dropdown`).

## Erikoisominaisuudet

- **Hintalaskuri** (`hinnasto.html#hintalaskuri`): osoitehaku OpenStreetMapin
  Nominatimilla (rajattu Kymenlaaksoon) ja reititys OSRM:llä, täysin ilman
  kaupallista rajapinta-avainta. Katso `initHintalaskuri()` scriptissä.
- **Avoimet työpaikat** (`rekry.html`): luetaan joko paikallisesta
  `data/tyopaikat.json`-tiedostosta tai yhteistyökumppanin täyttämästä
  Google-lomakkeesta/Sheetistä CSV:nä. Katso **[data/README.md](data/README.md)**
  perustamisohjeineen.
- **WCAG 2.2 AA**: kontrastit, näkyvät fokusrenkaat, ARIA-tilat
  haitareille/välilehdille/pudotusvalikolle, alt-tekstit kaikissa kuvissa,
  sivun pikanavigointi ("Tällä sivulla") ja "Takaisin ylös" -nappi pitkillä
  sivuilla.

## Paikallinen kehitys

Ei build-vaihetta — riittää mikä tahansa staattinen palvelin:

```bash
python3 -m http.server 8822
# avaa http://localhost:8822/index.html
```

## Julkaisu

Katso **[DEPLOY.md](DEPLOY.md)**. Lyhyesti: GitHub (`Muffax/Nettisivut`) on
yhdistetty Netlifyyn, joka julkaisee sivuston automaattisesti jokaisesta
`main`-haaraan pushatusta commitista. Tämän ympäristön Git-asennuksessa ei
ole GitHub-kirjautumista, joten `git push` ajetaan GitHub Desktopista tai
omasta päätteestä — committit tehdään täällä, push jää käyttäjälle.

## Kuva- ja logovaranto

`assets/images/`-kansiossa on yrityksen omia valokuvia ja logo (keltainen
`logo-keltainen.png` ja musta `logo-musta.png`), sekä favicon-setti
generoituna logosta. App Store- ja Google Play -badget (`app-store-badge.png`,
`google-play-badge.png`) ovat virallisia kauppabadgeja, jotka linkittävät
oikeaan Taksi Kymenlaakso -sovellukseen.

## Avoimet kohdat

Näitä ei ole vielä ratkaistu — merkitään tähän, ettei unohdu:

| # | Aihe | Tila |
|---|---|---|
| 1 | Kelan vaatimusten mukainen palautelomake (työkaverin `kela-palaute`-repo) upotettava Kela-taksi-sivulle | ⏳ Odottaa pääsyä repoon + varmistusta että kolleegan "avoimet kysymykset Kelalle" on ratkaistu ennen tuotantoa |
| 2 | Rekry-sivun Google Sheet -integraatio | ⏳ `JOBS_SHEET_CSV_URL` on tyhjä `assets/script.js`:ssä — sivu käyttää toistaiseksi `data/tyopaikat.json`-tiedostoa. Ks. data/README.md |
| 3 | Oma verkkotunnus (esim. www.kymenlaaksontaksi.fi) | ⏳ Sivusto on toistaiseksi Netlifyn `*.netlify.app`-osoitteessa, ei vielä yhdistetty oikeaan domainiin |
| 4 | SE/EN-kieliversiot | ⏳ Ei vielä tehty — nykyinen sivusto on vain suomeksi |
| 5 | Netlify-projektin näkyvyys | ✅ Asetettu julkiseksi ("Public") — oli oletuksena yksityinen ("Team protection") |

Kun joku näistä ratkeaa, päivitä tila ✅:ksi (tai poista rivi) tässä
tiedostossa — näin projekti pysyy hanskassa ilman, että avoimet asiat
unohtuvat commit-historian sekaan.
