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

contract TouchBadge is ERC1155, Ownable, EIP712 {

    bytes32 public constant TOUCH_TYPEHASH = keccak256("Touch(address account,uint256 nonce)");
    uint256 public constant DURATION = 1 days;
    uint256 public constant INITIAL_PRICE = 0.001 ether;
    uint256 public constant PRICE_CHANGE = 120;
    uint256 public constant BURN_RATE = 50;
    uint256 public constant DIVISOR = 100;

    address public touchToken;
    uint256 public touchReward = 1 ether;
    uint256 public creatorReward = 1 ether;
    uint256 public ownerReward = 1 ether;

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

    event TouchBadge__Registered(uint256 indexed tokenId, address owner, address touch);
    event TouchBadge__Touched(uint256 indexed tokenId, address account);
    event TouchBadge__Stolen(uint256 indexed tokenId, address newOwner, address prevOwner, uint256 price);
    event TouchBadge__TouchDataSet(uint256 indexed tokenId, string touchName, string touchUri);
    event TouchBadge__TouchTokenSet(address touchToken_);
    event TouchBadge__TouchRewardSet(uint256 touchReward_);
    event TouchBadge__CreatorRewardSet(uint256 creatorReward_);
    event TouchBadge__OwnerRewardSet(uint256 ownerReward_);

    error TouchBadge__InvalidId();
    error TouchBadge__Unauthorized();
    error TouchBadge__AlreadyTouched();
    error TouchBadge__AlreadyRegistered();
    error TouchBadge__InvalidNonce();

    constructor(address touchToken_) 
        ERC1155("") 
        EIP712("TouchBadge", "1") 
    {
        touchToken = touchToken_;
    }

    function register(
        address owner,
        address touch_,
        string memory touchName,
        string memory touchUri
    ) external {
        if (touch_TokenId[touch_] != 0) revert TouchBadge__AlreadyRegistered();

        currentIndex++;
        TouchData memory touchData = TouchData(touch_, owner, owner, 0, touchName, touchUri);
        tokenId_TouchData[currentIndex] = touchData;
        touch_TokenId[touch_] = currentIndex;

        emit TouchBadge__Registered(currentIndex, owner, touch_);
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

        ITouchToken(touchToken).mint(tokenId_TouchData[tokenId].creator, creatorReward);
        ITouchToken(touchToken).mint(tokenId_TouchData[tokenId].owner, ownerReward);
        ITouchToken(touchToken).mint(account, touchReward);
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
        uint256 burnAmount = surplus * BURN_RATE / DIVISOR;
        uint256 prevOwnerAmount = prevPrice + burnAmount;
        tokenId_TouchData[tokenId] = touchCache;

        emit TouchBadge__Stolen(tokenId, msg.sender, prevOwner, touchCache.price);

        ITouchToken(touchToken).burn(msg.sender, touchCache.price);
        ITouchToken(touchToken).mint(prevOwner, prevOwnerAmount);
    }

    function setTouchData(
        uint256 tokenId,
        string memory touchName,
        string memory touchUri
    ) external {
        if (msg.sender != tokenId_TouchData[tokenId].creator) revert TouchBadge__Unauthorized();
        tokenId_TouchData[tokenId].name = touchName;
        tokenId_TouchData[tokenId].uri = touchUri;

        emit TouchBadge__TouchDataSet(tokenId, touchName, touchUri);
    }

    function setTouchToken(
        address touchToken_
    ) external onlyOwner {
        touchToken = touchToken_;

        emit TouchBadge__TouchTokenSet(touchToken_);
    }

    function setTouchReward(
        uint256 touchReward_
    ) external onlyOwner {
        touchReward = touchReward_;

        emit TouchBadge__TouchRewardSet(touchReward_);
    }

    function setCreatorReward(
        uint256 creatorReward_
    ) external onlyOwner {
        creatorReward = creatorReward_;

        emit TouchBadge__CreatorRewardSet(creatorReward_);
    }

    function setOwnerReward(
        uint256 ownerReward_
    ) external onlyOwner {
        ownerReward = ownerReward_;

        emit TouchBadge__OwnerRewardSet(ownerReward_);
    }

    function uri(
        uint256 tokenId
    ) public view override returns (string memory) {
        return tokenId_TouchData[tokenId].uri;
    }

    function getPrice(
        uint256 tokenId
    ) public view returns (uint256) {
        return tokenId_TouchData[tokenId].price * PRICE_CHANGE / DIVISOR + INITIAL_PRICE;
    }
}
