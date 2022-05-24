const main = async () => {
    const gameContractFactory = await hre.ethers.getContractFactory("MyGame");
    const gameContract = await gameContractFactory.deploy(
        ["Leafy Larry", "Watery Wally", "Fiery Fred"],
        ["https://i.imgur.com/XxheWh7.png",
         "https://i.imgur.com/sdOQsv2.png", 
         "https://i.imgur.com/s6WKSuT.png"],
        [100,200,300], // HP values
        [100, 50, 25], // First attack damage 
        ["Grassy Glide", "Bubble Beam", "Searing Shot"], // Attack 1 name
        [150, 100, 50], // Second attack damage
        ["Angry Apple", "Splish Splash", "Fusion Flare"], // Attack 2 name
        "Greg", // Boss name
        "https://i.imgur.com/2DOIoKv.png", // Boss image
        200, // Boss hp
        20 // Boss attack damage
    );
    await gameContract.deployed();
    console.log("Contract deployed to:", gameContract.address);

    let txn;

    // Mint an NFT w/ character at index 2
    txn = await gameContract.mintCharacterNFT(0);
    await txn.wait();
    console.log("Minted NFT #1")

    // Get value of the NFT's URI
    let returnedTokenUri = await gameContract.tokenURI(1);
    // console.log("Token URI:", returnedTokenUri);

    txn = await gameContract.attackBoss();
    await txn.wait();

    // txn = await gameContract.mintCharacterNFT(1);
    // await txn.wait();
    // console.log("Minted NFT #2");

    // txn = await gameContract.mintCharacterNFT(2);
    // await txn.wait();
    // console.log("Minted NFT #3");

    // txn = await gameContract.mintCharacterNFT(1);
    // await txn.wait();
    // console.log("Minted NFT #4");

    console.log("Done deploying and minting!");
};

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

runMain();