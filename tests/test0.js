const { expect } = require("chai");
const { ethers } = require("hardhat");

let owner, user0, user1, user2, touch0, owner0;
let touch;
let user0Nonce, user1Nonce, user2Nonce;
let domain, types;
let value, signature, v, r, s;

describe("TouchToken Tests", function () {
  before(async function () {
    [owner, user0, user1, user2, touch0, owner0] = await ethers.getSigners();

    const touchArtifact = await ethers.getContractFactory("TouchToken");
    touch = await touchArtifact.deploy();
    await touch.deployed();

    domain = {
      name: "TouchToken",
      version: "1",
      chainId: await ethers.provider.getNetwork().then((n) => n.chainId),
      verifyingContract: touch.address,
    };

    types = {
      Touch: [
        { name: "account", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "message", type: "string" },
      ],
    };
  });

  it("Should register a new TouchToken", async function () {
    await touch.connect(owner0).register(
      owner0.address,
      touch0.address,
      "Touch0",
      "https://example.com/touch0.json",
      3600 // 1-hour duration
    );

    const tokenData = await touch.tokenId_TouchData(1);
    expect(tokenData.owner).to.eq(owner0.address);
    expect(tokenData.uri).to.eq("https://example.com/touch0.json");
    expect(tokenData.duration).to.eq(3600);
  });

  it("Should mint a TouchToken for user1", async function () {
    const message = "Touching the token";

    // Get the current nonce for user1
    user1Nonce = await touch.account_Nonce(user1.address);

    // Define the value to be signed
    value = {
      account: user1.address,
      nonce: user1Nonce.toString(),
      message: message,
    };

    // Sign the structured data
    signature = await touch0._signTypedData(domain, types, value);
    ({ v, r, s } = ethers.utils.splitSignature(signature));

    // Perform the first valid touch
    await expect(
      touch.connect(user1).touch(user1.address, message, { r, s, v })
    )
      .to.emit(touch, "TouchToken__Touched")
      .withArgs(1, user1.address, message);

    const balance = await touch.balanceOf(user1.address, 1);
    expect(balance).to.eq(1);

    console.log(
      "User1 touch0 balance: ",
      await touch.balanceOf(user1.address, 1)
    );
    console.log(
      "User2 touch0 balance: ",
      await touch.balanceOf(user2.address, 1)
    );
  });

  it("Should revert with 'TouchToken__AlreadyTouched' if the token is touched within the cooldown period", async function () {
    const message = "Touching the token";

    // Get the current nonce for user1
    user1Nonce = await touch.account_Nonce(user1.address);

    // Define the value to be signed
    value = {
      account: user1.address,
      nonce: user1Nonce.toString(),
      message: message,
    };

    // Sign the structured data
    signature = await touch0._signTypedData(domain, types, value);
    ({ v, r, s } = ethers.utils.splitSignature(signature));

    // Attempt to touch the token again within the cooldown period
    await expect(
      touch.connect(user1).touch(user1.address, message, { r, s, v })
    ).to.be.revertedWith("TouchToken__AlreadyTouched");

    console.log(
      "User1 touch0 balance: ",
      await touch.balanceOf(user1.address, 1)
    );
    console.log(
      "User2 touch0 balance: ",
      await touch.balanceOf(user2.address, 1)
    );
  });

  it("Forward Time 1 hour", async function () {
    // Forward time by 1 hour to pass the cooldown period
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine");
  });

  it("User1 mints another touch0", async function () {
    const message = "Touching the token";

    // Attempt to touch the token again within the cooldown period
    await touch.connect(user1).touch(user1.address, message, { r, s, v });

    console.log(
      "User1 touch0 balance: ",
      await touch.balanceOf(user1.address, 1)
    );
    console.log(
      "User2 touch0 balance: ",
      await touch.balanceOf(user2.address, 1)
    );
  });

  it("User1 mints another touch0", async function () {
    const message = "Touching the token";

    // Attempt to touch the token again within the cooldown period
    await expect(
      touch.connect(user1).touch(user1.address, message, { r, s, v })
    ).to.be.revertedWith("TouchToken__Unauthorized");

    console.log(
      "User1 touch0 balance: ",
      await touch.balanceOf(user1.address, 1)
    );
    console.log(
      "User2 touch0 balance: ",
      await touch.balanceOf(user2.address, 1)
    );
  });
});
