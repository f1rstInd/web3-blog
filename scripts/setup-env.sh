#!/bin/bash
# scripts/setup-env.sh

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    touch .env
fi

# Add environment variables
echo "PRIVATE_KEY=" >> .env
echo "ETHERSCAN_API_KEY=" >> .env
echo "GOERLI_URL=" >> .env
echo "MAINNET_URL=" >> .env
echo "WEB3_STORAGE_TOKEN=" >> .env

echo "Environment file created. Please fill in the values in .env"
