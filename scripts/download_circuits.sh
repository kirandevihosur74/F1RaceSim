#!/bin/bash

# Directory to store SVGs
mkdir -p public/circuits

# Download SVGs for each circuit
curl -L -o public/circuits/monaco.svg "https://upload.wikimedia.org/wikipedia/commons/6/6e/Monte_Carlo_Formula_1_track_map.svg"
curl -L -o public/circuits/silverstone.svg "https://upload.wikimedia.org/wikipedia/commons/5/5e/Silverstone_circuit_2020.svg"
curl -L -o public/circuits/spa.svg "https://upload.wikimedia.org/wikipedia/commons/5/5c/Circuit_Spa.svg"
curl -L -o public/circuits/monza.svg "https://upload.wikimedia.org/wikipedia/commons/2/2e/Monza_track_map.svg"
curl -L -o public/circuits/suzuka.svg "https://upload.wikimedia.org/wikipedia/commons/6/6e/Suzuka_circuit_map.svg"
curl -L -o public/circuits/adelaide.svg "https://upload.wikimedia.org/wikipedia/commons/2/2d/Adelaide_Street_Circuit.svg"
curl -L -o public/circuits/albert_park.svg "https://upload.wikimedia.org/wikipedia/commons/6/6b/Melbourne_GP_Circuit.svg"
# Add more as needed, matching your track IDs

echo "All SVGs downloaded to public/circuits/" 