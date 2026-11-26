# Gegevens landschapslijn Oud Meer

Deze map voedt twee pagina's op de site:

- `/adoptiegebied/landschapslijn/` (overzicht)
- `/adoptiegebied/landschapslijn/3d/` (3D)

De map zelf wordt niet gepubliceerd. Alles wat je hier aanvult, staat na een build vanzelf op beide pagina's.

## Zo vul je aan

1. Open `punten.csv` of `lagen.csv` in Excel of Numbers.
2. Vul rijen aan. Laat de kopregel staan, en verander de kolomnamen niet.
3. Sla op als CSV. Puntkomma en komma als scheidingsteken werken allebei, en een decimale komma (15,72) mag ook.
4. Foto's: zet ze in `assets/img/landschapslijn/`, bijvoorbeeld `punt-4-1.jpg`, en zet de bestandsnaam in de kolom `foto`. Meerdere foto's scheid je met `|`.
5. Bekijk het lokaal met `bundle exec jekyll serve`. In de terminal staat dan bijvoorbeeld `Landschapslijn: 8 punten, 5 lagen`. Fouten, zoals een laag bij een onbekend punt, staan daar als waarschuwing.
6. Commit en push.

Je kunt ook je aantekeningen in een gesprek met Claude plakken. Die vult de CSV's dan voor je in.

## punten.csv — één rij per punt

| Kolom | Wat | Voorbeeld |
| --- | --- | --- |
| `punt` | Nummer of letter, zoals op de kaart | `4` of `P` |
| `breedtegraad`, `lengtegraad` | GPS-positie | `51.515980` |
| `RD_x`, `RD_y` | Rijksdriehoekscoördinaten in m. Deze bepalen de plek op kaart en in 3D | `160009` |
| `hoogte_AHN_m_NAP` | Maaiveldhoogte uit AHN | `15.14` |
| `water_cm_onder_maaiveld` | Gemeten water in het boorgat | `60` |
| `water_m_NAP` | Mag leeg blijven, wordt dan berekend | `14.54` |
| `notitie` | Korte opmerking | `water op 60 cm` |
| `soort` | `boring` of `wandje` | `boring` |
| `datum` | Datum van het veldwerk (JJJJ-MM-DD) | `2026-11-25` |
| `bodemtype` | Bijvoorbeeld veldpodzol, duinvaaggrond, podzol | `veldpodzol` |
| `humus_cm` | Dikte van de humuslaag in cm | `12` |
| `roest_cm` | Diepte waarop roest begint, in cm | `45` |
| `begroeiing` | Wat er rond het punt groeit | `struikheide, pijpenstrootje` |
| `dieren` | Wat je er zag of hoorde | `boompieper` |
| `foto` | Bestandsnamen in `assets/img/landschapslijn/` | `punt-4-1.jpg\|punt-4-2.jpg` |

## lagen.csv — één rij per bodemlaag

Een boring met vijf lagen is vijf rijen met hetzelfde puntnummer.

| Kolom | Wat | Voorbeeld |
| --- | --- | --- |
| `punt` | Moet bestaan in `punten.csv` | `4` |
| `van_cm`, `tot_cm` | Diepte onder maaiveld | `0` en `15` |
| `horizont` | `A1` (humus), `A2` (uitspoeling), `B` (inspoeling), `C` (moedermateriaal), `veen` of `onbekend`. Bepaalt de kleur op de site | `A1` |
| `grondsoort` | zand, lemig zand, leem, veen… | `fijn zand` |
| `kleur` | Zoals je hem zag | `zwartbruin` |
| `notitie` | Roest, wortels, nat… | `wortelresten` |

Voorbeeld:

```
punt;van_cm;tot_cm;horizont;grondsoort;kleur;notitie
4;0;15;A1;fijn zand;zwartbruin;veel wortels
4;15;35;A2;fijn zand;lichtgrijs;
4;35;60;B;fijn zand;roestbruin;water op 60 cm
```

## Terrein

`assets/data/oud-meer-terrein.json` is het AHN-hoogtegrid van het gebied. Het wordt eenmalig gemaakt met `_tools/ahn_terrein.py` (zie de uitleg in dat script). Je hoeft het niet aan te passen als er punten bijkomen binnen het gebied: RD x 159050–160400 en y 391600–392050.

## 3D-pagina: three.js, SRI en CSP

De 3D-pagina (`pages/landschapslijn-3d.html`) laadt three.js 0.160.0 van jsdelivr. Twee beveiligingen zorgen dat er alleen code draait die we verwachten:

- **SRI-hashes** in de importmap (`"integrity"`): de browser weigert three.js als het bestand van jsdelivr afwijkt.
- **Content-Security-Policy** (`csp:` in de front matter): alleen scripts van de eigen site, jsdelivr en precies deze importmap. De importmap staat erin als `sha256-…`-hash.

**Let op:** bij een andere three.js-versie of een aangepaste importmap moeten de SRI-hashes en de CSP-hash mee veranderen. In de front matter van `pages/landschapslijn-3d.html` staat daar een opmerking over. Doe je dat niet, dan laadt het 3D-beeld niet, maar er is dan ook geen beveiligingsrisico.

Zo reken je ze opnieuw uit:

1. SRI-hash per bestand. Doe dit voor `build/three.module.js` en `examples/jsm/controls/OrbitControls.js`, en zet het resultaat als `sha384-…` in `"integrity"`:

   ```
   curl -sL https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js | openssl dgst -sha384 -binary | openssl base64 -A
   ```

2. Bouw de site (`bundle exec jekyll build`) en reken de hash van de importmap uit zoals die in de pagina staat. Zet het resultaat in plaats van de oude `sha256-…` in `csp:`:

   ```
   python3 -c "import re,hashlib,base64; s=open('_site/adoptiegebied/landschapslijn/3d/index.html').read(); m=re.search(r'<script type=\"importmap\">(.*?)</script>',s,re.S).group(1); print('sha256-'+base64.b64encode(hashlib.sha256(m.encode()).digest()).decode())"
   ```

3. Controleer dat het 3D-beeld laadt en dat de browserconsole geen meldingen over `integrity` of `Content Security Policy` geeft.
