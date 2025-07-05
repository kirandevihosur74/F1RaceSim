from typing import Dict, List, Any
from dataclasses import dataclass
import json

@dataclass
class TrackSector:
    name: str
    length: float  # percentage of total lap
    base_time: float  # base sector time in seconds
    tire_wear_factor: float  # how much this sector wears tires
    fuel_consumption_factor: float  # fuel consumption multiplier

@dataclass
class TrackData:
    name: str
    country: str
    circuit_length: float  # in km
    total_laps: int
    lap_record: float  # in seconds
    sectors: List[TrackSector]
    tire_degradation: Dict[str, float]  # tire compound -> degradation multiplier
    weather_sensitivity: float  # how much weather affects this track
    overtaking_difficulty: float  # 0-1 scale, higher = harder to overtake

class TrackDatabase:
    def __init__(self):
        self.tracks = self._initialize_tracks()
    
    def _initialize_tracks(self) -> Dict[str, TrackData]:
        """Initialize with real F1 track data"""
        tracks = {}
        
        # Monaco - High downforce, low degradation
        tracks["monaco"] = TrackData(
            name="Circuit de Monaco",
            country="Monaco",
            circuit_length=3.337,
            total_laps=78,
            lap_record=71.381,  # Max Verstappen 2021
            sectors=[
                TrackSector("Sector 1", 0.35, 25.0, 0.8, 0.9),  # Low speed, low wear
                TrackSector("Sector 2", 0.40, 28.5, 1.2, 1.1),  # Medium speed, medium wear
                TrackSector("Sector 3", 0.25, 17.9, 0.9, 0.8)   # High speed, low wear
            ],
            tire_degradation={"Soft": 0.7, "Medium": 0.8, "Hard": 0.9, "Intermediate": 1.0, "Wet": 1.1},
            weather_sensitivity=0.3,  # Low sensitivity due to street circuit
            overtaking_difficulty=0.9  # Very difficult to overtake
        )
        
        # Silverstone - Medium downforce, medium degradation
        tracks["silverstone"] = TrackData(
            name="Silverstone Circuit",
            country="Great Britain",
            circuit_length=5.891,
            total_laps=52,
            lap_record=78.871,  # Max Verstappen 2020
            sectors=[
                TrackSector("Sector 1", 0.33, 26.0, 1.1, 1.0),  # High speed corners
                TrackSector("Sector 2", 0.34, 27.5, 1.3, 1.2),  # Medium speed, high wear
                TrackSector("Sector 3", 0.33, 25.4, 1.0, 0.9)   # High speed, medium wear
            ],
            tire_degradation={"Soft": 1.0, "Medium": 1.1, "Hard": 1.2, "Intermediate": 1.0, "Wet": 1.2},
            weather_sensitivity=0.7,  # Medium sensitivity
            overtaking_difficulty=0.4  # Moderate overtaking opportunities
        )
        
        # Spa - High speed, high degradation
        tracks["spa"] = TrackData(
            name="Circuit de Spa-Francorchamps",
            country="Belgium",
            circuit_length=7.004,
            total_laps=44,
            lap_record=103.588,  # Valtteri Bottas 2018
            sectors=[
                TrackSector("Sector 1", 0.40, 41.0, 1.4, 1.3),  # High speed, high wear
                TrackSector("Sector 2", 0.35, 36.0, 1.2, 1.1),  # Medium speed, medium wear
                TrackSector("Sector 3", 0.25, 26.6, 1.0, 0.9)   # Low speed, low wear
            ],
            tire_degradation={"Soft": 1.3, "Medium": 1.4, "Hard": 1.5, "Intermediate": 1.1, "Wet": 1.3},
            weather_sensitivity=0.8,  # High sensitivity due to elevation changes
            overtaking_difficulty=0.3  # Good overtaking opportunities
        )
        
        # Monza - Low downforce, low degradation
        tracks["monza"] = TrackData(
            name="Autodromo Nazionale di Monza",
            country="Italy",
            circuit_length=5.793,
            total_laps=53,
            lap_record=80.872,  # Kimi Räikkönen 2018
            sectors=[
                TrackSector("Sector 1", 0.30, 24.0, 0.7, 0.8),  # High speed, low wear
                TrackSector("Sector 2", 0.40, 32.0, 0.8, 0.9),  # Medium speed, low wear
                TrackSector("Sector 3", 0.30, 24.9, 0.6, 0.7)   # High speed, very low wear
            ],
            tire_degradation={"Soft": 0.6, "Medium": 0.7, "Hard": 0.8, "Intermediate": 1.0, "Wet": 1.1},
            weather_sensitivity=0.5,  # Medium sensitivity
            overtaking_difficulty=0.2  # Easy overtaking
        )
        
        # Suzuka - Technical, medium degradation
        tracks["suzuka"] = TrackData(
            name="Suzuka International Racing Course",
            country="Japan",
            circuit_length=5.807,
            total_laps=53,
            lap_record=81.581,  # Lewis Hamilton 2019
            sectors=[
                TrackSector("Sector 1", 0.35, 28.5, 1.1, 1.0),  # Technical section
                TrackSector("Sector 2", 0.30, 24.5, 1.2, 1.1),  # High speed section
                TrackSector("Sector 3", 0.35, 28.6, 1.0, 0.9)   # Technical section
            ],
            tire_degradation={"Soft": 1.1, "Medium": 1.2, "Hard": 1.3, "Intermediate": 1.0, "Wet": 1.2},
            weather_sensitivity=0.6,  # Medium sensitivity
            overtaking_difficulty=0.5  # Moderate overtaking
        )
        
        return tracks
    
    def get_track(self, track_id: str) -> TrackData:
        """Get track data by ID"""
        return self.tracks.get(track_id, self.tracks["silverstone"])
    
    def get_all_tracks(self) -> Dict[str, TrackData]:
        """Get all available tracks"""
        return self.tracks
    
    def get_track_list(self) -> List[Dict[str, Any]]:
        """Get list of tracks for frontend selection"""
        return [
            {
                "id": track_id,
                "name": track.name,
                "country": track.country,
                "circuit_length": track.circuit_length,
                "total_laps": track.total_laps,
                "lap_record": track.lap_record
            }
            for track_id, track in self.tracks.items()
        ]

# Global instance
track_db = TrackDatabase() 