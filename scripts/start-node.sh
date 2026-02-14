#!/bin/sh

# Start Hardhat Node in the background
npx hardhat node --hostname 0.0.0.0 &
PID=$!

# Wait for the node to be ready (increased for first-run compilation)
echo "Waiting for Hardhat Node to start..."
sleep 30

# Deploy contracts
echo "Deploying contracts..."
npx hardhat run scripts/deploy.js --network localhost

# Keep the node running
wait $PID
