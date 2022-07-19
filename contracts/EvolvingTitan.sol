// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "./SignedTokenVerifier.sol";

contract EvolvingTitan is AccessControlEnumerable, ERC721Enumerable, Ownable, SignedTokenVerifier {
    using Strings for uint256;

    // Roles for the contract
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    bytes32 public constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");

    // Defines mapping for addresses that claimed
    mapping(address => bool) public claimedNFT;
   
    // Events
    event tokenMinted(uint tokenID, address minterAddress);

    //Errors
    error AddressAlreadyClaimed();
    error InvalidToken();
    error TokenIDDoesNotExist();
    error PermissionDenied();

    constructor() ERC721("KOIOS Evolving Titan", "eTITAN") {  
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(SIGNER_ROLE,  msg.sender);
        _setupRole(TRANSFER_ROLE, msg.sender);      
    }

    function claim(string calldata _salt, bytes calldata _token) external {
        uint256 _supply = totalSupply();
        uint256 _tokenId = _supply + 1;
        if(claimedNFT[msg.sender]) revert AddressAlreadyClaimed();
        if(!verifyTokenForAddress(_salt, _token, msg.sender)) revert InvalidToken();
        _safeMint(msg.sender, _tokenId);
        claimedNFT[msg.sender] = true;
        emit tokenMinted(_tokenId, msg.sender);
    }

    // Sets the signer for the ECDSA signature
    function setSigner(address _signer) public {
        if(!hasRole(SIGNER_ROLE, _msgSender())) revert PermissionDenied();
        _setSigner(_signer);
    }

    // Metadata Section
    string private _tokenBaseURI;

    function _baseURI() internal view virtual override returns (string memory) {
        return _tokenBaseURI;
    }

    function setBaseURI(string calldata _newURI) external onlyOwner {
        _tokenBaseURI = _newURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if(!_exists(tokenId)) revert TokenIDDoesNotExist();

        string memory baseURI = _baseURI();
        string memory json = ".json";

        if (bytes(baseURI).length == 0)
           return '';
        return string(abi.encodePacked(baseURI, tokenId.toString(), json));
    }

    // Override _transfer function from the ERC-721 standard, making transfers only available to addresses that have a TRANSFER_ROLE
    function _transfer(address from,
        address to,
        uint256 tokenId) internal virtual override(ERC721){
            super._transfer(from, to, tokenId);
        if(!hasRole(TRANSFER_ROLE, _msgSender())) revert PermissionDenied();
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlEnumerable, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}