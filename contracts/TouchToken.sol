// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

contract TouchToken is ERC1155, Ownable, EIP712 {

    bytes32 public constant TOUCH_TYPEHASH = keccak256("Touch(address account,uint256 nonce,string message)");

    struct ECDSASignature {
        bytes32 r;
        bytes32 s;
        uint8 v;
    }

    struct TouchData {
        address touchId;
        address owner;
        uint256 duration;
        string name;
        string uri;
    }

    uint256 public currentIndex = 0;
    mapping(uint256 => TouchData) public tokenId_TouchData;
    mapping(address => uint256) public touchId_tokenId;
    mapping(address => uint256) public account_Nonce;
    mapping(uint256 => mapping(address => uint256)) public tokenId_Account_Timestamp;

    event TouchToken__Registered(uint256 indexed tokenId, address owner, address touchId);
    event TouchToken__Touched(uint256 indexed tokenId, address account, string message);

    error TouchToken__InvalidId();
    error TouchToken__Unauthorized();
    error TouchToken__AlreadyTouched();
    error TouchToken__AlreadyRegistered();
    error TouchToken__InvalidNonce();

    constructor() 
        ERC1155("") 
        EIP712("TouchToken", "1") 
    {}

    function register(
        address owner,
        address touchId,
        string memory name,
        string memory uri,
        uint256 duration
    ) external {
        if (touchId_tokenId[touchId] != 0) revert TouchToken__AlreadyRegistered();
        currentIndex++;
        TouchData memory touchData = TouchData(touchId, owner, duration, name, uri);
        tokenId_TouchData[currentIndex] = touchData;
        touchId_tokenId[touchId] = currentIndex;
        emit TouchToken__Registered(currentIndex, owner, touchId);
    }

    function touch(
        address account, 
        string calldata message, 
        ECDSASignature calldata sig
    ) external {
        uint256 nonce = account_Nonce[account];

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(TOUCH_TYPEHASH, account, nonce, keccak256(bytes(message)))
            )
        );
        address touched = ECDSA.recover(digest, sig.v, sig.r, sig.s);
        uint256 tokenId = touchId_tokenId[touched];
        if (tokenId == 0) revert TouchToken__Unauthorized();
        if (tokenId_Account_Timestamp[tokenId][account] + tokenId_TouchData[tokenId].duration >= block.timestamp) revert TouchToken__AlreadyTouched();
        
        account_Nonce[account]++;
        tokenId_Account_Timestamp[tokenId][account] = block.timestamp;
        _mint(account, tokenId, 1, "");
        emit TouchToken__Touched(tokenId, account, message);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return tokenId_TouchData[tokenId].uri;
    }
}
