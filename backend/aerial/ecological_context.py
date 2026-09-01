"""
SENTINEL - Ecological Context & Bird Species Intelligence Engine
Evaluates whether an aerial observation makes sense within the regional, seasonal,
diurnal, and habitat environment.
"""

from typing import Dict, Any, List, Optional


class EcologicalContextEngine:
    """
    Knowledge base of Indian border region avian fauna and ecological distributions.
    Regions supported:
      - 'Punjab_Sector'
      - 'Thar_Desert_Sector'
      - 'Ladakh_Himalayan_Sector'
      - 'Rann_of_Kutch_Sector'
      - 'North_East_Sector'
    """
    SPECIES_DB = {
        "Black Kite (Milvus migrans)": {
            "wingspan_cm": "130 - 150",
            "regions": ["Punjab_Sector", "Thar_Desert_Sector", "North_East_Sector", "Rann_of_Kutch_Sector"],
            "seasons": ["Summer", "Winter", "Monsoon", "Post-Monsoon"],
            "habitats": ["Farmland", "Village Perimeter", "Scrubland", "Urban"],
            "flight_style": "Soaring, fork-tail ruddering",
            "diurnal_active": ["Dawn", "Day", "Dusk"]
        },
        "Eurasian Griffon Vulture (Gyps fulvus)": {
            "wingspan_cm": "230 - 265",
            "regions": ["Ladakh_Himalayan_Sector", "Thar_Desert_Sector", "Punjab_Sector"],
            "seasons": ["Winter", "Post-Monsoon"],
            "habitats": ["Cliffs", "Open Plains", "Scrubland"],
            "flight_style": "High-altitude thermal spiraling",
            "diurnal_active": ["Day"]
        },
        "Steppe Eagle (Aquila nipalensis)": {
            "wingspan_cm": "175 - 215",
            "regions": ["Punjab_Sector", "Thar_Desert_Sector", "Rann_of_Kutch_Sector"],
            "seasons": ["Winter"],
            "habitats": ["Open Desert", "Farmland", "Border Scrubland"],
            "flight_style": "Heavy flapping with deep wingbeats",
            "diurnal_active": ["Day", "Dusk"]
        },
        "Demoiselle Crane (Grus virgo)": {
            "wingspan_cm": "155 - 180",
            "regions": ["Thar_Desert_Sector", "Rann_of_Kutch_Sector", "Punjab_Sector"],
            "seasons": ["Winter"],
            "habitats": ["Wetlands", "Agricultural Fields"],
            "flight_style": "V-formation linear long-distance migratory flight",
            "diurnal_active": ["Dawn", "Day", "Dusk"]
        },
        "Common Kestrel (Falco tinnunculus)": {
            "wingspan_cm": "65 - 80",
            "regions": ["Punjab_Sector", "Ladakh_Himalayan_Sector", "Thar_Desert_Sector", "North_East_Sector"],
            "seasons": ["Summer", "Winter", "Monsoon", "Post-Monsoon"],
            "habitats": ["Grassland", "Farmland", "Hills"],
            "flight_style": "Stationary head-wind hovering",
            "diurnal_active": ["Day", "Dusk"]
        },
        "Indian Peafowl (Pavo cristatus)": {
            "wingspan_cm": "130 - 150",
            "regions": ["Punjab_Sector", "Thar_Desert_Sector", "North_East_Sector"],
            "seasons": ["Summer", "Winter", "Monsoon", "Post-Monsoon"],
            "habitats": ["Farmland", "Village Perimeter", "Scrubland"],
            "flight_style": "Short heavy bursts, low altitude",
            "diurnal_active": ["Dawn", "Day", "Dusk"]
        }
    }

    def __init__(self):
        pass

    def evaluate_ecological_consistency(
        self,
        predicted_species: str,
        region: str = "Punjab_Sector",
        season: str = "Winter",
        time_of_day: str = "Day",
        habitat: str = "Farmland"
    ) -> Dict[str, Any]:
        """
        Validates whether the identified species is ecologically expected in the observed context.
        """
        species_info = self.SPECIES_DB.get(predicted_species)
        if not species_info:
            return {
                "species_identified": predicted_species or "Unknown Avian Species",
                "species_confidence": 0.40,
                "region_match": False,
                "season_match": False,
                "time_match": True,
                "habitat_match": False,
                "ecological_consistency_score": 0.30,
                "verdict": "UNVERIFIED_ECOLOGY",
                "explanation": f"Species '{predicted_species}' is not registered in the regional surveillance knowledge base."
            }

        region_ok = region in species_info["regions"]
        season_ok = season in species_info["seasons"]
        time_ok = time_of_day in species_info["diurnal_active"]
        habitat_ok = any(h.lower() in habitat.lower() for h in species_info["habitats"])
        
        matches = [region_ok, season_ok, time_ok, habitat_ok]
        score = round(sum(matches) / 4.0, 2)
        
        reasons = []
        if not region_ok:
            reasons.append(f"Species not typically indigenous or migratory in {region.replace('_', ' ')}")
        if not season_ok:
            reasons.append(f"Out-of-season sighting ({season} is outside expected migration calendar)")
        if not time_ok:
            reasons.append(f"Nocturnal/crepuscular anomaly: species is diurnal and rarely airborne at {time_of_day}")
        if not habitat_ok:
            reasons.append(f"Atypical habitat: species prefers {', '.join(species_info['habitats'])}")

        verdict = "ECOLOGICALLY_CONSISTENT" if score >= 0.75 else ("MODERATE_ANOMALY" if score >= 0.5 else "ECOLOGICAL_CONTRADICTION")

        return {
            "species_identified": predicted_species,
            "wingspan": species_info["wingspan_cm"],
            "flight_style": species_info["flight_style"],
            "species_confidence": 0.86,
            "region_match": region_ok,
            "season_match": season_ok,
            "time_match": time_ok,
            "habitat_match": habitat_ok,
            "ecological_consistency_score": score,
            "verdict": verdict,
            "contradiction_reasons": reasons,
            "explanation": f"Species '{predicted_species}' has {score * 100:.0f}% environmental consistency with {region.replace('_', ' ')} ({season}, {time_of_day})."
        }
