#!/bin/bash

# Read the JSON file and load into Redis
cat data.json | jq -c '.[]' | while read -r line; do
    redis-cli --raw HSET address_amount $(
        echo "$line" | jq -r '.address'
    ) $(
        echo "$line" | jq -r '.amount'
    )
done