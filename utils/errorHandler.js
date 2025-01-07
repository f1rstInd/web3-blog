// utils/errorHandler.js
const chalk = require('chalk');

class DeploymentError extends Error {
    constructor(message, step, contractName, error) {
        super(message);
        this.name = 'DeploymentError';
        this.step = step;
        this.contractName = contractName;
        this.originalError = error;
        this.timestamp = new Date().toISOString();
    }
}

const ErrorHandler = {
    logError: (error, context = {}) => {
        console.error(chalk.red('\n=== ERROR REPORT ==='));
        console.error(chalk.yellow('Timestamp:'), new Date().toISOString());
        console.error(chalk.yellow('Error Type:'), error.name);
        console.error(chalk.yellow('Message:'), error.message);
        
        if (error instanceof DeploymentError) {
            console.error(chalk.yellow('Deployment Step:'), error.step);
            console.error(chalk.yellow('Contract:'), error.contractName);
            console.error(chalk.yellow('Original Error:'), error.originalError);
        }

        if (context.network) {
            console.error(chalk.yellow('Network:'), context.network);
        }
        
        console.error(chalk.red('=== END ERROR REPORT ===\n'));

        // Log to file
        const fs = require('fs');
        const logEntry = {
            timestamp: new Date().toISOString(),
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
                ...context
            }
        };

        fs.appendFileSync(
            'deployment-errors.log',
            JSON.stringify(logEntry) + '\n'
        );
    },

    async handleContractError(promise, contractName, step) {
        try {
            return await promise;
        } catch (error) {
            throw new DeploymentError(
                `Failed to ${step} ${contractName}`,
                step,
                contractName,
                error
            );
        }
    }
};

module.exports = { ErrorHandler, DeploymentError };
