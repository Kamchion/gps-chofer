#!/bin/bash
cd /home/ubuntu/gps-chofer
export EXPO_TOKEN=1Yd7Sy2Gv0KxYkZdNQzBW82AkCQay-JeZpxfQK4B

# Responder automáticamente a la pregunta del keystore
printf "Y\n" | npx eas-cli build --platform android --profile production
