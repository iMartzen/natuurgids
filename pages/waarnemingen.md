---
layout: page
title: Waarnemingen
permalink: /waarnemingen/
subtitle: Mijn natuurwaarnemingen via waarneming.nl
---

Ik registreer mijn waarnemingen op [waarneming.nl]({{ site.waarneming.profile_url }}). De lijst hieronder wordt elke dag automatisch bijgewerkt.

{% if site.data.waarnemingen.results %}
<ul class="waarnemingen-list" style="margin: 1.5rem 0;">
  {% for obs in site.data.waarnemingen.results %}
  {% assign obs_m = obs.date | date: "%-m" | plus: 0 %}
  {% assign obs_m_idx = obs_m | minus: 1 %}
  {% assign obs_maand = site.data.maanden[obs_m_idx] %}
  <li class="waarneming-item">
    {% if obs.photos[0] %}
    <img src="{{ obs.photos[0] }}" alt="{{ obs.species_detail.name }}" loading="lazy" width="56" height="56">
    {% endif %}
    <div class="waarneming-info">
      <strong>{{ obs.species_detail.name | default: "Onbekend" }}</strong>
      <span>{{ obs.date | date: "%-d" }} {{ obs_maand }} {{ obs.date | date: "%Y" }}{% if obs.location_detail %} · {{ obs.location_detail.name }}{% endif %}</span>
    </div>
  </li>
  {% endfor %}
</ul>
<p style="text-align: right; font-size: 0.85rem;">
  <a href="{{ site.waarneming.profile_url }}" target="_blank" rel="noopener">
    Alle {{ site.data.waarnemingen.count }} waarnemingen op waarneming.nl →
  </a>
</p>
{% endif %}

---

## Bijzondere vondsten

*Hier komen uitgebreide notities bij opvallende waarnemingen — soorten die extra aandacht verdienen, bijzonder gedrag of een eerste goede ontmoeting.*

{% assign bio_posts = site.posts | where: "type", "biologisch-moment" %}
{% if bio_posts.size > 0 %}
<div class="post-grid">
  {% for post in bio_posts %}
  {% assign m = post.date | date: "%-m" | plus: 0 %}
  {% assign m_idx = m | minus: 1 %}{% assign maand = site.data.maanden[m_idx] %}
  <article class="post-card">
    <div class="post-card__meta">
      <time class="post-date" datetime="{{ post.date | date_to_xmlschema }}">
        {{ post.date | date: "%-d" }} {{ maand }} {{ post.date | date: "%Y" }}
      </time>
      <span class="post-type post-type--biologisch-moment">biologisch moment</span>
    </div>
    <h3 class="post-card__title">
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
    </h3>
    {% if post.themas %}
    <div class="post-card__themas">{% include tag-pills.html themas=post.themas %}</div>
    {% endif %}
  </article>
  {% endfor %}
</div>
{% else %}
<p style="color: #9e9489; font-style: italic; font-size: 0.9rem;">Nog geen bijzondere vondsten genoteerd.</p>
{% endif %}
