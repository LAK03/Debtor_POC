var LoanCoins  = artifacts.require("./LoanCoins.sol");

module.exports = function(deployer) {
  deployer.deploy(LoanCoins);
};
