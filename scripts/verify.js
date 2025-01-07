// scripts/verify.js
const hre = require("hardhat");
const addresses = require("./addresses.json");

async function main() {
  console.log("Starting contract verification...");

  try {
    await hre.run("verify:verify", {
      address: addresses.BlogPost,
      constructorArguments: [],
    });
    console.log("BlogPost contract verified");

    await hre.run("verify:verify", {
      address: addresses.NFTAccess,
      constructorArguments: [],
    });
    console.log("NFTAccess contract verified");

    await hre.run("verify:verify", {
      address: addresses.Tipping,
      constructorArguments: [],
    });
    console.log("Tipping contract verified");
  } catch (error) {
    console.error("Error during verification:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
