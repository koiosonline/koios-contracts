// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "./SignedTokenVerifierForId.sol";

/**  
* @title ERC1155 implementation for achievements @KOIOSDAO
* @author PauwCrypto
* @dev This contract uses an implementation of the ERC1155 contract with an extension for URI Storage per token.
* The tokens are non-transferable and can only be minted with a verified signature.
*/
contract TitanAchievements is AccessControlEnumerable, ERC1155URIStorage, Ownable, SignedTokenVerifierForId {
    using Strings for uint256;

    string constant NAME = "Titan Achievements";
    string constant SYMBOL = "TA";

    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    bytes32 public constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");

    mapping(address => mapping(uint256 => bool)) public claimedNFT;
   
    event tokenMinted(uint tokenID, address minterAddress);

    error AddressAlreadyClaimed(address _address);
    error InvalidSignature();
    error TokenIDDoesNotExist(uint256 tokenId);
    error PermissionDenied(string errorMessage, address caller);

    constructor() ERC1155("") {  
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
     * @dev Mints a new token with the given ID to the caller. Requires the caller has not claimed given ID and a valid signature.
     * @param _salt The random generated salt for the signature.
     * @param _signature The signature signed by the signer.
     * @param _tokenId The ID of the token to be minted.
     */
    function claim(
        string calldata _salt, 
        bytes calldata _signature,
        uint256 _tokenId
    ) public virtual {
        if(claimedNFT[_msgSender()][_tokenId]) revert AddressAlreadyClaimed(_msgSender());
        if(!verifyTokenForAddress(_salt, _signature, _tokenId,  _msgSender())) revert InvalidSignature();
        _mint(_msgSender(), _tokenId, 1, "");
        claimedNFT[_msgSender()][_tokenId] = true;
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
     * @dev Returns the name from the contract.
     * @return NAME from the contract.
    */
    function name() public pure returns (string memory) {
        return NAME;
    }

    /**
     * @dev Returns the symbol from the contract.
     * @return SYMBOL from the contract.
    */
    function symbol() public pure returns (string memory) {
        return SYMBOL;
    } 

    /**
     * @dev Set base URI for the contract.
     * @param _newURI The new baseURI for the contract.
    */
    function setBaseURI(string calldata _newURI) external callerIsAdmin {
        _setBaseURI(_newURI);
    }

    /**
     * @dev Get base URI for the contract.
     * @param tokenId The ID for the token.
     * @param _newURI The new URI for the token.
    */
    function setTokenURI(uint256 tokenId, string calldata _newURI) external callerIsAdmin {
        _setURI(tokenId, _newURI);
    }

    /**
     * @dev Override safeTransferFrom function from the ERC-1155 standard, making transfers only available to addresses that have a TRANSFER_ROLE
     * @param _from The address to transfer from.
     * @param _to The address to transfer to.
     * @param _tokenId The ID for the token.
     * @param _data The data to transfer.
    */
    function safeTransferFrom(address _from,
        address _to,
        uint256 _tokenId, uint256 _amount, bytes memory _data) public virtual override(ERC1155) callerIsTransferrer {
            super.safeTransferFrom(_from, _to, _tokenId, _amount, _data);
    }

    /**
     * @dev Override safeBatchTransferFrom function from the ERC-1155 standard, making batch transfers only available to addresses that have a TRANSFER_ROLE
     * @param _from The address to transfer from.
     * @param _to The address to transfer to.
     * @param _ids The IDS for the tokens.
     * @param _amounts The amounts of the tokens.
     * @param _data The data to transfer.
    */
    function safeBatchTransferFrom(address _from,
        address _to,
        uint256[] memory _ids, uint256[] memory _amounts, bytes memory _data) public virtual override(ERC1155) callerIsTransferrer {
            super.safeBatchTransferFrom(_from, _to, _ids, _amounts, _data);
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