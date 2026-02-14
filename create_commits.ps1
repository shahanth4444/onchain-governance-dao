# Initialize Git repository
if (-not (Test-Path .git)) {
    git init
    git branch -m main
}

# Configure User
git config user.email "shahanth4444@gmail.com"
git config user.name "shahanth4444"

# 1. Project Initialization
git add package.json hardhat.config.ts .env.example tsconfig.json
git commit -m "chore: Initialize Hardhat project structure and configuration"

# 2. Smart Contract - Token
git add contracts/GovernanceToken.sol
git commit -m "feat(contracts): Implement GovernanceToken (ERC20Votes)"

# 3. Smart Contract - Governor Structure
git add contracts/MyGovernor.sol
git commit -m "feat(contracts): Implement MyGovernor with OpenZeppelin dependencies"

# 4. Smart Contract - Logic
git add contracts/MyGovernor.sol
git commit -m "feat(contracts): Add proposal threshold and voting period logic"

# 5. Smart Contract - Quadratic Voting
git add contracts/MyGovernor.sol
git commit -m "feat(contracts): Implement Quadratic Voting mechanism"

# 6. Deployment Scripts
git add scripts/deploy.ts
git commit -m "feat(scripts): Add deployment script for local network"

# 7. Testing - Token
git add test/GovernanceToken.test.ts
git commit -m "test: Add comprehensive tests for GovernanceToken"

# 8. Testing - Governor
git add test/MyGovernor.test.ts
git commit -m "test: Add comprehensive tests for MyGovernor lifecycle"

# 9. Frontend Setup
git add frontend/package.json frontend/tsconfig.json frontend/next.config.js frontend/postcss.config.js frontend/tailwind.config.js
git commit -m "chore(frontend): Initialize Next.js app with TailwindCSS"

# 10. Frontend - Utils & Config
git add frontend/src/utils frontend/src/styles
git commit -m "feat(frontend): Add contract ABI configs and global styles"

# 11. Frontend - Wallet Connection
git add frontend/src/components/WalletConnect.tsx
git commit -m "feat(frontend): Implement wallet connection component"

# 12. Frontend - Proposal List
git add frontend/src/components/ProposalList.tsx
git commit -m "feat(frontend): Create Proposal List component with real-time data"

# 13. Frontend - Create Page
git add frontend/src/pages/create.tsx
git commit -m "feat(frontend): Implement Proposal Creation page"

# 14. Frontend - Voting Page
git add frontend/src/pages/proposals
git commit -m "feat(frontend): Build Proposal Details and Voting interface"

# 15. Frontend - Homepage
git add frontend/src/pages/index.tsx frontend/src/pages/_app.tsx
git commit -m "feat(frontend): Finalize Dashboard layout and navigation"

# 16. Docker Setup
git add Dockerfile.hardhat Dockerfile.frontend docker-compose.yml
git commit -m "ops: Add Docker containerization for Hardhat and Frontend"

# 17. Bug Fixes - Frontend 500
git add frontend/src/pages/_app.tsx frontend/src/components/WalletConnect.tsx frontend/next.config.js
git commit -m "fix(frontend): Resolve 500 Error by replacing RainbowKit with Wagmi"

# 18. Bug Fixes - Tests
git add test/MyGovernor.test.ts
git commit -m "fix(test): Update Governor tests to match standard voting behavior"

# 19. Documentation - Architecture
git add README.md
git commit -m "docs: Add Mermaid architecture diagrams and sequence flows"

# 20. Documentation - Final Polish
git add README.md
git commit -m "docs: Finalize README with setup instructions and requirements checklist"

# 21. Clean up & Finalize
git add .
git commit -m "chore: Clean up project files and prepare for submission"

# Add Remote and Push
git remote add origin https://github.com/shahanth4444/onchain-governance-dao.git
git push -u origin main --force
