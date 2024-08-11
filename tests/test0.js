const { expect } = require("chai");
const { ethers } = require("hardhat");

let owner, user0, user1, user2, touch0, owner0;
let touch;

describe("TouchToken Tests", function () {
  before(async function () {
    [owner, user0, user1, user2, touch0, owner0] = await ethers.getSigners();

    const touchArtifact = await ethers.getContractFactory("TouchToken");
    touch = await touchArtifact.deploy();
    await touch.deployed();
  });

  it("Should register a new TouchToken", async function () {
    await touch
      .connect(owner0)
      .register(
        owner0.address,
        touch0.address,
        "Touch0",
        "https://example.com/touch0.json",
        3600
      );

    const tokenData = await touch.tokenId_TouchData(1);
    expect(tokenData.owner).to.eq(owner0.address);
    expect(tokenData.uri).to.eq("https://example.com/touch0.json");
    expect(tokenData.duration).to.eq(3600);
  });

  it("Should allow a user to touch a token with a valid signature", async function () {
    const message = "Touching the token";

    // Define the EIP-712 domain
    const domain = {
      name: "TouchToken",
      version: "1",
      chainId: await ethers.provider.getNetwork().then((n) => n.chainId),
      verifyingContract: touch.address,
    };

    // Define the types
    const types = {
      Touch: [
        { name: "account", type: "address" },
        { name: "message", type: "string" },
      ],
    };

    // Define the value to be signed
    const value = {
      account: user1.address,
      message: message,
    };

    // Sign the structured data
    const signature = await touch0._signTypedData(domain, types, value);
    const { v, r, s } = ethers.utils.splitSignature(signature);

    // Attempt to touch the token with the valid signature
    await expect(
      touch.connect(user1).touch(user1.address, message, { r, s, v })
    )
      .to.emit(touch, "TouchToken__Touched")
      .withArgs(1, user1.address);

    const balance = await touch.balanceOf(user1.address, 1);
    expect(balance).to.eq(1);
  });
});
