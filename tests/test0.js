const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const divDec6 = (amount, decimals = 6) => amount / 10 ** decimals;
const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { execPath } = require("process");

const AddressZero = "0x0000000000000000000000000000000000000000";
const one = convert("1", 18);
const oneHundred = convert("100", 18);

let owner, user0, user1, user2, distributor;
let touch;

describe("local: test0", function () {
  before("Initial set up", async function () {
    console.log("Begin Initialization");

    [owner, user0, user1, user2] = await ethers.getSigners();

    const touchArtifact = await ethers.getContractFactory("TouchToken");
    touch = await touchArtifact.deploy();
    console.log("- TouchToken Initialized");

    console.log("Initialization Complete");
    console.log();
  });

  it("First test", async function () {
    console.log("******************************************************");
  });
});
