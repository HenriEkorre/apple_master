# Vaatimusmäärittely: Elokuvasovellus

**Versio:** 1.0
**Päivämäärä:** 28.10.2026  
**Laatija:** Projektiryhmä 14
**Tila:** Ei hyväksytty

---

## 1. Tausta ja tavoite

Kaveriporukoille ja elokuvaharrastajille elokuvat ovat yhteinen harrastus, mutta suositukset ja ehdotukset hukkuvat helposti WhatsApp-viestiryhmiin eikä hyviä vinkkejä löydetä enää myöhemmin. Toisaalta yleiset ja pitkät IMDB-listat koetaan usein hankaliksi ja epähenkilökohtaisiksi.

**Tavoite:** Luoda yhteisöllinen elokuvasovellus pienille kaveriporukoille, jossa keskustelu, toivelistat ja ehdotukset pidetään samassa paikassa. Sovelluksessa ei esitetä itse elokuvia, vaan se toimii suositus- ja koordinointialustana yhteiselle ja yksittäiselle katselulle.

**Onnistumisen mittarit:**
- Käyttäjä voi selailla elokuvia, teatteriesityksiä ja julkisia/linkitettyjä listoja heti ilman rekisteröitymistä/kirjautumista.
- WhatsApp-viestittelyn korvaaminen selkeällä, ryhmäkohtaisella elokuvalistalla.
- Ryhmän jäsenet voivat helposti lisätä elokuvaehdotuksia yhteisille listoille.
- Arvosteluissa korostetaan tuttujen kavereiden tiiviitä arvioita yleisen keskiarvon sijaan.
- Sovellus mukautuu sulavasti mobiililaitteille.

---

## 2. Käyttäjät ja roolit

| Rooli | Tarve | Oikeudet |
|---|---|---|
| Kirjautumaton kävijä | Selailla elokuvia, teatteriesityksiä ja tarkastella jaettuja listoja | Hakea elokuvia, tarkastella julkisia profiileja, lukemaan julkisia arvosteluja sekä katsoa jaettuja listoja suoralla linkillä. |
| Rekisteröitynyt käyttäjä | Hallinnoida omia listoja, luoda ja hakea ryhmiä sekä kirjoittaa tiiviitä arvosteluja | Luo ja hallinnoi omia toivelistoja, hakee ryhmiä ja pyytää pääsyä, liittyy ryhmiin, kirjoittaa arvosteluja ja säätää niiden julkisuutta, näkee kavereiden muut ryhmät. Voit myös poistua ryhmästä itse. |
| Ryhmän ylläpitäjä / perustaja | Hallinnoida ryhmän jäseniä, listoja ja sisältöä | Jäsenen oikeuksien lisäksi hyväksyy uudet jäsenet ryhmään, voi poistaa jäseniä, poistaa epäasiallisia arvosteluja, muokata ryhmän toivelistoja ja myöntää ylläpitäjäoikeuksia muille. |

---

## 3. Käyttötilanne

1. Käyttäjä perustaa ryhmän ystävilleen ja valitsee sen suljetuksi (liittyminen vaatii ylläpitäjän hyväksynnän).
2. Jäsenet hakevat elokuvia TMDB-haun kautta (esim. elokuva tai tietty näyttelijä) ja lisäävät ne ryhmän yhteiselle listalle.
3. Ryhmäläiset katsovat elokuvan ja jättävät siitä tähtiarvion (1–5) ja tiiviin, lyhyen kommentin. Kirjoittaja valitsee arvostelun näkyvyydeksi ryhmänsisäisen tai julkisen.
4. Käyttäjä pystyy jakamaan oman Top 10 -listansa suoralla julkisella linkillä kirjautumattomalle ystävälle.

---

## 4. Toiminnalliset vaatimukset

| ID | Vaatimus | Prioriteetti |
|---|---|---|
| FR-01 | Kirjautumaton käyttäjä voi selailla etusivun mielenkiintoisia elokuvia, teatteriesityksiä ja hakea elokuvia TMDB API:n kautta. | Must |
| FR-02 | Monipuolinen haku: haku elokuvan nimen, vuosikymmenen, tyylilajin, näyttelijän ja ohjaajan mukaan. | Must |
| FR-03 | Elokuvien tiedoissa näytetään julisteet ja perustiedot. | Must |
| FR-04 | Käyttäjä voi kirjautua sisään. Nimimerkki näytetään julkisesti, oikea nimi ja sähköposti pysyvät piilossa. | Must |
| FR-05 | Käyttäjä voi luoda henkilökohtaisia toivelistoja (esim. "Katso yksin", "Katso ryhmässä"). | Must |
| FR-06 | Käyttäjä voi perustaa julkisia tai suljettuja ryhmiä. Suljettuihin ryhmiin liittyminen vaatii ylläpitäjän hyväksynnän / kutsun. | Must |
| FR-07 | Ryhmällä on oma profiilisivu, ryhmän jäsenmäärä näkyy haussa, ja ryhmällä on omat yhteiset elokuvalistat. | Must |
| FR-08 | Kirjautunut käyttäjä voi antaa elokuvalle tähtiarvion (1–5) ja kirjoittaa tiiviin, lyhyen kommentin elokuvien yhteydessä. Arvosteluissa ei ole tykkäys- painikkeita. | Must |
| FR-09 | Arvostelujen yhteydessä näytetään tuttujen kavereiden arviot erillään yleisistä keskiarvoista. | Must |
| FR-10 | Arvostelun kirjoittaja voi päättää näkyvyyden: *Vain minä*, *Ryhmänsisäinen*, tai *Täysin julkinen*. | Must |
| FR-11 | Ryhmän ylläpitäjä voi hyväksyä/hylätä liittymispyynnöt, poistaa jäseniä, muokata ryhmän listaa sekä poistaa epäasiallisia kommentteja. | Must |
| FR-12 | Ryhmän perustaja voi jakaa ylläpitäjäoikeuksia muille ryhmän jäsenille. | Must |
| FR-13 | Käyttäjä voi itse poistua ryhmästä milloin tahansa. | Must |
| FR-14 | Käyttäjä voi jakaa omat toivelistansa suoralla linkillä, jonka voi avata myös kirjautumaton käyttäjä. | Should |
| FR-15 | Käyttäjällä on oma profiilisivu, josta näkyy käyttäjän katseluhistoria, omat arvostelut, kommentit ja mihin muihin ryhmiin hän kuuluu. | Should |
| FR-16 | Tilastot: Sovellus näyttää yhteenvetoja ja tilastoja siitä, mistä ihmiset tykkäävät (suosituimmat elokuvat, näyttelijät jne.). | Should |
| FR-17 | "Voisit olla kiinnostunut tästä" -suositusmoottori ehdottaa samankaltaisia elokuvia, joita käyttäjä ei ole vielä katsonut. | Should |
| FR-18 | Kaksivaiheinen todentaminen kirjautuessa, esim. sähköpostikoodi | Should |
| FR-19 | Keskustelupalsta ryhmän henkilöiden välille | Should |
| FR-20 | Kielivalinta: Käyttöliittymä aluksi suomeksi, laajennettavissa myös ruotsiksi ja englanniksi. | Could |
| FR-21 | Kaupallistaminen ja tulevaisuus: maksulliset lisäpalvelut/yhteisöpalvelut, teatteriyhteistyö, affiliate-linkit ja mainokset ilmaisversiossa. | Could |
| FR-22 | Tieto siitä, missä teatterissa tai striimauspalvelussa ne pyörivät (Suomen teatterit/alustat). | Could |


---

## 5. Ei-toiminnalliset vaatimukset

| ID | Vaatimus | Todentaminen |
|---|---|---|
| NFR-01 | Asiallinen ja selkeä ulkoasu, joka toimii viiveettömästi ja saumattomasti myös mobiililaitteilla. | Käyttöliittymätestaus eri päätelaitteilla |
| NFR-02 | Visuaalisuus: Korkealaatuiset julisteet ja selkeä asiallinen ilme ilman turhaa tilanvientiä. | Visuaalinen katselmus |
| NFR-03 | Tietoturva & Yksityisyys: Käyttäjän oikeaa nimeä tai sähköpostia ei paljasteta julkisesti. Tukee vahvaa tunnistautumista (2FA). | Tietoturvakatselmus & testaus |
| NFR-04 | TMDB API -integraatio ja suorituskyky: Hakutulokset latautuvat nopeasti ilman viivettä. | Suorituskykytesti |
| NFR-05 | Tietokantamalli & Yhteisöllisyys: Rakennettu pienille ryhmille skaalautuvaksi (käyttäjät, ryhmät, listat, arvostelut). | Arkkitehtuurikatselmus |
| NFR-06 | Käyttöehdot ja GDPR -selitteet | Tietosuoja |

---

## 6. Tiedot ja alustava tietomalli

Sovellus tallentaa ja käsittelee vähintään seuraavat pääentiteetit:

- **Käyttäjä (Users):** Tunniste, käyttäjätunnus/nimimerkki, sähköposti (yksityinen), 2FA-tila, profiilitiedot ja kuuluu ryhmiin -linkitykset.
- **Ryhmä (Groups):** Tunniste, nimi, kuvaus, tyyppi (julkinen/suljettu-hyväksyttävä), luoja, ylläpitäjät, jäsenmäärä ja jäsenet.
- **Lista (Lists):** Tunniste, nimi, omistaja (käyttäjä tai ryhmä), julkisuusasetus (linkillä jaettava), sisältämät elokuvat (TMDB ID:t).
- **Arvostelu & Kommentti (Reviews):** Tunniste, elokuvan TMDB ID, kirjoittaja (nimimerkki), arvosana (1–5 tähteä), tiivis kommentti, julkisuusasetus (Vain minä / Ryhmä / Julkinen), luontiaika.

---

## 7. Projektin rajaus

**Ensimmäiseen julkaisuun (MVP) sisältyvät:**
- TMDB API -haku monipuolisilla suodattimilla (esim. vuosikymmen, näyttelijät).
- Selaus, teatteritiedot ja jaettujen linkkien katselu ilman kirjautumista.
- Henkilökohtaiset toivelistat ja ryhmäkohtaiset yhteiset listat.
- Ryhmien perustaminen, haku (jäsenmäärineen) ja suljettujen ryhmien liittymishyväksyntä.
- Tiiviit arvostelut (1–5 tähteä + kommentti) ilman tykkäysnappeja, julkisuudensäädöllä.
- Responsiivinen mobiilikäyttöliittymä.

**Jatkokehitys (MVP:n jälkeen):**
- Monikielisyys (ruotsi, englanti).
- Suositusalgoritmit ja tilastot.
- Kaupallistaminen ja teatteriyhteistyö.

---

