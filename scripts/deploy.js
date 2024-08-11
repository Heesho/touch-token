const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");
const AddressZero = "0x0000000000000000000000000000000000000000";

// Constants
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const PAYMENT_AMOUNT = convert("1", 18);

// Contract Variables
let touch;

/*===================================================================*/
/*===========================  CONTRACT DATA  =======================*/

async function getContracts() {
  console.log("Retrieving Contracts");
  // touch = await ethers.getContractAt(
  //   "contracts/TouchToken.sol:TouchToken",
  //   ""
  // );
  console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

async function deployTouchToken() {
  console.log("Starting TouchToken Deployment");
  const touchArtifact = await ethers.getContractFactory("TouchToken");
  const touchContract = await touchArtifact.deploy({
    gasPrice: ethers.gasPrice,
  });
  touch = await surferContract.deployed();
  await sleep(5000);
  console.log("TouchToken Deployed at:", touch.address);
}

async function verifyTouchToken() {
  console.log("Starting TouchToken Verification");
  await hre.run("verify:verify", {
    address: touch.address,
    contract: "contracts/TouchToken.sol:TouchToken",
    constructorArguments: [],
  });
  console.log("TouchToken Verified");
}

async function main() {
  const [wallet] = await ethers.getSigners();
  console.log("Using wallet: ", wallet.address);

  await getContracts();

  //===================================================================
  // 1. Deploy System
  //===================================================================

  // console.log("Starting System Deployment");
  // await deployTouchToken();

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 2. Verify System
  //===================================================================

  // console.log("Starting System Verificatrion Deployment");
  // await verifyTouchToken();

  //===================================================================
  // 4. Transactions
  //===================================================================

  console.log("Starting Transactions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
