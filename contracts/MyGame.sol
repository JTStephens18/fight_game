// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

// NFT contract to inherit from
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// Helper functions OpenZeppelin provides
// Counters is a simple counter--useful for ID generation
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// Helper to encode in Base64
import "./libraries/Base64.sol";

import "hardhat/console.sol";

contract MyGame is ERC721 {
    struct CharacterAttributes {
        uint256 characterIndex;
        string name;
        string imageURI;
        uint256 hp;
        uint256 maxHp;
        uint256 firstAttackDamage;
        string firstAttackName;
        uint256 secondAttackDamage;
        string secondAttackName;
    }

    // tokenId is the NFTs unique identifier
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Holds the default data for our characters
    CharacterAttributes[] defaultCharacters;

    // Create a mapping from the tokenId => NFTs attribtues
    mapping(uint256 => CharacterAttributes) public nftHolderAttributes;

    /* 
        Mapping from an address => tokenId. Provides 
        an easy way to store the owner of the NFT
    */
    mapping(address => uint256) public nftHolders;

    event CharacterNFTMinted(address sender, uint256 tokenId, uint256 characterIndex);
    event AttackComplete(address sender, uint newBossHp, uint newPlayerHp);

    struct BigBoss {
        string name;
        string imageURI;
        uint256 hp;
        uint256 maxHp;
        uint256 attackDamage;
    }

    BigBoss public bigBoss;

    /* 
        Inside the constructor is data passed into the contract when it's first created 
        We will pass these values in from our .js file
    */
    constructor(
        string[] memory characterNames,
        string[] memory characterImageURIs,
        uint256[] memory characterHp,
        uint256[] memory characterFirstAttackDmg,
        string[] memory characterFirstAttackName,
        uint256[] memory characterSecondAttackDmg,
        string[] memory characterSecondAttackName,
        string memory bossName,
        string memory bossImageURI,
        uint256 bossHp,
        uint256 bossAttackDmg
    )
        // Below are the identifier symbols for our NFT
        ERC721("Just some guys", "JSG")
    {
        bigBoss = BigBoss({
            name: bossName,
            imageURI: bossImageURI,
            hp: bossHp,
            maxHp: bossHp,
            attackDamage: bossAttackDmg
        });

        console.log(
            "Done initializing boss %s with HP %s, img %s",
            bigBoss.name,
            bigBoss.hp,
            bigBoss.imageURI
        );

        // Loop through all characters and save their values so we can use them later
        for (uint256 i = 0; i < characterNames.length; i += 1) {
            defaultCharacters.push(
                CharacterAttributes({
                    characterIndex: i,
                    name: characterNames[i],
                    imageURI: characterImageURIs[i],
                    hp: characterHp[i],
                    maxHp: characterHp[i],
                    firstAttackDamage: characterFirstAttackDmg[i],
                    firstAttackName: characterFirstAttackName[i],
                    secondAttackDamage: characterSecondAttackDmg[i],
                    secondAttackName: characterSecondAttackName[i]
                })
            );
            CharacterAttributes memory c = defaultCharacters[i];

            // Hardhat's use of console.log() allows up to 4 parameters of type: uint, string, bool, address
            console.log(
                "Done initializing %s w/ HP %s, img %s",
                c.name,
                c.hp,
                c.imageURI
            );
        }

        // Increment _tokenIds so that the first NFT has an ID of 1
        _tokenIds.increment();
    }

    // NFT is minted based on which of the characterId is passed
    function mintCharacterNFT(uint256 _characterIndex) external {
        // Get current tokenId
        uint256 newItemId = _tokenIds.current();

        // Assigns the tokenId to the caller's wallet address
        _safeMint(msg.sender, newItemId);

        // Map the tokenId => their character attributes
        nftHolderAttributes[newItemId] = CharacterAttributes({
            characterIndex: _characterIndex,
            name: defaultCharacters[_characterIndex].name,
            imageURI: defaultCharacters[_characterIndex].imageURI,
            hp: defaultCharacters[_characterIndex].hp,
            maxHp: defaultCharacters[_characterIndex].maxHp,
            firstAttackDamage: defaultCharacters[_characterIndex]
                .firstAttackDamage,
            firstAttackName: defaultCharacters[_characterIndex].firstAttackName,
            secondAttackDamage: defaultCharacters[_characterIndex]
                .secondAttackDamage,
            secondAttackName: defaultCharacters[_characterIndex]
                .secondAttackName
        });
        console.log(
            "Minted NFT w/ tokenId %s and characterIndex %s",
            newItemId,
            _characterIndex
        );

        // Easy way to see who owns what NFT
        nftHolders[msg.sender] = newItemId;

        // Increment the tokenId for the next person
        _tokenIds.increment();

        emit CharacterNFTMinted(msg.sender, newItemId, _characterIndex);
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
        CharacterAttributes memory charAttributes = nftHolderAttributes[
            _tokenId
        ];

        string memory strHp = Strings.toString(charAttributes.hp);
        string memory strMaxHp = Strings.toString(charAttributes.maxHp);
        string memory strFirstAttackDamage = Strings.toString(
            charAttributes.firstAttackDamage
        );
        string memory strSecondAttackDamage = Strings.toString(
            charAttributes.secondAttackDamage
        );

        string memory json = Base64.encode(
            abi.encodePacked(
                '{"name": "',
                charAttributes.name,
                " -- NFT #: ",
                Strings.toString(_tokenId),
                '", "description": "This is an NFT that lets people play in the game Just some guys", "image": "',
                charAttributes.imageURI,
                '", "attributes": [ {"trait_type": "Health Points", "value": ',
                strHp,
                ', "max_value": ',
                strMaxHp,
                '}, {"trait_type": "First Attack Damage", "value": ',
                strFirstAttackDamage,
                '}, {"trait_type": "First Attack", "value": "',
                charAttributes.firstAttackName,
                '"}, {"trait_type": "Second Attack Damage", "value": ',
                strSecondAttackDamage,
                '}, {"trait_type": "Second Attack", "value": "',
                charAttributes.secondAttackName,
                '"} ]}'
            )
        );

        string memory output = string(
            abi.encodePacked("data:application/json;base64,", json)
        );
        return output;
    }

    function attackBoss() public {
        uint256 nftTokenIdOfPlayer = nftHolders[msg.sender];
        CharacterAttributes storage player = nftHolderAttributes[
            nftTokenIdOfPlayer
        ];
        console.log(
            "\nPlayer with character %s about to attack. Has %s HP and %s AD",
            player.name,
            player.hp,
            player.firstAttackDamage
        );
        console.log(
            "Boss %s has %s HP and %s AD",
            bigBoss.name,
            bigBoss.hp,
            bigBoss.attackDamage
        );

        // Ensure the characters have HP
        require(player.hp > 0, "Error: Character is dead");
        require(bigBoss.hp > 0, "Error: Boss is dead");

        // Allow player to attack the boss
        if (bigBoss.hp < player.firstAttackDamage) {
            bigBoss.hp = 0;
        } else {
            bigBoss.hp = bigBoss.hp - player.firstAttackDamage;
        }

        // Allow boss to attack player
        if (player.hp < bigBoss.attackDamage) {
            player.hp = 0;
        } else {
            player.hp = player.hp - bigBoss.attackDamage;
        }

        console.log("Player attack boss. New boss hp: %s", bigBoss.hp);
        console.log("Boss attacked player. New player hp: %s\n", player.hp);

        emit AttackComplete(msg.sender, bigBoss.hp, player.hp);
    }

    function checkIfUserHasNFT() public view returns (CharacterAttributes memory) {
        uint256 userNftTokenId = nftHolders[msg.sender];

        if(userNftTokenId > 0) {
            return nftHolderAttributes[userNftTokenId];
        }
         else {
             CharacterAttributes memory emptyStruct;
             return emptyStruct;
         }
    }

    function getAllDefaultCharacters() public view returns (CharacterAttributes[] memory) {
        return defaultCharacters;
    }

    function getBigBoss() public view returns (BigBoss memory) {
        return bigBoss;
    }
}
