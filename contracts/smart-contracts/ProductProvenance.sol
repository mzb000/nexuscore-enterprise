// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ProductProvenance
 * @dev Immutable supply-chain verification and anti-counterfeit provenance registry for NexusCore Enterprise.
 */
contract ProductProvenance {
    address public immutable owner;

    enum ItemStatus { Manufactured, InTransit, Delivered, WarrantyRegistered }

    struct ProvenanceRecord {
        bytes32 serialHash;
        string productSku;
        address currentHolder;
        ItemStatus status;
        uint256 timestamp;
        string metadataUri;
    }

    mapping(bytes32 => ProvenanceRecord) private records;
    mapping(address => bool) public authorizedVendors;

    event ItemRegistered(bytes32 indexed serialHash, string sku, address indexed manufacturer);
    event StatusUpdated(bytes32 indexed serialHash, ItemStatus status, address indexed updatedBy);
    event WarrantyRegistered(bytes32 indexed serialHash, address indexed customer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized: Caller is not the contract owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || authorizedVendors[msg.sender], "Unauthorized: Caller not recognized vendor");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedVendors[msg.sender] = true;
    }

    function addVendor(address vendor) external onlyOwner {
        authorizedVendors[vendor] = true;
    }

    function registerItem(
        bytes32 serialHash,
        string calldata sku,
        string calldata metadataUri
    ) external onlyAuthorized {
        require(records[serialHash].timestamp == 0, "Item with this serial hash is already registered");

        records[serialHash] = ProvenanceRecord({
            serialHash: serialHash,
            productSku: sku,
            currentHolder: msg.sender,
            status: ItemStatus.Manufactured,
            timestamp: block.timestamp,
            metadataUri: metadataUri
        });

        emit ItemRegistered(serialHash, sku, msg.sender);
    }

    function updateStatus(bytes32 serialHash, ItemStatus newStatus) external onlyAuthorized {
        require(records[serialHash].timestamp != 0, "Item not found in provenance registry");
        records[serialHash].status = newStatus;
        records[serialHash].currentHolder = msg.sender;

        emit StatusUpdated(serialHash, newStatus, msg.sender);
    }

    function registerWarranty(bytes32 serialHash) external {
        require(records[serialHash].timestamp != 0, "Item not found");
        require(records[serialHash].status != ItemStatus.WarrantyRegistered, "Warranty already registered");

        records[serialHash].status = ItemStatus.WarrantyRegistered;
        records[serialHash].currentHolder = msg.sender;

        emit WarrantyRegistered(serialHash, msg.sender);
    }

    function verifyItem(bytes32 serialHash) external view returns (ProvenanceRecord memory) {
        require(records[serialHash].timestamp != 0, "Item does not exist in registry");
        return records[serialHash];
    }
}
