// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "./SignedTokenVerifierForId.sol";

contract TitanAchievements is AccessControlEnumerable, ERC1155URIStorage, Ownable, SignedTokenVerifierForId {
    using Strings for uint256;

    // Roles for the contract
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    bytes32 public constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");

    // Defines mapping for addresses that claimed
    mapping(address => mapping(uint256 => bool)) public claimedNFT;
   
    // Events
    event tokenMinted(uint tokenID, address minterAddress);

    // Errors
    error AddressAlreadyClaimed(address _address);
    error InvalidToken();
    error TokenIDDoesNotExist(uint256 tokenId);
    error PermissionDenied(string errorMessage, address caller);

    // Function modifiers
    modifier callerIsAdmin() {
        if(!hasRole(DEFAULT_ADMIN_ROLE,  _msgSender())) revert PermissionDenied("Caller is not an admin",  _msgSender());
        _;
    }

    modifier callerIsSigner() {
        if(!hasRole(SIGNER_ROLE,  _msgSender())) revert PermissionDenied("Caller is not a signer",  _msgSender());
        _;
    }

    modifier callerIsTransferrer() {
        if(!hasRole(TRANSFER_ROLE,  _msgSender())) revert PermissionDenied("Caller is not a transferrer",  _msgSender());
        _;
    }

    constructor() ERC1155("") {  
        _setupRole(DEFAULT_ADMIN_ROLE,  _msgSender());
        _setupRole(SIGNER_ROLE,   _msgSender());
        _setupRole(TRANSFER_ROLE,  _msgSender());      
    }

    function claim(
        string calldata _salt, 
        bytes calldata _token,
        uint256 _tokenId
    ) public virtual {
        if(claimedNFT[_msgSender()][_tokenId]) revert AddressAlreadyClaimed(_msgSender());
        if(!verifyTokenForAddress(_salt, _token, _tokenId,  _msgSender())) revert InvalidToken();
        _mint(_msgSender(), _tokenId, 1, "");
        claimedNFT[_msgSender()][_tokenId] = true;
        emit tokenMinted(_tokenId,  _msgSender());
    }

    // function claim(string calldata _salt, bytes calldata _token, uint256 _tokenId) external {
    //     if(claimedNFT[_tokenId][_msg.Sender()]) revert AddressAlreadyClaimed(_msgSender());
    //     if(!verifyTokenForAddress(_salt, _token, _tokenId  _msgSender())) revert InvalidToken();
    //     _mint( _msgSender(), _tokenId);
    //     claimedNFT[ _msgSender()] = true;
    //     emit tokenMinted(_tokenId,  _msgSender());
    // }

    // Sets the signer for the ECDSA signature
    function setSigner(address _signer) public callerIsSigner {
        _setSigner(_signer);
    }

    // // Metadata Section
    // string private _tokenBaseURI;

    // function _baseURI() internal view virtual override returns (string memory) {
    //     return _tokenBaseURI;
    // }

    function setBaseURI(string calldata _newURI) external callerIsAdmin {
        _setBaseURI(_newURI);
    }

    // function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    //     if(!_exists(tokenId)) revert TokenIDDoesNotExist(tokenId);

    //     string memory baseURI = _baseURI();
    //     string memory json = ".json";

    //     if (bytes(baseURI).length == 0)
    //        return '';
    //     return string(abi.encodePacked(baseURI, tokenId.toString(), json));
    // }

    // Override _safeTransferFrom function from the ERC-721 standard, making transfers only available to addresses that have a TRANSFER_ROLE
    function _safeTransferFrom(address from,
        address to,
        uint256 id, uint256 amount, bytes memory data) internal virtual override(ERC1155) callerIsTransferrer {
            super.safeTransferFrom(from, to, id, amount, data);
    }

    // Override _safebatchTransferFrom function from the ERC-721 standard, making transfers only available to addresses that have a TRANSFER_ROLE
    function _safeBatchTransferFrom(address from,
        address to,
        uint256[] memory ids, uint256[] memory amounts, bytes memory data) internal virtual override(ERC1155) callerIsTransferrer {
            super.safeBatchTransferFrom(from, to, ids, amounts, data);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlEnumerable, ERC1155)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}