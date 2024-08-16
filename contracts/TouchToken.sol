// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TouchToken is ERC20, Ownable {

    mapping(address => bool) public minters;

    error Units__NotAuthorized();

    event TouchToken__MinterSet(address indexed minter, bool flag);
    event TouchToken__Minted(address indexed minter, address indexed account, uint256 amount);
    event TouchToken__Burned(address indexed minter, address indexed account, uint256 amount);

    modifier onlyMinter() {
        if (!minters[msg.sender]) revert Units__NotAuthorized();
        _;
    }

    constructor() ERC20("TouchToken", "TOUCH") {}

    function mint(address account, uint256 amount) external onlyMinter {
        _mint(account, amount);
        emit TouchToken__Minted(msg.sender, account, amount);
    }

    function burn(address account, uint256 amount) external onlyMinter {
        _burn(account, amount);
        emit TouchToken__Burned(msg.sender, account, amount);
    }

    function setMinter(address minter, bool flag) external onlyOwner {
        minters[minter] = flag;
        emit TouchToken__MinterSet(minter, flag);
    }
}