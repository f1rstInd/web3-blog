// scripts/deploy-frontend.js
const { exec } = require("child_process");
const path = require("path");

async function deployFrontend() {
  console.log("Building frontend...");
  
  // Navigate to frontend directory
  process.chdir(path.join(__dirname, "../frontend"));
  
  try {
    // Install dependencies
    await executeCommand("npm install");
    
    // Build the project
    await executeCommand("npm run build");
    
    // Deploy to hosting service (example using surge)
    if (process.env.DEPLOY_TO_SURGE) {
      await executeCommand("surge ./build web3-blog.surge.sh");
    }
    
    console.log("Frontend deployment complete!");
  } catch (error) {
    console.error("Frontend deployment failed:", error);
    process.exit(1);
  }
}

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        reject(error);
        return;
      }
      console.log(stdout);
      resolve();
    });
  });
}

deployFrontend();
