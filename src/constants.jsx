const CONTRACT_ADDRESS = "0xd23e6B907a188FE05684F22cCa4E427d4Ec5099b";

const transformCharacterData = (characterData) => {
  return {
    name: characterData.name,
    imageURI: characterData.imageURI,
    hp: characterData.hp.toNumber(),
    maxHp: characterData.maxHp.toNumber(),
    firstAttackDamage: characterData.firstAttackDamage.toNumber(),
    firstAttackName: characterData.firstAttackName,
    secondAttackDamage: characterData.secondAttackDamage.toNumber(),
    secondAttackName: characterData.secondAttackName,
  };
};

const transformBossData = (bossData) => {
  return {
    name: bossData.name,
    imageURI: bossData.imageURI, 
    hp: bossData.hp.toNumber(),
    maxHp: bossData.maxHp.toNumber(),
    attackDamage: bossData.attackDamage.toNumber(),
  };
};

export { CONTRACT_ADDRESS, transformCharacterData, transformBossData };