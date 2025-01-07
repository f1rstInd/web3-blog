// scripts/recovery.js
const { ErrorHandler } = require('./utils/errorHandler');
const fs = require('fs');
const path = require('path');

async function recoveryCheck() {
    const logDir = path.join(__dirname, '../logs');
    const logFile = path.join(logDir, 'deployment-errors.log');

    if (fs.existsSync(logFile)) {
        const logs = fs.readFileSync(logFile, 'utf8')
            .split('---\n')
            .filter(log => log.trim())
            .map(log => JSON.parse(log));

        const lastError = logs[logs.length - 1];

        console.log(chalk.yellow('\nLast Deployment Error:'));
        console.log(chalk.red(`Time: ${lastError.timestamp}`));
        console.log(chalk.red(`Type: ${lastError.type}`));
        console.log(chalk.red(`Message: ${lastError.message}`));
        
        if (lastError.context) {
            console.log(chalk.yellow('\nContext:'));
            console.log(lastError.context);
        }

        // Suggest recovery actions based on error type
        console.log(chalk.yellow('\nSuggested Recovery Actions:'));
        switch (lastError.type) {
            case ErrorHandler.TYPES.GAS:
                console.log('1. Check current network gas prices');
                console.log('2. Increase gas limit in hardhat.config.js');
                console.log('3. Try deployment during lower gas price periods');
                break;
            case ErrorHandler.TYPES.VERIFICATION:
                console.log('1. Check Etherscan API key');
                console.log('2. Ensure contract is deployed successfully');
                console.log('3. Wait a few blocks and try verification again');
                break;
            default:
                console.log('1. Check deployment configuration');
                console.log('2. Verify network connection');
                console.log('3. Review error logs for more details');
        }
    }
}

recoveryCheck()
    .then(() => process.exit(0))
    .catch(console.error);
