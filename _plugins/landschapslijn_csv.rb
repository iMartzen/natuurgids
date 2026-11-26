# frozen_string_literal: true

# Leest de gegevens van de landschapslijn uit _landschapslijn/*.csv en zet ze
# in site.data["landschapslijn"]. De standaard CSV-lezer van Jekyll kan geen
# puntkomma aan; exports uit Excel en Numbers (NL) gebruiken die juist.
#
# - scheidingsteken ; of , wordt per bestand herkend
# - een BOM aan het begin wordt genegeerd
# - decimale komma's worden punten (15,72 -> 15.72)
# - lagen worden per punt aan het punt gehangen
# - punten worden van west naar oost gesorteerd langs de lijn tussen het
#   westelijkste en het oostelijkste punt
require "csv"

module Landschapslijn
  MAP = "_landschapslijn"
  GETALLEN = %w[breedtegraad lengtegraad RD_x RD_y hoogte_AHN_m_NAP
                water_cm_onder_maaiveld water_m_NAP humus_cm roest_cm
                van_cm tot_cm].freeze
  HORIZONTEN = %w[A1 A2 B C veen onbekend].freeze
  # Puntnummers en fotonamen komen in id's, klassen en URL's terecht:
  # alleen letters, cijfers, punt, streepje en liggend streepje.
  VEILIG_PUNT = /\A[A-Za-z0-9_-]{1,12}\z/.freeze
  VEILIGE_FOTO = /\A[A-Za-z0-9_-][A-Za-z0-9._-]{0,80}\.(jpe?g|png|webp|gif)\z/i.freeze

  class Generator < Jekyll::Generator
    priority :highest

    def generate(site)
      dir = File.join(site.source, MAP)
      return unless File.directory?(dir)

      punten = lees(File.join(dir, "punten.csv")).select do |p|
        next true if p["punt"].match?(VEILIG_PUNT)

        Jekyll.logger.warn "Landschapslijn:", "punt '#{p['punt']}' overgeslagen: gebruik alleen letters, cijfers, - of _"
        false
      end
      lagen = lees(File.join(dir, "lagen.csv"))

      per_punt = Hash.new { |h, k| h[k] = [] }
      ids = punten.map { |p| p["punt"] }
      lagen.each do |laag|
        id = laag["punt"]
        unless ids.include?(id)
          Jekyll.logger.warn "Landschapslijn:", "laag voor onbekend punt '#{id}' in lagen.csv"
          next
        end
        if laag["van_cm"] && laag["tot_cm"] && laag["van_cm"] > laag["tot_cm"]
          Jekyll.logger.warn "Landschapslijn:", "punt #{id}: van_cm (#{laag['van_cm']}) is groter dan tot_cm (#{laag['tot_cm']})"
        end
        if laag["horizont"] && !HORIZONTEN.include?(laag["horizont"])
          Jekyll.logger.warn "Landschapslijn:", "punt #{id}: onbekende horizont '#{laag['horizont']}' (gebruik #{HORIZONTEN.join(', ')})"
        end
        laag["klasse"] = HORIZONTEN.include?(laag["horizont"]) ? laag["horizont"] : "onbekend"
        per_punt[id] << laag
      end

      punten.each do |p|
        p["lagen"] = per_punt[p["punt"]].sort_by { |l| l["van_cm"] || 0 }
        p["foto"] = (p["foto"] || "").split("|").map(&:strip).reject(&:empty?).select do |f|
          next true if f.match?(VEILIGE_FOTO)

          Jekyll.logger.warn "Landschapslijn:", "punt #{p['punt']}: foto '#{f}' overgeslagen (alleen een bestandsnaam als punt-4-1.jpg)"
          false
        end
        if p["water_m_NAP"].nil? && p["water_cm_onder_maaiveld"] && p["hoogte_AHN_m_NAP"]
          p["water_m_NAP"] = (p["hoogte_AHN_m_NAP"] - p["water_cm_onder_maaiveld"] / 100.0).round(2)
        end
      end

      lijn = langs_lijn(punten)
      geldig = per_punt.values.sum(&:size)
      site.data["landschapslijn"] = { "punten" => punten, "lijn" => lijn, "aantal_lagen" => geldig }
      Jekyll.logger.info "Landschapslijn:", "#{punten.size} punten, #{geldig} lagen"
    end

    private

    def lees(pad)
      return [] unless File.exist?(pad)

      tekst = File.read(pad, encoding: "bom|utf-8")
      kop = tekst.lines.first.to_s
      sep = kop.count(";") >= kop.count(",") ? ";" : ","
      rijen = begin
        CSV.parse(tekst, col_sep: sep, headers: true, liberal_parsing: true)
      rescue CSV::MalformedCSVError => e
        Jekyll.logger.warn "Landschapslijn:", "#{File.basename(pad)} kon niet gelezen worden (#{e.message}); bestand overgeslagen"
        return []
      end
      rijen.map do |rij|
        rij.to_h.each_with_object({}) do |(k, v), h|
          next if k.nil?

          k = k.strip
          v = v&.strip
          v = nil if v == ""
          if v && GETALLEN.include?(k)
            f = v.tr(",", ".").to_f
            v = (f % 1).zero? && !%w[breedtegraad lengtegraad].include?(k) ? f.to_i : f
          end
          h[k] = v
        end
      end.reject { |r| r["punt"].nil? }
    end

    # Projecteer elk punt op de lijn van het westelijkste naar het
    # oostelijkste punt: afstand langs de lijn en afstand ernaast.
    def langs_lijn(punten)
      met_xy = punten.select { |p| p["RD_x"] && p["RD_y"] }
      return {} if met_xy.size < 2

      a = met_xy.min_by { |p| p["RD_x"] }
      b = met_xy.max_by { |p| p["RD_x"] }
      dx = b["RD_x"] - a["RD_x"]
      dy = b["RD_y"] - a["RD_y"]
      len = Math.hypot(dx, dy)
      punten.each do |p|
        next unless p["RD_x"]

        rx = p["RD_x"] - a["RD_x"]
        ry = p["RD_y"] - a["RD_y"]
        p["afstand_m"] = ((rx * dx + ry * dy) / len).round
        naast = ((dx * ry - dy * rx) / len).round
        p["naast_lijn_m"] = naast.abs
        p["naast_kant"] = naast.positive? ? "noord" : (naast.negative? ? "zuid" : "")
      end
      punten.sort_by! { |p| p["afstand_m"] || 0 }
      { "van" => a["punt"], "tot" => b["punt"], "lengte_m" => len.round }
    end
  end
end
