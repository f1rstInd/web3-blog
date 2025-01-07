// scripts/deploy.js
const { ErrorHandler, DeploymentError } = require('./utils/errorHandler');
const hre = require("hardhat");

async function main() {
    console.log(chalk.blue("Starting deployment process..."));

    try {
        // Pre-deployment checks
        const checks = await ErrorHandler.checkPredeploymentRequirements();
        const failedChecks = checks.filter(check => !check.passed);
        
        if (failedChecks.length > 0) {
            throw new DeploymentError(
                'Pre-deployment checks failed',
                'PRE_DEPLOYMENT',
                { failedChecks }
            );
        }

        // Deploy contracts with enhanced error handling
        const contracts = {
            BlogPost: null,
            NFTAccess: null,
            Tipping: null
        };

        for (const [name, contract] of Object.entries(contracts)) {
            try {
                const Contract = await hre.ethers.getContractFactory(name);
                
                // Gas estimation
                const deploymentGas = await Contract.signer.estimateGas(
                    Contract.getDeployTransaction()
                );

                console.log(chalk.yellow(`Estimated gas for ${name}: ${deploymentGas}`));

                contracts[name] = await Contract.deploy();
                await contracts[name].deployed();

                console.log(chalk.green(`${name} deployed to: ${contracts[name].address}`));
            } catch (error) {
                if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
                    ErrorHandler.handleGasEstimationError(error, name);
                } else {
                    throw new DeploymentError(
                        `Failed to deploy ${name}`,
                        'CONTRACT_DEPLOYMENT',
                        { contractName: name, error: error.message }
                    );
                }
            }
        }

        // Save contract addresses
        try {
            const addresses = Object.entries(contracts).reduce((acc, [name, contract]) => {
                acc[name] = contract.address;
                return acc;
            }, {});

            saveContractAddresses(addresses);
        } catch (error) {
            throw new DeploymentError(
                'Failed to save contract addresses',
                'SAVE_ADDRESSES',
                { addresses }
            );
        }

        // Verify contracts
        if (process.env.ETHERSCAN_API_KEY) {
            for (const [name, contract] of Object.entries(contracts)) {
                try {
                    await hre.run("verify:verify", {
                        address: contract.address,
                        constructorArguments: [],
                    });
                    console.log(chalk.green(`${name} verified on Etherscan`));
                } catch (error) {
                    ErrorHandler.handleVerificationError(error, contract.address);
                }
            }
        }

    } catch (error) {
        if (error instanceof DeploymentError) {
            ErrorHandler.logError(error, ErrorHandler.TYPES.CONTRACT_DEPLOYMENT);
        } else {
            ErrorHandler.logError(
                new DeploymentError(
                    'Unexpected error during deployment',
                    'UNKNOWN',
                    { originalError: error.message }
                ),
                ErrorHandler.TYPES.CONTRACT_DEPLOYMENT,
                ErrorHandler.LEVELS.CRITICAL
            );
        }
        process.exit(1);
    }
}

function saveContractAddresses(addresses) {
    const fs = require("fs");
    const path = require("path");
    
    try {
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
    } catch (error) {
        throw new DeploymentError(
            'Failed to save contract addresses',
            'FILE_SYSTEM',
            { addresses }
        );
    }
}

// Add to package.json
const packageJson = {
    "dependencies": {
        "chalk": "^4.1.2"
    }
};

// Execute
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(chalk.red("Deployment failed"));
        console.error(error);
        process.exit(1);
    });
