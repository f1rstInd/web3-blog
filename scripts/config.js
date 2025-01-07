// scripts/config.js
const config = {
  development: {
    url: "http://localhost:8545",
    networkId: "31337"
  },
  goerli: {
    url: process.env.GOERLI_URL,
    networkId: "5"
  },
  mainnet: {
    url: process.env.MAINNET_URL,
    networkId: "1"
  }
};

module.exports = config;
