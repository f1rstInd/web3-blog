// scripts/upgrade.js
const { ethers, upgrades } = require("hardhat");
const { ErrorHandler } = require("../utils/errorHandler");

async function upgradeContract(contractName, proxyAddress) {
    try {
        console.log(chalk.blue(`Starting upgrade for ${contractName}...`));
        
        // Get the new implementation contract factory
        const ContractFactory = await ethers.getContractFactory(contractName);
        
        // Validate upgrade
        console.log("Validating upgrade...");
        await ErrorHandler.handleContractError(
            upgrades.validateUpgrade(proxyAddress, ContractFactory),
            contractName,
            "validate upgrade"
        );

        // Prepare upgrade
        console.log("Preparing upgrade...");
        const upgradedContract = await ErrorHandler.handleContractError(
            upgrades.prepareUpgrade(proxyAddress, ContractFactory),
            contractName,
            "prepare upgrade"
        );

        // Perform upgrade
        console.log("Performing upgrade...");
        const upgraded = await ErrorHandler.handleContractError(
            upgrades.upgradeProxy(proxyAddress, ContractFactory),
            contractName,
            "upgrade proxy"
        );

        console.log(chalk.green(`${contractName} upgraded successfully`));
        console.log("New implementation address:", upgradedContract);
        
        // Verify new implementation
        if (process.env.ETHERSCAN_API_KEY) {
            await ErrorHandler.handleContractError(
                hre.run("verify:verify", {
                    address: upgradedContract,
                    constructorArguments: []
                }),
                contractName,
                "verify contract"
            );
        }

        return upgraded;
    } catch (error) {
        ErrorHandler.logError(error, {
            contractName,
            proxyAddress,
            network: hre.network.name
        });
        throw error;
    }
}

// Enhanced deployment script with upgrade support
async function deployUpgradeableContract(contractName, args = []) {
    try {
        console.log(chalk.blue(`Deploying upgradeable ${contractName}...`));
        
        const ContractFactory = await ethers.getContractFactory(contractName);
        
        // Deploy proxy
        const proxy = await ErrorHandler.handleContractError(
            upgrades.deployProxy(ContractFactory, args, {
                initializer: 'initialize',
                kind: 'transparent'
            }),
            contractName,
            "deploy proxy"
        );

        await proxy.deployed();
        
        console.log(chalk.green(
            `${contractName} deployed to:`,
            proxy.address
        ));

        return proxy;
    } catch (error) {
        ErrorHandler.logError(error, {
            contractName,
            network: hre.network.name
        });
        throw error;
    }
}

// Script to upgrade all contracts
async function upgradeAllContracts() {
    const addresses = require('./addresses.json');
    const contracts = ['BlogPost', 'NFTAccess', 'Tipping'];
    
    for (const contractName of contracts) {
        if (!addresses[contractName]) {
            console.warn(chalk.yellow(
                `No proxy address found for ${contractName}, skipping...`
            ));
            continue;
        }

        try {
            await upgradeContract(contractName, addresses[contractName]);
        } catch (error) {
            console.error(chalk.red(
                `Failed to upgrade ${contractName}. Continuing with remaining contracts...`
            ));
            ErrorHandler.logError(error, {
                contractName,
                proxyAddress: addresses[contractName]
            });
        }
    }
}

// Migration state tracker
class MigrationState {
    constructor() {
        this.migrations = new Map();
    }

    async track(name, operation) {
        try {
            console.log(chalk.blue(`Starting migration: ${name}`));
            const startTime = Date.now();
            const result = await operation();
            const duration = Date.now() - startTime;
            
            this.migrations.set(name, {
                status: 'completed',
                timestamp: new Date().toISOString(),
                duration,
                success: true
            });
            
            return result;
        } catch (error) {
            this.migrations.set(name, {
                status: 'failed',
                timestamp: new Date().toISOString(),
                error: error.message,
                success: false
            });
            throw error;
        }
    }

    async saveMigrationState() {
        const fs = require('fs').promises;
        await fs.writeFile(
            'migration-state.json',
            JSON.stringify(Object.fromEntries(this.migrations), null, 2)
        );
    }
}

// Main upgrade script
async function main() {
    const migrationState = new MigrationState();
    
    try {
        // Deploy new upgradeable contracts if needed
        if (process.env.DEPLOY_NEW) {
            await migrationState.track('BlogPost', () =>
                deployUpgradeableContract('BlogPost')
            );
            await migrationState.track('NFTAccess', () =>
                deployUpgradeableContract('NFTAccess')
            );
            await migrationState.track('Tipping', () =>
                deployUpgradeableContract('Tipping')
            );
        }

        // Upgrade existing contracts
        await migrationState.track('UpgradeAll', upgradeAllContracts);
        
        console.log(chalk.green('\nAll upgrades completed successfully!'));
    } catch (error) {
        console.error(chalk.red('\nUpgrade process failed!'));
        ErrorHandler.logError(error, {
            network: hre.network.name,
            timestamp: new Date().toISOString()
        });
    } finally {
        await migrationState.saveMigrationState();
    }
}

// Add to package.json scripts
const scripts = {
    "upgrade": "hardhat run scripts/upgrade.js",
    "upgrade:goerli": "hardhat run scripts/upgrade.js --network goerli",
    "upgrade:mainnet": "hardhat run scripts/upgrade.js --network mainnet"
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        ErrorHandler.logError(error);
        process.exit(1);
    });
