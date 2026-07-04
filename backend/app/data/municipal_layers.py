from dataclasses import dataclass


@dataclass(frozen=True)
class MunicipalLayerConfig:
    city: str
    display_name: str
    constituency_name: str
    code_prefix: str
    layer_id: str
    geojson_url: str
    local_filename: str
    number_keys: tuple[str, ...]
    name_keys: tuple[str, ...]
    default_lat: float
    default_lng: float
    default_zoom: int


MUNICIPAL_LAYERS: tuple[MunicipalLayerConfig, ...] = (
    MunicipalLayerConfig(
        city="bhopal",
        display_name="Bhopal",
        constituency_name="Bhopal (Demo)",
        code_prefix="BPL",
        layer_id="wards_bhopal",
        geojson_url=(
            "https://pub-0429b8e3b5a946e69ea007df844a6f1c.r2.dev/admin/wards-bhopal/wards_bhopal.geojson"
        ),
        local_filename="wards_bhopal.geojson",
        number_keys=("Ward_Number", "ward_number", "WARD_NO", "ward_no"),
        name_keys=("Name", "name", "WARD_NAME", "ward_name"),
        default_lat=23.2599,
        default_lng=77.4126,
        default_zoom=12,
    ),
    MunicipalLayerConfig(
        city="bengaluru",
        display_name="Bengaluru (BBMP)",
        constituency_name="Bengaluru",
        code_prefix="BLR",
        layer_id="wards_bengaluru_bbmp_2022",
        geojson_url=(
            "https://pub-0429b8e3b5a946e69ea007df844a6f1c.r2.dev/"
            "admin/wards-bengaluru-bbmp-2022/wards_bengaluru_bbmp_2022.geojson"
        ),
        local_filename="wards_bengaluru_bbmp_2022.geojson",
        number_keys=("KGISWardNo", "Ward_Number", "ward_number", "WARD_NO"),
        name_keys=("KGISWardName", "Name", "name", "WARD_NAME", "Ward Name"),
        default_lat=12.9716,
        default_lng=77.5946,
        default_zoom=11,
    ),
    MunicipalLayerConfig(
        city="kanpur",
        display_name="Kanpur",
        constituency_name="Kanpur",
        code_prefix="KNP",
        layer_id="wards_kanpur",
        geojson_url=(
            "https://pub-0429b8e3b5a946e69ea007df844a6f1c.r2.dev/admin/wards-kanpur/wards_kanpur.geojson"
        ),
        local_filename="wards_kanpur.geojson",
        number_keys=("Ward No", "Ward_No", "Ward_Number", "ward_number", "WARD_NO"),
        name_keys=("Ward Name", "Ward_Name", "Name", "name", "WARD_NAME"),
        default_lat=26.4499,
        default_lng=80.3319,
        default_zoom=12,
    ),
)

CITY_BY_ID = {layer.city: layer for layer in MUNICIPAL_LAYERS}
