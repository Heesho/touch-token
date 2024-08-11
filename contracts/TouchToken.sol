// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

contract TouchToken is ERC1155, Ownable, EIP712 {

    bytes32 public constant TOUCH_TYPEHASH = keccak256("Touch(uint256 tokenId, address account, uint256 nonce, string message)");

    struct TouchData {
        address owner;
        address minter;
        string name;
        string uri;
        uint256 duration;
    }

    uint256 public currentIndex = 0;
    mapping(uint256 => TouchData) public tokenId_TouchData;
    mapping(address => uint256) public minter_Nonce;
    mapping(uint256 => mapping(address => uint256)) public tokenId_Account_Timestamp;

    // Events for logging important actions
    event TouchToken__Created(uint256 indexed tokenId, address owner, address minter);
    event TouchToken__Touched(uint256 indexed tokenId, address account);

    // Custom errors
    error TouchToken__InvalidId();
    error TouchToken__Unauthorized();
    error TouchToken__AlreadyTouched();
    error TouchToken__InvalidNonce();

    constructor(string memory name, string memory version) ERC1155("") EIP712(name, version) {}

    function create(
        address owner,
        address minter,
        string memory name,
        string memory uri,
        uint256 duration
    ) external onlyOwner {
        currentIndex++;
        TouchData memory touchData = TouchData(owner, minter, name, uri, duration);
        tokenId_TouchData[currentIndex] = touchData;
        emit TouchToken__Created(currentIndex, owner, minter);
    } 

    function touch(
        uint256 tokenId, 
        address account, 
        bytes memory data, 
        string calldata message, 
        bytes memory signature
    ) external {
        if (tokenId == 0 || tokenId > currentIndex) revert TouchToken__InvalidId();
        if (tokenId_Account_Timestamp[tokenId][account] + tokenId_TouchData[tokenId].duration >= block.timestamp) revert TouchToken__AlreadyTouched();

        // Get the current nonce for the minter
        uint256 currentNonce = minter_Nonce[tokenId_TouchData[tokenId].minter];

        // Create the hash of the data for signature verification
        bytes32 digest = _hashTypedDataV4(keccak256(
            abi.encode(
                TOUCH_TYPEHASH,
                tokenId,
                account,
                currentNonce,
                keccak256(bytes(message))
            )
        ));

        // Recover the signer from the signature
        address signer = ECDSA.recover(digest, signature);
        if (signer != tokenId_TouchData[tokenId].minter) revert TouchToken__Unauthorized();

        // Increment the nonce for the minter to prevent replay attacks
        minter_Nonce[tokenId_TouchData[tokenId].minter]++;

        // Update the last touched timestamp and mint the token
        tokenId_Account_Timestamp[tokenId][account] = block.timestamp;
        _mint(account, tokenId, 1, data);
        emit TouchToken__Touched(tokenId, account);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return tokenId_TouchData[tokenId].uri;
    }
}
