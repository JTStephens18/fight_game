import React, { useEffect, useState } from "react";
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformBossData } from '../../constants';
import myGame from '../../utils/MyGame.json';
import LoadingIndicator from "../../Components/LoadingIndicator";
import "./Arena.css";

// Pass in characterNFT metadata so we can show a card in our UI
const Arena = ({ characterNFT, setCharacterNFT }) => {
  // State
  const [gameContract, setGameContract] = useState(null);
  const [boss, setBoss] = useState(null);
  const [attackState, setAttackState] = useState('');
  const [showToast, setShowToast] = useState(false);

  const runAttackAction = async () => {
    try{
      if(gameContract) {
        setAttackState('attacking');
        console.log("Attacking boss... ");
        const attackTxn = await gameContract.attackBoss();
        await attackTxn.wait();
        console.log('attackTXN: ', attackTxn);
        setAttackState('hit');
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 5000)
      }
    } catch (error) {
      console.log("Error attacking boss: ", error);
      setAttackState('');
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

      setGameContract(gameContract);
    } else {
      console.log("Ethereum object not found");
    }
  }, []);

  useEffect(() => {
    // Setup async function that will get the boss from our contract and set its state
    const fetchBoss = async () => {
      const bossTxn = await gameContract.getBigBoss();
      console.log("Boss: ", bossTxn);
      setBoss(transformBossData(bossTxn));
    };

    const onAttackComplete = (from, newBossHp, newPlayerHp) => {
      const bossHp = newBossHp.toNumber();
      const playerHp = newPlayerHp.toNumber();
      const sender = from.toString();

      console.log(`AttackComplete: Boss hp: ${bossHp} Player Hp: ${playerHp}`);

      // If player is ours, update both player and boss hp
      if(currAccount === sender.toLowerCase()) {
        setBoss((prevState) => {
          return {...prevState, hp: bossHp};
        });
        setCharacterNft((prevState) => {
          return {...prevState, hp: playerHp};
        });
      }

      // If player is not ours, update boss only
      else {
        setBoss((prevState) => {
          return  {...prevState, hp: bossHp};
        });
      }
    }

    if(gameContract) {
      fetchBoss();
      gameContract.on("AttackComplete", onAttackComplete);
    }

    return () => {
      if(gameContract) {
        gameContract.off("AttackComplete", onAttackComplete);
      }
    }
  }, [gameContract]);



  return (
    <div className="arena-container">
      <div className="arena-container">
        {boss && characterNFT && (
          <div id="toast" className={showToast ? 'show' : ''}>
            <div id="desc">{`${boss.name} was hit for ${characterNFT.firstAttackDamage}`}
            </div>
          </div>
        )}
      </div>
      {boss && (
        <div className="boss-container">
          <div className={`boss-content ${attackState}`}>
            <h2>{boss.name}</h2>
            <div className="image-content">
              <img src={boss.imageURI} alt={`Boss ${boss.name}`}/>
              <div className="health-bar">
                <progress value={boss.hp} max={boss.maxHp}/>
                <p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
              </div>
            </div>
          </div>
          <div className="attack-container">
            <button className="cta-button" onClick={runAttackAction}>
              {`Attack ${boss.name}`}
            </button>
          </div>
          {attackState === 'attacking' && (
          <div className="loading-indicator">
            <LoadingIndicator />
            <p>Attacking</p>
          </div>
          )}
        </div>
      )}
      {characterNFT && (
        <div className="players-container">
          <div className="player-container">
            <h2>Your character</h2>
            <div className="player">
              <div className="image-content">
                <h2>{characterNFT.name}</h2>
                <img 
                  src={characterNFT.imageURI}
                  alt={`Character ${characterNFT.name}`}
                />
                <div className="health-bar">
                  <progres value={characterNFT.hp} max={characterNFT.maxHp}/>
                  <p>{`${characterNFT.hp} / ${characterNFT.maxHp} HP`}</p>
                </div>
              </div>
              <div className="stats">
                <h4>{`Attack Damage: ${characterNFT.firstAttackDamage}`}</h4>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Arena;