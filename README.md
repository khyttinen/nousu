# Nousu – treenipäiväkirja

Kevyt suomenkielinen iPhoneen sopiva PWA. Ei palvelinlogiikkaa, kirjautumista, ulkoisia kirjastoja eikä ulkoisia resursseja.

## Käynnistä paikallisesti

```sh
cd /workspace
npm start
```

Avaa http://localhost:3000. Pelkkä HTML-tiedoston avaaminen tiedostoselaimesta ei riitä PWA:n tai JavaScript-moduulien käyttöön.

## Julkaise iPhonelle

Julkaise `index.html`, `style.css`, `app.js`, `model.js`, `sw.js`, `manifest.webmanifest`, `icon.svg` ja `icons/` saman hakemiston alle staattiseen HTTPS-palveluun, esimerkiksi GitHub Pagesiin, Netlifyyn tai Cloudflare Pagesiin. Rakennusvaihetta ei tarvita. Myös alihakemistoon julkaiseminen toimii.

Avaa osoite iPhonen Safarissa ja valitse **Jaa → Lisää Koti-valikkoon → Lisää**. Avaa sovellus kotinäytöltä verkkoyhteydessä ensimmäisen kerran. Tarkista Asetukset-näkymästä, että offline-käyttö on valmis. Sen jälkeen sovellus toimii ilman verkkoyhteyttä.

## Toiminnot ja tallennus

- Kaikki 19 annettua liikettä: Perusliikkeet, Extra 1 ja Extra 2. Päivää 7.9. koskevat alkuperäiset suoritukset ovat muistiinpanoja, koska vuotta ei ole tiedossa.
- Liikkeiden lisäys, muokkaus ja poisto sekä sarja-, toisto-, paino- ja korotustavoitteet.
- Vapaasti valittavat treeniliikkeet, sarjojen lisäys ja poisto, päiväys, tuntuma ja muistiinpanot.
- Keskeneräinen treeni tallentuu automaattisesti. Vain rastitetut sarjat siirtyvät treenihistoriaan.
- Treenihistoria, liikkeiden painokehitys ja kokonaismäärät. Poistettu liike säilyy aiemmissa treeneissä.
- Maltillinen kaksoisprogressio: kaikkien tavoitesarjojen tulee saavuttaa toistoalueen yläraja samalla painolla, ja tuntuman tulee olla kevyt (vähintään 3 toistoa varaa), ennen painonkorotusehdotusta. Nollapainolla ehdotetaan vahvempaa vastusnauhaa ilman keksittyä kilolukemaa.
- JSON-varmuuskopion vienti ja validoitu palautus. Palautus korvaa tiedot vasta vahvistuksen jälkeen.

Data tallennetaan selaimen `localStorage`-muistiin avaimella `nousu-data-v1`. Dataa ei lähetetä palvelimelle eikä synkronoida laitteiden välillä. Selaintietojen poistaminen tai yksityinen selaus voi hävittää tiedot. iOS voi erottaa Safarin ja kotinäyttösovelluksen tallennustilat. Vie säännöllisesti JSON-varmuuskopio esimerkiksi iCloud Driveen ja palauta se tarvittaessa. Käytä yhtä sovellusikkunaa kerrallaan. Sovellus pyytää selaimelta pysyvää tallennustilaa, mutta selain päättää sen myöntämisestä.

## Tarkistukset

```sh
npm test
```

Mallin testit kattavat ohjelmapohjan, progression ehdot, sarjojen kuittaukset, treenien järjestyksen ja virheellisten varmuuskopioiden hylkäyksen.

Päivityksissä muuta `sw.js`-tiedoston välimuistiversiota. Avoin vanha sovellus voi vaatia sulkemisen ennen uuden service workerin aktivoitumista.
