const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");
const AddressZero = "0x0000000000000000000000000000000000000000";

// Constants
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const PAYMENT_AMOUNT = convert("1", 18);

// Contract Variables
let touchToken, touchBadge;

/*===================================================================*/
/*===========================  CONTRACT DATA  =======================*/

async function getContracts() {
  console.log("Retrieving Contracts");
  touchToken = await ethers.getContractAt(
    "contracts/TouchToken.sol:TouchToken",
    "0xb3aB3C4494a7c3194D5C3F2E8A6766e0FA31BB40"
  );
  touchBadge = await ethers.getContractAt(
    "contracts/TouchBadge.sol:TouchBadge",
    "0x1C3DFeA9D752EBb68555B926546Ae8E349Ec9226"
  );
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
  touchToken = await touchContract.deployed();
  await sleep(5000);
  console.log("TouchToken Deployed at:", touch.address);
}

async function deployTouchBadge() {
  console.log("Starting TouchBadge Deployment");
  const touchBadgeArtifact = await ethers.getContractFactory("TouchBadge");
  const touchBadgeContract = await touchBadgeArtifact.deploy(touch.address, {
    gasPrice: ethers.gasPrice,
  });
  touchBadge = await touchBadgeContract.deployed();
  await sleep(5000);
  console.log("TouchBadge Deployed at:", touchBadge.address);
}

async function verifyTouchToken() {
  console.log("Starting TouchToken Verification");
  await hre.run("verify:verify", {
    address: touchToken.address,
    contract: "contracts/TouchToken.sol:TouchToken",
    constructorArguments: [],
  });
  console.log("TouchToken Verified");
}

async function verifyTouchBadge() {
  console.log("Starting TouchBadge Verification");
  await hre.run("verify:verify", {
    address: touchBadge.address,
    contract: "contracts/TouchBadge.sol:TouchBadge",
    constructorArguments: [touchToken.address],
  });
  console.log("TouchBadge Verified");
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
  // await deployTouchBadge();

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 2. Verify System
  //===================================================================

  // console.log("Starting System Verificatrion Deployment");
  // await verifyTouchToken();
  // await verifyTouchBadge();

  //===================================================================
  // 4. Transactions
  //===================================================================

  console.log("Starting Transactions");

  // await touchToken.setMinter(touchBadge.address, true);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
