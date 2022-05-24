import { CONTRACT_ADDRESS, transformCharacterData } from './constants';
import myGame from "./utils/MyGame.json";
import React, {useEffect, useState} from 'react';
import './App.css';
import { ethers } from 'ethers';
import SelectCharacter from "./Components/SelectCharacter";
import Arena from './Components/Arena';
import LoadingIndicator from "./Components/LoadingIndicator";

const App = () => {

  /*
    State var to store user's wallet
  */
  const [currAccount, setCurrAccount] = useState(null);
  const [characterNFT, setCharacterNFT] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  //Declare method as async since it may take some time
  
  const checkIfWalletIsConnected = async () => {
    /*
      Check to see if we have access to         window.ethereum
    */
    try{
      const {ethereum} = window;
  
      if(!ethereum) {
        console.log("Try MetaMask!")
        setIsLoading(false);
        return;
      } else {
        console.log("Ethereum object detected: ", ethereum);

        // Check if we're authorized to access user's wallet
        const accounts = await ethereum.request({method: 'eth_accounts'});
        // User can have multiple authorized accounts, we grab the first one
        if(accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found authorized account: ", account);
          setCurrAccount(account);
        } else {
          console.log("No authorized account found");
        }
      }
  } catch (error) {
      console.log(error);
  }
    setIsLoading(false);
  };

  const renderContent = () => {

    if(isLoading) {
      return <LoadingIndicator />
    }
    
    // Scenario 1
    if(!currAccount) {
      return (
      <div className="connect-wallet-container">
            <button
              className="cta-button connect-wallet-button"
              onClick={connectWalletAction}>
              Connect Wallet 
            </button>
          </div>
        );
    } 
    // Scenario 2
    else if(currAccount && !characterNFT) {
      return <SelectCharacter setCharacterNFT={setCharacterNFT} />;
    } 
    // Scenario 3
    else if (currAccount && characterNFT) {
      return <Arena characterNFT={characterNFT} setCharacterNFT={setCharacterNFT}/>
    }
  };

  const connectWalletAction = async () => {
    try {
      const { ethereum } = window; 
      if(!ethereum) {
        alert("Get MetaMask");
        return;
      }

      /*
        Fancy method to request access to account
      */
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });
      console.log("Connected", accounts[0]);
      setCurrAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    checkIfWalletIsConnected();
    const checkNetwork = async () => {
	  try {
  		if(window.ethereum.networkVersion !== '4') {
  			alert("Please connect to Rinkeby!");
  		}
  	} catch (error) {
  		console.log(error);
  	}
}
  }, []);

  useEffect(() => {
    // Function to call that interacts with our smart contract
    const fetchNFTMetadata = async () => {
      console.log("Checking for character NFT on address: ", currAccount);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myGame.abi,
        signer
      );

      const txn = await gameContract.checkIfUserHasNFT();
      if(txn.name) {
        console.log("User has character NFT");
        setCharacterNFT(transformCharacterData(txn));
      } else {
        console.log("No character NFT found");
      }
      setIsLoading(false);
    };

    // Only run if we have a connected wallet
    if(currAccount) {
      console.log("CurrentAccount: ", currAccount);
      fetchNFTMetadata();
    }
  }, [currAccount]);
  
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">⚔️ Just Some Guys Fighting ⚔️</p>
          <p className="sub-text">Fight some guys!</p>
          {renderContent()}
        </div>
        <div className="footer-container">
        </div>
      </div>
    </div>
  );
};

export default App;
