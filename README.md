# Cabal.town - Contract

Cabal Town is the social monetization layer of on-chain markets, offering a novel approach to community interaction in crypto trading and token discovery. It enables influencers to monetize their influence and unique insights while fostering deeper engagement within their communities.

* Early token discovery has been a challenge with the lack of capability to measure the quality of the alpha. The paid marketing models embedded in discovery platform like dexscreener/dextool also creates more noise than true signal.

* Crypto influencers currently monetize via promoting tokens to community after their entry, with late joiners usually suffer from financial loss because of late entry or ‘getting dumped on’. Friend.tech was an attempt to align incentives between attention and group entity but it failed to achieve retention due to poor product experience and tokenomics design.

* Cabal Town v1 starts with a ‘cabal’ experience for crypto influencers and alpha seekers, with tokenized group chat using cabal tokens , with social trading enabled to drive engagement and demand on the cabal tokens, and performance-driven reputation as “signal” of quality of membership.

## 🌼 Install 🌼

Required: 
* [Git](https://git-scm.com/downloads)
* [Node](https://nodejs.org/en/download/) (Use Version 18 LTS)
* [Yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable)

(⚠️ Don't install the linux package `yarn` make sure you install yarn with `npm i -g yarn` or even `sudo npm i -g yarn`!)

```sh
git clone https://github.com/
```
```sh
cd 
yarn install
```
---

## 💎 Jetton Standard 💎

A token is a unit of account for some digital asset in some network.

Fungible tokens are assets that are not unique and can be easily exchanged for another asset of the same type. Such tokens are made in such a way that each token is equivalent to the next token.

To enable tokens to be used in other applications (from wallets to decentralized exchanges), smart contract interface standards for tokens are being introduced.

The standard for a fungible token in the TON is the [Jetton](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md).

Unlike ethereum, there is no single smart contract that stores token balances for network wallets. In the standard Token:
- master contract stores general information about the token
- for each owner of the token, a separate smart contract is created - a wallet contract, which allows you to transfer the token and store the balance

---
 
## 📑 Get Jetton Master Contract Data 📂 

As in the NFT standard from the first quest, Jetton contracts have mandatory GET methods. For the master contract, one of those methods is `get_jetton_data()` which returns data about the Jetton, let's try:

```sh
yarn bolt
```

You will get something like this:
![image](https://user-images.githubusercontent.com/18370291/254961827-c907b673-7331-4946-b931-78f220fee498.png)

That means:
`total_supply` - the total number of issues jettons
`mintable` - (-1/0) - flag which indicates whether number of jettons can increase 
`admin_address`- address of smart-contract which control Jetton 
`jetton_content` - cell - data in accordance to [Token Data Standard #64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md)

Well, now let's release our Jetton!

---

## 🔌 Compile🔌  

As in the previous quest, in order to use a smart contract, it must be compiled into a hexBoC format. First, we will compile the master contract, and then the wallet, the wallet will be needed to deploy the master contract:

```sh
yarn compilemaster
```

```sh
yarn compilewallet
```
---

##  📻 Deploy 📡

Go to the deploy.ts file, in the line 62, change the const `ownerAddress` to your own, it will be stored in register c4, and only from this address it will be possible to execute commands assigned to administer the token.

![image](https://user-images.githubusercontent.com/18370291/254968050-0130250e-5bda-4e20-9643-0fc9b39f9223.png)

line 63 is for token metadata, you can put some link here, as this is an example, you can just write the phrase that you want to store in the master contract instead of metadata

We launch the deployment script and scan the QR code, then you already know))

```sh
yarn deploy
```

Be sure to save the link below the quar code, it contains the address of the master contract of your Jetton.

---


✍️ Unit Test 🦾
Run the unit test on smart contract to verify the FunC Jetton methods.
```sh
yarn test
```
If all test cases completed, will get all PASS as follows:

![image](https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fckkz3bwFBuF75OzHb6dV%2Fuploads%2FUknYsKGieiREgDgR23nf%2FScreenshot%202024-11-27%20at%209.43.49%E2%80%AFAM.png?alt=media&token=9579d3b2-e149-4b73-831b-f53b1ef7f4bb)
