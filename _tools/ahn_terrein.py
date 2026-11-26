"""Haalt het AHN-hoogtegrid (maaiveld, DTM) van het Oud Meer op bij PDOK en
schrijft het naar assets/data/oud-meer-terrein.json voor de landschapslijn.

Eenmalig draaien, of opnieuw als het gebied groter moet:

    python3 -m venv ~/.venvs/ahn && ~/.venvs/ahn/bin/pip install numpy tifffile imagecodecs
    ~/.venvs/ahn/bin/python _tools/ahn_terrein.py

Uitvoer:
    {"bron", "x0", "y0", "cel", "nx", "ny", "hoogtes_cm": [...]}
    x0, y0 = RD-coördinaat van het midden van de cel linksboven (noordwest),
    rijen lopen van noord naar zuid, kolommen van west naar oost.
    hoogtes_cm[rij * nx + kolom] in cm t.o.v. NAP, null = geen AHN-data
    (vooral open water).
"""
import io
import json
import pathlib
import urllib.request

import numpy as np
import tifffile

GEBIED = {"xmin": 159050, "xmax": 160400, "ymin": 391600, "ymax": 392050}
CEL = 5  # meter
URL = (
    "https://service.pdok.nl/rws/ahn/wcs/v1_0?service=WCS&version=2.0.1"
    "&request=GetCoverage&CoverageId=dtm_05m&format=image/tiff"
    "&subset=x({xmin},{xmax})&subset=y({ymin},{ymax})"
    "&scalesize=x({nx}),y({ny})"
)
UIT = pathlib.Path(__file__).resolve().parent.parent / "assets/data/oud-meer-terrein.json"


def main():
    nx = (GEBIED["xmax"] - GEBIED["xmin"]) // CEL
    ny = (GEBIED["ymax"] - GEBIED["ymin"]) // CEL
    url = URL.format(nx=nx, ny=ny, **GEBIED)
    req = urllib.request.Request(url, headers={"User-Agent": "natuurgids-landschapslijn"})
    data = urllib.request.urlopen(req, timeout=60).read()

    with tifffile.TiffFile(io.BytesIO(data)) as tif:
        grid = tif.pages[0].asarray().astype("float64")
        tags = tif.pages[0].tags
        nodata = tags.get("GDAL_NODATA")
        scale = tags.get("ModelPixelScaleTag")
        tie = tags.get("ModelTiepointTag")

    if grid.ndim == 3:
        grid = grid[..., 0]
    if grid.shape != (ny, nx):
        raise SystemExit(f"onverwachte grootte {grid.shape}, verwacht {(ny, nx)}")

    # Geotransform uit de TIFF-tags halen als die er zijn, anders uit het gebied.
    cel_x = scale.value[0] if scale else CEL
    cel_y = scale.value[1] if scale else CEL
    links = tie.value[3] if tie else GEBIED["xmin"]
    boven = tie.value[4] if tie else GEBIED["ymax"]

    leeg = ~np.isfinite(grid) | (grid > 1000) | (grid < -100)
    if nodata is not None:
        leeg |= grid == float(nodata.value)

    hoogtes = [None if leeg.flat[i] else int(round(grid.flat[i] * 100)) for i in range(grid.size)]
    uit = {
        "bron": "AHN DTM 0,5 m via PDOK WCS, herbemonsterd naar 5 m",
        "x0": round(links + cel_x / 2, 2),
        "y0": round(boven - cel_y / 2, 2),
        "cel": round(cel_x, 3),
        "nx": nx,
        "ny": ny,
        "hoogtes_cm": hoogtes,
    }
    UIT.parent.mkdir(parents=True, exist_ok=True)
    UIT.write_text(json.dumps(uit, separators=(",", ":")))
    geldig = grid[~leeg]
    print(f"{UIT}: {nx}x{ny} cellen, {int(leeg.sum())} zonder data, "
          f"hoogte {geldig.min():.2f} tot {geldig.max():.2f} m NAP, cel {cel_x} x {cel_y} m")


if __name__ == "__main__":
    main()
