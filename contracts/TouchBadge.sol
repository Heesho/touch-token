// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

interface ITouchToken {
    function mint(address account, uint256 amount) external;
    function burn(address account, uint256 amount) external;
}

// ToDo: 
// - Make touch pads stealable: half surplus to prev owner, other half burned
// - Can steal from anywhere

contract TouchBadge is ERC1155, Ownable, EIP712 {

    bytes32 public constant TOUCH_TYPEHASH = keccak256("Touch(address account,uint256 nonce)");
    uint256 public constant DURATION = 1 days;
    uint256 public constant INITIAL_PRICE = 0.001 ether;
    uint256 public constant PRICE_CHANGE = 120;
    uint256 public constant BURN_RATE = 50;
    uint256 public constant DIVISOR = 100;

    address public immutable touchToken;
    uint256 public rewardAmount = 1 ether;

    struct ECDSASignature {
        bytes32 r;
        bytes32 s;
        uint8 v;
    }

    struct TouchData {
        address touch;
        address creator;
        address owner;
        uint256 price;
        string name;
        string uri;
    }

    uint256 public currentIndex = 0;
    mapping(uint256 => TouchData) public tokenId_TouchData;
    mapping(address => uint256) public touch_TokenId;
    mapping(address => uint256) public account_Nonce;
    mapping(uint256 => mapping(address => uint256)) public tokenId_Account_Timestamp;

    event TouchBadge__Registered(uint256 indexed tokenId, address owner, address touchId);
    event TouchBadge__Touched(uint256 indexed tokenId, address account);
    event TouchBadge__Stolen(uint256 indexed tokenId, address newOwner, address prevOwner, uint256 price);

    error TouchBadge__InvalidId();
    error TouchBadge__Unauthorized();
    error TouchBadge__AlreadyTouched();
    error TouchBadge__AlreadyRegistered();
    error TouchBadge__InvalidNonce();

    constructor(address _touchToken) 
        ERC1155("") 
        EIP712("TouchBadge", "1") 
    {
        touchToken = _touchToken;
    }

    function register(
        address owner,
        address touchId,
        string memory touchName,
        string memory touchUri
    ) external {
        if (touch_TokenId[touchId] != 0) revert TouchBadge__AlreadyRegistered();
        currentIndex++;
        TouchData memory touchData = TouchData(touchId, owner, owner, 0, touchName, touchUri);
        tokenId_TouchData[currentIndex] = touchData;
        touch_TokenId[touchId] = currentIndex;
        emit TouchBadge__Registered(currentIndex, owner, touchId);
    }

    function touch(
        address account, 
        ECDSASignature calldata sig
    ) external {
        uint256 nonce = account_Nonce[account];

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(TOUCH_TYPEHASH, account, nonce)
            )
        );
        address touched = ECDSA.recover(digest, sig.v, sig.r, sig.s);
        uint256 tokenId = touch_TokenId[touched];
        if (tokenId == 0) revert TouchBadge__Unauthorized();
        if (tokenId_Account_Timestamp[tokenId][account] + DURATION >= block.timestamp) revert TouchBadge__AlreadyTouched();
        
        account_Nonce[account]++;
        tokenId_Account_Timestamp[tokenId][account] = block.timestamp;
        _mint(account, tokenId, 1, "");
        emit TouchBadge__Touched(tokenId, account);
        ITouchToken(touchToken).mint(tokenId_TouchData[tokenId].creator, rewardAmount);
        ITouchToken(touchToken).mint(tokenId_TouchData[tokenId].owner, rewardAmount);
        ITouchToken(touchToken).mint(account, rewardAmount);
    }

    function steal(
        uint256 tokenId
    ) external {
        TouchData memory touchCache = tokenId_TouchData[tokenId];
        if (touchCache.touch == address(0)) revert TouchBadge__InvalidId();

        address prevOwner = touchCache.owner;
        uint256 prevPrice = touchCache.price;

        touchCache.price = getPrice(tokenId);
        touchCache.owner = msg.sender;

        uint256 surplus = touchCache.price - prevPrice;
        uint256 burnAmount = surplus * 50 / 100;
        uint256 prevOwnerAmount = prevPrice + burnAmount;
        tokenId_TouchData[tokenId] = touchCache;
        emit TouchBadge__Stolen(tokenId, msg.sender, prevOwner, touchCache.price);

        ITouchToken(touchToken).burn(msg.sender, touchCache.price);
        ITouchToken(touchToken).mint(prevOwner, prevOwnerAmount);
    }

    function updateTouchData(
        uint256 tokenId,
        string memory touchName,
        string memory touchUri
    ) external {
        if (msg.sender != tokenId_TouchData[tokenId].creator) revert TouchBadge__Unauthorized();
        tokenId_TouchData[tokenId].name = touchName;
        tokenId_TouchData[tokenId].uri = touchUri;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return tokenId_TouchData[tokenId].uri;
    }

    function getPrice(uint256 tokenId) public view returns (uint256) {
        return tokenId_TouchData[tokenId].price * 120 / 100 + 0.001 ether;
    }
}
