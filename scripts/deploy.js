// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Deploy BlogPost contract
  const BlogPost = await hre.ethers.getContractFactory("BlogPost");
  console.log("Deploying BlogPost...");
  const blogPost = await BlogPost.deploy();
  await blogPost.deployed();
  console.log("BlogPost deployed to:", blogPost.address);

  // Deploy NFTAccess contract
  const NFTAccess = await hre.ethers.getContractFactory("NFTAccess");
  console.log("Deploying NFTAccess...");
  const nftAccess = await NFTAccess.deploy();
  await nftAccess.deployed();
  console.log("NFTAccess deployed to:", nftAccess.address);

  // Deploy Tipping contract
  const Tipping = await hre.ethers.getContractFactory("Tipping");
  console.log("Deploying Tipping...");
  const tipping = await Tipping.deploy();
  await tipping.deployed();
  console.log("Tipping deployed to:", tipping.address);

  // Save the contract addresses
  saveContractAddresses({
    BlogPost: blogPost.address,
    NFTAccess: nftAccess.address,
    Tipping: tipping.address,
  });

  // Verify contracts on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying contracts on Etherscan...");
    await hre.run("verify:verify", {
      address: blogPost.address,
      constructorArguments: [],
    });
    await hre.run("verify:verify", {
      address: nftAccess.address,
      constructorArguments: [],
    });
    await hre.run("verify:verify", {
      address: tipping.address,
      constructorArguments: [],
    });
  }
}

function saveContractAddresses(addresses) {
  const fs = require("fs");
  const path = require("path");
  
  // Save addresses for frontend
  fs.writeFileSync(
    path.join(__dirname, "../frontend/src/contracts/addresses.json"),
    JSON.stringify(addresses, null, 2)
  );
  
  // Save addresses for contract interaction scripts
  fs.writeFileSync(
    path.join(__dirname, "../scripts/addresses.json"),
    JSON.stringify(addresses, null, 2)
  );
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
