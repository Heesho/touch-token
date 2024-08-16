const { expect } = require("chai");
const { ethers } = require("hardhat");

let owner, user1, user2, touch0, touch1, owner0, owner1;
let touchToken, touchBadge;
let user1Nonce, user2Nonce;
let domain, types;
let value, signature, v, r, s;

describe("TouchBadge Tests", function () {
  before(async function () {
    [owner, user1, user2, touch0, touch1, owner0, owner1] =
      await ethers.getSigners();

    const touchTokenArtifact = await ethers.getContractFactory("TouchToken");
    touchToken = await touchTokenArtifact.deploy();
    await touchToken.deployed();
    console.log("TouchToken deployed to:", touchToken.address);

    const touchBadgeArtifact = await ethers.getContractFactory("TouchBadge");
    touchBadge = await touchBadgeArtifact.deploy(touchToken.address);
    await touchBadge.deployed();
    console.log("TouchBadge deployed to:", touchBadge.address);

    await touchToken.connect(owner).setMinter(touchBadge.address, true);
    console.log("TouchBadge set as minter for TouchToken");

    domain = {
      name: "TouchBadge",
      version: "1",
      chainId: await ethers.provider.getNetwork().then((n) => n.chainId),
      verifyingContract: touchBadge.address,
    };

    types = {
      Touch: [
        { name: "account", type: "address" },
        { name: "nonce", type: "uint256" },
      ],
    };
  });

  it("Should register a new TouchBadge", async function () {
    await touchBadge
      .connect(owner0)
      .register(
        owner0.address,
        touch0.address,
        "Touch0",
        "https://example.com/touch0.json"
      );

    const tokenData = await touchBadge.tokenId_TouchData(1);
    expect(tokenData.owner).to.eq(owner0.address);
    expect(tokenData.uri).to.eq("https://example.com/touch0.json");
  });

  it("Should mint a TouchBadge for user1", async function () {
    // Get the current nonce for user1
    user1Nonce = await touchBadge.account_Nonce(user1.address);

    // Define the value to be signed
    value = {
      account: user1.address,
      nonce: user1Nonce.toString(),
    };

    // Sign the structured data
    signature = await touch0._signTypedData(domain, types, value);
    ({ v, r, s } = ethers.utils.splitSignature(signature));

    // Perform the first valid touch
    await expect(touchBadge.connect(user1).touch(user1.address, { r, s, v }))
      .to.emit(touchBadge, "TouchBadge__Touched")
      .withArgs(1, user1.address);

    const balance = await touchBadge.balanceOf(user1.address, 1);
    expect(balance).to.eq(1);

    console.log(
      "User1 touch0 balance: ",
      await touchBadge.balanceOf(user1.address, 1)
    );
    console.log(
      "User2 touch0 balance: ",
      await touchBadge.balanceOf(user2.address, 1)
    );
  });

  it("Should revert with 'TouchBadge__AlreadyTouched' if the token is touched within the cooldown period", async function () {
    // Get the current nonce for user1
    user1Nonce = await touchBadge.account_Nonce(user1.address);

    // Define the value to be signed
    value = {
      account: user1.address,
      nonce: user1Nonce.toString(),
    };

    // Sign the structured data
    signature = await touch0._signTypedData(domain, types, value);
    ({ v, r, s } = ethers.utils.splitSignature(signature));

    // Attempt to touch the token again within the cooldown period
    await expect(
      touchBadge.connect(user1).touch(user1.address, { r, s, v })
    ).to.be.revertedWith("TouchBadge__AlreadyTouched");

    console.log(
      "User1 touch0 balance: ",
      await touchBadge.balanceOf(user1.address, 1)
    );
    console.log(
      "User2 touch0 balance: ",
      await touchBadge.balanceOf(user2.address, 1)
    );
  });

  it("Forward Time 1 day", async function () {
    // Forward time by 1 hour to pass the cooldown period
    await ethers.provider.send("evm_increaseTime", [24 * 3600]);
    await ethers.provider.send("evm_mine");
  });

  it("User1 mints another touch0", async function () {
    // Attempt to touch the token again within the cooldown period
    await touchBadge.connect(user1).touch(user1.address, { r, s, v });

    console.log(
      "User1 touch0 balance: ",
      await touchBadge.balanceOf(user1.address, 1)
    );
    console.log(
      "User2 touch0 balance: ",
      await touchBadge.balanceOf(user2.address, 1)
    );
  });

  it("User1 mints another touch0", async function () {
    // Attempt to touch the token again within the cooldown period
    await expect(
      touchBadge.connect(user1).touch(user1.address, { r, s, v })
    ).to.be.revertedWith("TouchBadge__Unauthorized");

    console.log(
      "User1 touch0 balance: ",
      await touchBadge.balanceOf(user1.address, 1)
    );
    console.log(
      "User2 touch0 balance: ",
      await touchBadge.balanceOf(user2.address, 1)
    );
  });

  it("Should mint a TouchBadge for user1", async function () {
    // Get the current nonce for user1
    user1Nonce = await touchBadge.account_Nonce(user1.address);

    // Define the value to be signed
    value = {
      account: user1.address,
      nonce: user1Nonce.toString(),
    };

    // Sign the structured data
    signature = await touch0._signTypedData(domain, types, value);
    ({ v, r, s } = ethers.utils.splitSignature(signature));

    // Perform the first valid touch
    await expect(
      touchBadge.connect(user2).touch(user2.address, { r, s, v })
    ).to.be.revertedWith("TouchBadge__Unauthorized");

    console.log(
      "User1 touch0 balance: ",
      await touchBadge.balanceOf(user1.address, 1)
    );
    console.log(
      "User2 touch0 balance: ",
      await touchBadge.balanceOf(user2.address, 1)
    );
  });

  it("Should mint a TouchBadge for user1", async function () {
    // Get the current nonce for user1
    user2Nonce = await touchBadge.account_Nonce(user2.address);

    // Define the value to be signed
    value = {
      account: user2.address,
      nonce: user2Nonce.toString(),
    };

    // Sign the structured data
    signature = await touch0._signTypedData(domain, types, value);
    ({ v, r, s } = ethers.utils.splitSignature(signature));

    // Perform the first valid touch
    await touchBadge.connect(user2).touch(user2.address, { r, s, v });

    console.log(
      "User1 touch0 balance: ",
      await touchBadge.balanceOf(user1.address, 1)
    );
    console.log(
      "User2 touch0 balance: ",
      await touchBadge.balanceOf(user2.address, 1)
    );
  });

  it("Should register a new TouchBadge", async function () {
    await touchBadge
      .connect(owner1)
      .register(
        owner1.address,
        touch1.address,
        "Touch1",
        "https://example.com/touch1.json"
      );

    const tokenData = await touchBadge.tokenId_TouchData(2);
    expect(tokenData.owner).to.eq(owner1.address);
    expect(tokenData.uri).to.eq("https://example.com/touch1.json");
  });

  it("Should mint a TouchBadge for user1", async function () {
    // Get the current nonce for user1
    user1Nonce = await touchBadge.account_Nonce(user1.address);

    // Define the value to be signed
    value = {
      account: user1.address,
      nonce: user1Nonce.toString(),
    };

    // Sign the structured data
    signature = await touch1._signTypedData(domain, types, value);
    ({ v, r, s } = ethers.utils.splitSignature(signature));

    // Perform the first valid touch
    await touchBadge.connect(user1).touch(user1.address, { r, s, v });

    const balance = await touchBadge.balanceOf(user1.address, 2);
    expect(balance).to.eq(1);

    console.log(
      "User1 touch0 balance: ",
      await touchBadge.balanceOf(user1.address, 1)
    );

    console.log(
      "User1 touch1 balance: ",
      await touchBadge.balanceOf(user1.address, 2)
    );
  });
});
