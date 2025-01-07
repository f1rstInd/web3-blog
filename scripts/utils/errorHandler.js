// scripts/utils/errorHandler.js
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");

class DeploymentError extends Error {
    constructor(message, step, context = {}) {
        super(message);
        this.name = 'DeploymentError';
        this.step = step;
        this.context = context;
        this.timestamp = new Date().toISOString();
    }
}

const ErrorHandler = {
    // Log levels
    LEVELS: {
        INFO: 'INFO',
        WARN: 'WARN',
        ERROR: 'ERROR',
        CRITICAL: 'CRITICAL'
    },

    // Error types
    TYPES: {
        CONTRACT_DEPLOYMENT: 'CONTRACT_DEPLOYMENT',
        VERIFICATION: 'VERIFICATION',
        NETWORK: 'NETWORK',
        GAS: 'GAS',
        CONFIGURATION: 'CONFIGURATION'
    },

    logError(error, type, level = 'ERROR') {
        const errorLog = {
            timestamp: new Date().toISOString(),
            type,
            level,
            message: error.message,
            step: error.step || 'unknown',
            context: error.context || {},
            stack: error.stack
        };

        // Console output with color coding
        console.error(chalk.red('\n=== ERROR REPORT ==='));
        console.error(chalk.yellow(`Time: ${errorLog.timestamp}`));
        console.error(chalk.yellow(`Type: ${type}`));
        console.error(chalk.yellow(`Level: ${level}`));
        console.error(chalk.yellow(`Step: ${errorLog.step}`));
        console.error(chalk.red(`Message: ${error.message}`));
        
        if (Object.keys(errorLog.context).length > 0) {
            console.error(chalk.yellow('\nContext:'));
            console.error(errorLog.context);
        }

        // Write to log file
        this.writeToLog(errorLog);

        return errorLog;
    },

    writeToLog(errorLog) {
        const logDir = path.join(__dirname, '../../logs');
        const logFile = path.join(logDir, 'deployment-errors.log');

        // Create logs directory if it doesn't exist
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        // Append to log file
        fs.appendFileSync(
            logFile,
            `${JSON.stringify(errorLog, null, 2)}\n---\n`,
            'utf8'
        );
    },

    async checkPredeploymentRequirements() {
        const checks = [];

        // Check environment variables
        const requiredEnvVars = ['PRIVATE_KEY', 'ETHERSCAN_API_KEY'];
        requiredEnvVars.forEach(envVar => {
            if (!process.env[envVar]) {
                checks.push({
                    passed: false,
                    message: `Missing environment variable: ${envVar}`
                });
            }
        });

        // Check network connection
        try {
            const provider = hre.ethers.provider;
            await provider.getNetwork();
            checks.push({
                passed: true,
                message: 'Network connection successful'
            });
        } catch (error) {
            checks.push({
                passed: false,
                message: 'Failed to connect to network'
            });
        }

        return checks;
    },

    handleGasEstimationError(error, contractName) {
        const context = {
            contractName,
            gasLimit: error.gasLimit,
            gasPrice: error.gasPrice
        };

        return this.logError(
            new DeploymentError(
                `Gas estimation failed for ${contractName}`,
                'GAS_ESTIMATION',
                context
            ),
            this.TYPES.GAS,
            this.LEVELS.CRITICAL
        );
    },

    handleVerificationError(error, contractAddress) {
        const context = {
            contractAddress,
            network: hre.network.name
        };

        return this.logError(
            new DeploymentError(
                'Contract verification failed',
                'VERIFICATION',
                context
            ),
            this.TYPES.VERIFICATION,
            this.LEVELS.ERROR
        );
    }
};

module.exports = {
    ErrorHandler,
    DeploymentError
};
