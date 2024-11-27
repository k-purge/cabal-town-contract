---
description: >-
  Cabal.town is a social survival game that rewards the most loyals. The app
  combines crypto, social interaction, and gamified elements to create a fun and
  rewarding experience.
icon: bullseye-arrow
---

# Get Started

### How do I start?

**You can start** by buying a token on the bonding curve to participate in the game. Upon purchasing the buy-in amount, you will be invited to join a private group.



### How does the game work?

**Before the game:** Purchase a token on the bonding curve to participate in the game.&#x20;

**Game ON:** When user the token reaches minimum entry level,  token holders will be invited to join a private group. The game consists of 10 rounds, each lasting 69 hours.



### What is the buy-in amount?

**Buy-in amount** refers to the minimum amount for you to enter the game. For games that haven't started yet, the buy-in will be 1 token. Whereas for games that have started, the buy-in will equal the least amount of tokens the in-game participants have.\


## 🌼 Install 🌼

Required:

* [Git](https://git-scm.com/downloads)
* [Node](https://nodejs.org/en/download/) (Use Version 18 LTS)
* [Yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable)

```
git clone https://github.com/k-purge/cabal-town-contract.git
cd 
yarn install
```



### 💎 Jetton Standard 💎

A token is a unit of account for some digital asset in some network.Fungible tokens are assets that are not unique and can be easily exchanged for another asset of the same type. Such tokens are made in such a way that each token is equivalent to the next token.To enable tokens to be used in other applications (from wallets to decentralized exchanges), smart contract interface standards for tokens are being introduced.The standard for a fungible token in the TON is the [Jetton](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md).Unlike ethereum, there is no single smart contract that stores token balances for network wallets. In the standard Token:

* master contract stores general information about the token
* for each owner of the token, a separate smart contract is created - a wallet contract, which allows you to transfer the token and store the balance



### 📑 Get Jetton Master Contract Data 📂

As in the NFT standard from the first quest, Jetton contracts have mandatory GET methods. For the master contract, one of those methods is `get_jetton_data()` which returns data about the Jetton, let's try:

```
yarn bolt
```

You will get something like this:

<figure><img src="../.gitbook/assets/image.png" alt=""><figcaption></figcaption></figure>

That means: `total_supply` - the total number of issues jettons `mintable` - (-1/0) - flag which indicates whether number of jettons can increase `admin_address`- address of smart-contract which control Jetton `jetton_content` - cell - data in accordance to [Token Data Standard #64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md)Well, now let's release our Jetton!\


### 🏭 ICO variation 🏭

ICO - Initial Coin Offering - issuance by a project or company of its own money - tokens (cryptocurrency) in order to attract investment. The simplest smart contract for Initial Coin Offering is a slightly modified Jetton standard master contract, which, when sending cryptocurrencies to it, gives tokens in exchange.



### 🔌 Compile🔌

As in the previous quest, in order to use a smart contract, it must be compiled into a hexBoC format. First, we will compile the master contract, and then the wallet, the wallet will be needed to deploy the master contract:

```
yarn compilemaster
yarn compilewallet
```



### 📻 Deploy 📡

Go to the deploy.ts file, in the line 62, change the const `ownerAddress` to your own, it will be stored in register c4, and only from this address it will be possible to execute commands assigned to administer the token.

<figure><img src="../.gitbook/assets/image (1).png" alt=""><figcaption></figcaption></figure>

line 63 is for token metadata, you can put some link here, as this is an example, you can just write the phrase that you want to store in the master contract instead of metadataWe launch the deployment script and scan the QR code, then you already know))

```
yarn deploy
```

Be sure to save the link below the quar code, it contains the address of the master contract of your Jetton.



### 💾 Get your Master Contract Data 💾

We go into the file and change the address at the top of the file on the line to the address of your master contract.

<figure><img src="../.gitbook/assets/image (2).png" alt=""><figcaption></figcaption></figure>

Launch!

```
yarn getjetton
```

If everything worked out, it's time to participate in ICO\


### ✍️ Unit Test 🦾

Run the unit test on smart contract to verify the FunC Jetton methods.

```
yarn test
```

If all test cases completed, will get all PASS as follows:

<figure><img src="../.gitbook/assets/Screenshot 2024-11-27 at 9.43.49 AM.png" alt=""><figcaption></figcaption></figure>



