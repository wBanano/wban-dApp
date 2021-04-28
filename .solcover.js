const shell = require('shelljs'); // This is a dep at solidity-coverage, no need to install separately

module.exports = {
	skipFiles: ["./test", "./deployment"],
	onCompileComplete: async function(config){
		shell.exec("typechain --target ethers-v5 './contracts/**/!(*.dbg).json'");
	}
};
