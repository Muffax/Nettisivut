# Julkaisu ja jatkuva päivittäminen

Sivusto on nyt paikallinen Git-repositorio (`git log` näyttää ensimmäisen
commitin). Kun se on kerran yhdistetty GitHubiin ja Netlifyyn/Verceliin,
jokainen tuleva muutos — myös ne, jotka pyydät Claudelta tässä chatissa —
voidaan julkaista automaattisesti pelkällä `git push`:lla.

## 1. Luo GitHub-repositorio (kertaluontoinen)

1. Mene [github.com/new](https://github.com/new) ja luo uusi **tyhjä**
   repositorio (älä valitse README/`.gitignore`/lisenssiä, koska ne ovat
   jo olemassa paikallisesti). Nimeksi käy esim. `kymenlaaksontaksi-sivut`.
2. GitHub näyttää luomisen jälkeen repositorion osoitteen, esim.
   `https://github.com/<kayttajanimi>/kymenlaaksontaksi-sivut.git`.
3. Aja tässä kansiossa (korvaa osoite omallasi):

   ```bash
   git remote add origin https://github.com/<kayttajanimi>/kymenlaaksontaksi-sivut.git
   git branch -M main
   git push -u origin main
   ```

   (Jos komento pyytää kirjautumista, GitHub ohjaa selaimeen tunnistautumista
   varten — tämä tapahtuu vain ensimmäisellä kerralla.)

## 2. Yhdistä Netlifyyn tai Verceliin (kertaluontoinen)

Molemmat ovat ilmaisia staattisille sivustoille ja julkaisevat sivuston
automaattisesti joka kerta, kun GitHub-repositorioon tulee uusi commit.

**Netlify:**
1. [app.netlify.com](https://app.netlify.com) → "Add new site" → "Import an
   existing project" → valitse GitHub ja äsken luotu repositorio.
2. Asetukset: *Build command* jätetään tyhjäksi, *Publish directory* on `.`
   (juurikansio) — sivusto on puhdasta HTML/CSS/JS:ää, ei vaadi
   build-vaihetta.
3. Paina "Deploy site". Saat osoitteen muotoa `jokin-nimi.netlify.app`.

**Vercel (vaihtoehto):**
1. [vercel.com/new](https://vercel.com/new) → tuo sama GitHub-repositorio.
2. Framework Preset: "Other" / staattinen — ei build-komentoa tarvita.
3. Paina "Deploy".

## 3. Oma verkko-osoite (valinnainen)

Kun haluatte käyttää oikeaa osoitetta (esim. `www.kymenlaaksontaksi.fi`) tämän
sivuston kanssa nykyisen sivuston sijaan, lisätään Netlifyn/Vercelin
"Domain settings" -kohdassa oma domain ja päivitetään DNS-asetukset
verkkotunnuksen ylläpitäjällä. Tämä kannattaa tehdä vasta, kun uusi sivusto
on hyväksytty julkaistavaksi — siihen asti `*.netlify.app`-osoite toimii
hyvänä esikatseluosoitteena esim. yhteistyökumppaneille.

## 4. Näin päivitykset jatkossa toimivat

Kun GitHub + Netlify/Vercel on yhdistetty kerran:

1. Pyydät muutoksen tässä Claude-keskustelussa (esim. "vaihda hinnastoon
   uusi aikaveloitus" tai "lisää uusi kuva etusivulle").
2. Claude muokkaa tiedostot, ja (pyydettäessä) committaa ja pushaa muutokset
   GitHubiin.
3. Netlify/Vercel huomaa uuden commitin ja julkaisee sivuston uudelleen
   automaattisesti — yleensä alle minuutissa, ilman että kukaan koskee
   palvelimiin tai tiedostoihin käsin.

Tämä korvaa tarpeen erilliselle "ylläpitobotille": Git + automaattinen
julkaisu *on* se mekanismi, jolla sivuston sisältöä päivitetään jatkossa.
