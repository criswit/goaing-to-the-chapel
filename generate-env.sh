#!/bin/bash

# Generate a .env file with the correct values

# Get the current date in the format YYYY-MM-DD
current_date=$(date +%Y-%m-%d)

# Get the current time in the format HH:MM:SS
current_time=$(date +%H:%M:%S)

# Generate the .env file

cat > .env << EOF
ANTHROPIC_API_KEY=$(pass xtendabl/anthropic/apikey)

EOF








