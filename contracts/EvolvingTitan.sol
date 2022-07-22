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

    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    bytes32 public constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");

    mapping(address => bool) public claimedNFT;

    string private _tokenBaseURI;
   
    event tokenMinted(uint tokenID, address minterAddress);

    error AddressAlreadyClaimed(address _address);
    error InvalidToken();
    error TokenIDDoesNotExist(uint256 tokenId);
    error PermissionDenied(string errorMessage, address caller);

    constructor() ERC721("KOIOS Evolving Titan", "eTITAN") {  
        _setupRole(DEFAULT_ADMIN_ROLE,  _msgSender());
        _setupRole(SIGNER_ROLE,   _msgSender());
        _setupRole(TRANSFER_ROLE,  _msgSender());      
    }

    /**
    * @dev Checks if the caller has the DEFAULT_ADMIN_ROLE.
    */
    modifier callerIsAdmin() {
        if(!hasRole(DEFAULT_ADMIN_ROLE,  _msgSender())) revert PermissionDenied("Caller is not an admin",  _msgSender());
        _;
    }

    /**
    * @dev Checks if the caller has the SIGNER_ROLE.
    */
    modifier callerIsSigner() {
        if(!hasRole(SIGNER_ROLE,  _msgSender())) revert PermissionDenied("Caller is not a signer",  _msgSender());
        _;
    }

    /**
    * @dev Checks if the caller has the TRANSFER_ROLE.
    */
    modifier callerIsTransferrer() {
        if(!hasRole(TRANSFER_ROLE,  _msgSender())) revert PermissionDenied("Caller is not a transferrer",  _msgSender());
        _;
    }

    /**
     * @dev Mints a new token to the caller. Requires the caller passes a valid signature and hasn't claimed.
     * @param _salt The random generated salt for the signature.
     * @param _signature The signature signed by the signer.
     */
    function claim(string calldata _salt, bytes calldata _signature) external {
        uint256 _supply = totalSupply();
        uint256 _tokenId = _supply + 1;
        if(claimedNFT[ _msgSender()]) revert AddressAlreadyClaimed(_msgSender());
        if(!verifyTokenForAddress(_salt, _signature,  _msgSender())) revert InvalidToken();
        _safeMint( _msgSender(), _tokenId);
        claimedNFT[ _msgSender()] = true;
        emit tokenMinted(_tokenId,  _msgSender());
    }

    /**
     * @dev Sets the signer for the ECDSA signature, requires caller to have SIGNER_ROLE.
     * @param _newSigner The new signer address.
    */
    function setSigner(address _newSigner) public callerIsSigner {
        _setSigner(_newSigner);
    }

    /**
     * @dev Returns the baseURI for the contract.
     * @return _tokenBaseURI for the contract.
    */
    function _baseURI() internal view virtual override returns (string memory) {
        return _tokenBaseURI;
    }

    /**
     * @dev Sets base URI for the contract.
     * @param _newURI The new baseURI for the contract.
    */
    function setBaseURI(string calldata _newURI) external callerIsAdmin {
        _tokenBaseURI = _newURI;
    }

    /**
     * @dev Returns the tokenURI for the given tokenID.
     * @param _tokenId The tokenID to get the tokenURI for.
     * @return The tokenURI for the given tokenID.
    */
    function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
        if(!_exists(_tokenId)) revert TokenIDDoesNotExist(_tokenId);

        string memory baseURI = _baseURI();
        string memory json = ".json";

        if (bytes(baseURI).length == 0)
           return '';
        return string(abi.encodePacked(baseURI, _tokenId.toString(), json));
    }

    /**
     * @dev Overrides the _transfer function from the inherited ERC721 contract.
     * @param _from The address to transfer the token from.
     * @param _to The address to transfer the token to.
     * @param _tokenId The tokenID to transfer.
     */
    function _transfer(address _from,
        address _to,
        uint256 _tokenId) internal virtual override(ERC721) callerIsTransferrer {
            super._transfer(_from, _to, _tokenId);
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