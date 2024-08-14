import { TonClient } from 'ton';
import { Address, Cell, beginCell } from 'ton-core';

// Data from mainnet
const toncenter = new TonClient({
	endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
});

// enter your Collection address
const jettonAddress = Address.parse(process.env.JETTON_ADDRESS);

// enter your Ton Wallet address
const walletAddress = Address.parse(process.env.JETTON_WALLET_ADDRESS);

async function getJettonWallet() {

	let { stack } = await toncenter.callGetMethod(
		jettonAddress, 
		"get_wallet_address",
            [
                {
                    type: "slice",
                    cell: beginCell().storeAddress(walletAddress).endCell(),
                },
            ]
	);
	const jettonWalletAddress = stack.readAddress();

	console.log('stack: ', stack)
	console.log('Your jetton wallet:')	
	console.log('Addr: ', jettonWalletAddress.toString());
            //EQCi5w5TeyM2M2vqes7kPICQGGi80XXlehTTw-FsBPfrWVjs
}

getJettonWallet();


