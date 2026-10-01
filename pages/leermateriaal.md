---
layout: page
title: Leermateriaal
permalink: /leermateriaal/
subtitle: Aantekeningen en referentiemateriaal per blok
---

Hier komen theorie-aantekeningen, soortprofielen en referentiemateriaal per blok van de opleiding. De opleiding start in september 2026.

---

<div class="blok-section" markdown="1" id="blok-1">
<span class="blok-badge">Blok 1 · Sept–Nov 2026</span>

## Ecologie & ecosystemen

Relaties tussen en binnen soorten, biotische en abiotische factoren, voedselrelaties, kringlopen, successie en biodiversiteit. Boek: deel 4.

{% assign lessen = site.aantekeningen | where: "blok", 1 | sort: "date" %}
<ul class="les-lijst">
  {% for les in lessen %}
  {% assign m_idx = les.date | date: "%-m" | minus: 1 %}
  <li>
    <time datetime="{{ les.date | date_to_xmlschema }}">{{ les.date | date: "%-d" }} {{ site.data.maanden[m_idx] }}</time>
    <a href="{{ les.url | relative_url }}">{{ les.title }}</a>
  </li>
  {% endfor %}
</ul>
</div>

<div class="blok-section" markdown="1" id="blok-2">
<span class="blok-badge">Blok 2</span>

## Planten & Bodem

Determineren van wilde planten, bodemtypen, wildplukken, presentatietechnieken.

*Aantekeningen volgen.*
</div>

<div class="blok-section" markdown="1" id="blok-3">
<span class="blok-badge">Blok 3</span>

## Dieren

Vogels, zoogdieren, insecten en amfibieën in het veld. Voorkennis: BMP-methodiek, BirdNET.

*Aantekeningen volgen.*
</div>

<div class="blok-section" markdown="1" id="blok-4">
<span class="blok-badge">Blok 4</span>

## Ecologie & Communicatie

Ecosystemen, voedselwebben, NME-opdracht, schrijven en communiceren over natuur.

*Aantekeningen volgen.*
</div>

<div class="blok-section" markdown="1" id="blok-5">
<span class="blok-badge">Blok 5 · 2028</span>

## Landschap

Leesbaar landschap: geologische en historische lijnen, landschapslijn, adoptiegebied, eindpresentatie.

*Aantekeningen volgen.*
</div>
