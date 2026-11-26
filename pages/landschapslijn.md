---
layout: page
title: Landschapslijn Oud Meer
permalink: /adoptiegebied/landschapslijn/
subtitle: Zeven boringen en een podzolwandje, van west naar oost door ons adoptiegebied
---

{% assign ll = site.data.landschapslijn %}

Een **landschapslijn** (of transect) is een lijn door het landschap waarlangs je laat zien hoe bodem, water, planten en dieren met elkaar samenhangen. Met ons groepje, Henriëtte, Anouk, Christiaan, Ron en ik, maken we er een door het [Oud Meer]({{ '/adoptiegebied/' | relative_url }}). Op **25 november 2026** hebben we geboord. Op **16 december** presenteren we de lijn als poster.

<p class="ll-actie">
  <a class="ll-knop" href="{{ '/adoptiegebied/landschapslijn/3d/' | relative_url }}">Bekijk in 3D →</a>
</p>

<p class="ll-melding"><strong>Werk in uitvoering.</strong> Hier staat alleen wat we zelf hebben gemeten of in bronnen hebben gevonden. De bodemlagen per boring, de begroeiing en de foto's komen er nog bij.</p>

## Kaart en hoogteprofiel

De lijn loopt van punt {{ ll.lijn.van | escape }} in het westen naar punt {{ ll.lijn.tot | escape }} in het oosten: hemelsbreed {{ ll.lijn.lengte_m }} meter. Het reliëf komt uit het Actueel Hoogtebestand Nederland (AHN).

<figure class="ll-figuur">
  <div id="ll-kaart" class="ll-kaart" data-terrein="{{ '/assets/data/oud-meer-terrein.json' | relative_url }}">Kaart laden…</div>
  <figcaption>Boorpunten op het AHN-reliëf: licht is hoog, groen is laag, blauw is open water. ◆ = podzolwandje.</figcaption>
</figure>

<figure class="ll-figuur">
  <div id="ll-profiel" class="ll-profiel"></div>
  <figcaption>Het echte terrein langs de route van punt naar punt, met de gemeten waterstanden. De hoogte is sterk overdreven: tussen het hoogste en het laagste boorpunt zit maar 1,21 meter.</figcaption>
</figure>

## Per punt

Van west naar oost. De afstand is gemeten langs de rechte lijn van punt {{ ll.lijn.van | escape }} naar punt {{ ll.lijn.tot | escape }}.

<div class="ll-punten">
{% for p in ll.punten %}
  <article class="ll-punt{% if p.soort == 'wandje' %} ll-punt--wandje{% endif %}" id="punt-{{ p.punt | slugify }}">
    <header class="ll-punt__kop">
      <span class="ll-punt__nr">{{ p.punt | escape }}</span>
      <div>
        <h3>{% if p.soort == 'wandje' %}Podzolwandje{% else %}Boring {{ p.punt | escape }}{% endif %}</h3>
        <p>{{ p.afstand_m }} m langs de lijn{% if p.naast_lijn_m > 5 %}, {{ p.naast_lijn_m }} m {{ p.naast_kant | escape }}{% endif %} · {{ p.hoogte_AHN_m_NAP | round: 2 | replace: '.', ',' }} m NAP · <a href="{{ '/adoptiegebied/landschapslijn/3d/' | relative_url }}#punt-{{ p.punt | slugify }}">in 3D</a></p>
      </div>
    </header>
    <div class="ll-punt__body">
      <div class="ll-kern" aria-label="Bodemlagen tot 120 cm">
        {% for l in p.lagen %}
        <div class="ll-kern__laag ll-kern__laag--{{ l.klasse | default: 'onbekend' }}" style="top: {{ l.van_cm | divided_by: 1.2 }}%; height: {{ l.tot_cm | minus: l.van_cm | divided_by: 1.2 }}%;" title="{{ l.van_cm }}–{{ l.tot_cm }} cm: {{ l.horizont | escape }} {{ l.grondsoort | escape }}"></div>
        {% endfor %}
        {% if p.lagen.size == 0 %}<span class="ll-kern__leeg">nog geen lagen</span>{% endif %}
        {% if p.water_cm_onder_maaiveld %}<div class="ll-kern__water" style="top: {{ p.water_cm_onder_maaiveld | divided_by: 1.2 }}%;"><span>water {{ p.water_cm_onder_maaiveld }} cm</span></div>{% endif %}
        <span class="ll-kern__schaal ll-kern__schaal--0">0</span><span class="ll-kern__schaal ll-kern__schaal--120">120 cm</span>
      </div>
      <dl class="ll-punt__gegevens">
        {% if p.lagen.size > 0 %}
        <dt>Lagen</dt>
        <dd><ul>{% for l in p.lagen %}<li>{{ l.van_cm }}–{{ l.tot_cm }} cm: {{ l.horizont | escape }}{% if l.grondsoort %}, {{ l.grondsoort | escape }}{% endif %}{% if l.kleur %}, {{ l.kleur | escape }}{% endif %}{% if l.notitie %} ({{ l.notitie | escape }}){% endif %}</li>{% endfor %}</ul></dd>
        {% endif %}
        <dt>Bodemtype</dt><dd>{% if p.bodemtype %}{{ p.bodemtype | escape }}{% else %}<span class="ll-leeg">nog aan te vullen</span>{% endif %}</dd>
        <dt>Water</dt><dd>{% if p.water_cm_onder_maaiveld %}{{ p.water_cm_onder_maaiveld }} cm onder maaiveld ({{ p.water_m_NAP | round: 2 | replace: '.', ',' }} m NAP){% elsif p.notitie contains 'nat' %}{{ p.notitie | escape }}{% else %}<span class="ll-leeg">nog aan te vullen</span>{% endif %}</dd>
        <dt>Humus</dt><dd>{% if p.humus_cm %}{{ p.humus_cm }} cm{% else %}<span class="ll-leeg">nog aan te vullen</span>{% endif %}</dd>
        <dt>Roest</dt><dd>{% if p.roest_cm %}vanaf {{ p.roest_cm }} cm{% else %}<span class="ll-leeg">nog aan te vullen</span>{% endif %}</dd>
        <dt>Begroeiing</dt><dd>{% if p.begroeiing %}{{ p.begroeiing | escape }}{% else %}<span class="ll-leeg">nog aan te vullen</span>{% endif %}</dd>
        <dt>Dieren</dt><dd>{% if p.dieren %}{{ p.dieren | escape }}{% else %}<span class="ll-leeg">nog aan te vullen</span>{% endif %}</dd>
        {% if p.notitie and p.water_cm_onder_maaiveld == nil %}{% unless p.notitie contains 'nat' %}<dt>Notitie</dt><dd>{{ p.notitie | escape }}</dd>{% endunless %}{% endif %}
      </dl>
    </div>
    {% if p.foto.size > 0 %}
    <div class="ll-punt__fotos">
      {% for f in p.foto %}<img src="{{ '/assets/img/landschapslijn/' | append: f | relative_url | escape }}" alt="Punt {{ p.punt | escape }}, foto {{ forloop.index }}" loading="lazy">{% endfor %}
    </div>
    {% endif %}
  </article>
{% endfor %}
</div>

Wat voor alle boringen geldt: het is **allemaal zand**, en we zagen echt **moedermateriaal** (de C-horizont). We hebben gekeken of er onder de natte laag **leem** zat, maar dat vonden we niet. Bij de landtong van het ven stuitten we al snel op een natte laag.

## Grondwater: op rood, en toch water op 60 cm

Bij het eerste strandje staat een **grondwatermeter**. Volgens het bord zit het grondwater daar gemiddeld 3 tot 4 meter onder de grond. Op 25 november stond de stand **helemaal onderin het rode vak**: lager dan gemiddeld.

Toch vonden we bij **boring 4 en 7 water op 60 cm**. Hoe kan dat? Onze voorlopige uitleg is een **schijnwaterspiegel**: regenwater dat blijft staan op een laag die het slecht doorlaat, hoog boven het echte grondwater. Volgens het bord ligt onder het ven een **verdichte leemlaag** die als een kommetje werkt. Die laag hebben wij zelf **niet aangetoond**, dus dit is nog niet bewezen.

> *Zand is een zeef, leem is een kommetje.* Het ven is een regenbakje bovenop een grote zandzeef. Dat zegt het bord; zelf hebben we het niet aangeboord.

Wat het precies is, weten we nog niet. We denken erover na en delen onze ideeën in de groep.

## Wat de bodemkaart verwacht

Op de bodemkaart staan in dit gebied twee bodemtypen. Bij de presentatie willen we laten zien welke bij welk punt hoort:

| Code | Bodemtype | Wat je in de boring verwacht |
| --- | --- | --- |
| Hn21 | Veldpodzol | Duidelijke lagen: A1, A2, B en C |
| Zd21 | Duinvaaggrond (stuifzand) | Weinig of geen duidelijke lagen |

Bij het **podzolwandje (P)** zagen we een podzol. Klopt de kaart ook bij de boringen? Dat vullen we aan.

## Hoe oud is het Oud Meer?

Dat is de puzzel van onze lijn, want twee rapporten van de gemeente spreken elkaar tegen:

| Bron | Wat staat erin |
| --- | --- |
| [Ontwikkelingsvisie Nieuwe Heide en Oud Meer (2021)](https://repository.officiele-overheidspublicaties.nl/externebijlagen/exb-2023-45072/currentItem) | In 1850 staat het ven niet op de kaart; het gebied hoort dan bij de Breugelsche heide. In 1930 is het klein ingetekend, in 1955 heeft het zijn huidige vorm. |
| [Integraal beheerplan Son en Breugel 2020–2029](https://cuatro.sim-cdn.nl/sonenbreugel/uploads/bosbeheerplan-gemeente-son-en-breugel.pdf) | Rond 1800 hoort het gebied bij de grote Sonsche Heide. Op de kaart van 1900 staan het Oud Meer en de natte laagtes er al. Het ven is ontstaan door vervening. |

Dat gaan we zelf nakijken op [Topotijdreis](https://www.topotijdreis.nl/). Het past mooi bij [de les over het cultuurhistorische landschap]({% post_url 2026-11-25-les-cultuurhistorisch-landschap %}): tussen 1920 en 1950 werd het gebied grotendeels ontwaterd en beplant met grove den en eik, en tot 1955 werd bijna alle heide ontgonnen of bebost.

## Planten en dieren

<p class="ll-melding">Dit deel vullen we nog aan: per boorpunt de begroeiing en de dieren die we er zagen.</p>

## Bronnen

- [Ontwikkelingsvisie Nieuwe Heide en Oud Meer (2021)](https://repository.officiele-overheidspublicaties.nl/externebijlagen/exb-2023-45072/currentItem)
- [Integraal beheerplan bos- en natuurterreinen Son en Breugel 2020–2029](https://cuatro.sim-cdn.nl/sonenbreugel/uploads/bosbeheerplan-gemeente-son-en-breugel.pdf)
- Hoogte: [AHN](https://www.ahn.nl), maaiveld (DTM 0,5 m) via [PDOK](https://service.pdok.nl/rws/ahn/wcs/v1_0)
- Bodemkaart: [BRO Bodemkaart](https://bodemdata.nl)
- Informatiebord en grondwatermeter bij het Oud Meer (gemeente Son en Breugel, Waterschap De Dommel, provincie Noord-Brabant)
- Schijnwaterspiegel: [Joost de Vree](https://www.joostdevree.nl/s/schijnwaterstand)
- Lesstof: [bodem en landschapslijn]({{ '/leermateriaal/bodem-les-10/' | relative_url }}) en [de oefenexcursie bij Heukelom]({% post_url 2026-11-21-excursie-landschapslijn-heukelom %})

<script type="application/json" id="ll-data">{{ ll | jsonify | replace: '<', '\u003c' }}</script>
<script type="module" src="{{ '/assets/js/landschapslijn.js' | relative_url }}"></script>
