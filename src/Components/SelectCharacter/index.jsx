import React, {useEffect, useState} from 'react';
import "./SelectCharacter.css";
import LoadingIndicator from "../../Components/LoadingIndicator";
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import myGame from '../../utils/MyGame.json';

const SelectCharacter = ({ setCharacterNFT }) => {

  const [characters, setCharacters] = useState([]);
  const [gameContract, setGameContract] = useState(null);
  const [mintingCharacter, setMintingCharacter] = useState(false);

  const mintCharacterNFTAction = async (characterId) => {
    try {
      if (gameContract) {
        setMintingCharacter(true);
        console.log("Minting character in progress...");
        const mintTxn = await gameContract.mintCharacterNFT(characterId);
        await mintTxn.wait();
        console.log("mintTxn: ", mintTxn);
        setMintingCharacter(false);
      }
    } catch (error) {
      console.warn("MintCharacterAction Error: ", error);
      setMintingCharacter(false);
    }
  };

  useEffect(() => {
    const { ethereum } = window;

    if(ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myGame.abi,
        signer
      );
      // Set our game contract in state
      setGameContract(gameContract);
    } else {
      console.log("Ethereum object not found");
    }
  }, []);

  useEffect(() => {
    const getCharacters = async() => {
      try {
        console.log("Getting contract characters to mint");
        // Call contract to get all mint-able characters
        const charactersTxn = await gameContract.getAllDefaultCharacters();
        console.log("Characters txn: ", charactersTxn);

        // Go through all characters and transform the data
        const characters = charactersTxn.map((characterData) =>
          transformCharacterData(characterData)
        );
        
        // Set all mint-able characters in state
        setCharacters(characters);
      } catch (error) {
        console.error("Something went wrong fetching characters", error);
      }
    };

    // Callback method that will fire when the event is received
    const onCharacterMint = async (sender, tokenId, characterIndex) => {
      console.log(
        `CharacterNFTMinted - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}`
      );

      // Once character NFT is minted, we can fetch metadata and set it in state to mvoe onto the Arena
      if(gameContract) {
        const characterNFT = await gameContract.checkIfUserHasNFT();
        console.log("Character NFT: ", characterNFT);
        setCharacterNFT(transformCharacterData(characterNFT));
      }
    };

    // If gameContract is ready, let's get characters
    if(gameContract) {
      getCharacters();

      // Setup NFT Minted Listener
      gameContract.on("CharacterNFTMinted", onCharacterMint);
    }
    return () => {
      // When component unmounts, let's make sure to clean up the listener
      if(gameContract) {
        gameContract.off("CharacterNFTMinted", onCharacterMint);
      }
    };
  }, [gameContract]);

  const renderCharacters = () => 
    characters.map((character, index) => (
      <div className="character-item" key={character.name}>
        <div className="name-container">
          <p>{character.name}</p>
        </div>
        <img src={character.imageURI} alt={character.name}/>
        <button
          type="button"
          className="character-mint-button"
          onClick={() => mintCharacterNFTAction(index)}
          >{`Mint ${character.name}`}</button>
      </div>
    ));
  
  return (
    <div className="select-character-container">
      <h2>Mint your hero. Choose wisely.</h2>
      {/* Only show this when there are characters in state */}
      {characters.length > 0 && (
      <div className="character-grid">{renderCharacters()}</div>
      )}
      {/* ONly show our loading state if mintCharacter is true*/}
      {mintingCharacter && (
      <div className="loading">
        <div className="indicator">
          <LoadingIndicator />
          <p>Minting in process...</p>
        </div>
      </div>
      )}
    </div>
  );
};

export default SelectCharacter;