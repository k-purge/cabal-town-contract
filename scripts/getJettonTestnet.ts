import { TonClient } from "ton";
import { Address, Cell } from "ton-core";

// Data from mainnet
export const toncenter = new TonClient({
  endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
});

export const jettonAddress = Address.parse('EQCD6lITaOdUkIRibdZTda4gUHi20J1Go7yGkKARA3kCUv9X');
//https://tonscan.org/jetton/EQD0vdSA_NedR9uvbgN9EikRX-suesDxGeFg69XQMavfLqIw
const OFF_CHAIN_CONTENT_PREFIX = 0x01;

export function flattenSnakeCell(cell: Cell) {
  let c: Cell | null = cell;

  let res = Buffer.alloc(0);

  while (c) {
    const cs = c.beginParse();
    if (cs.remainingBits === 0) {
      return res;
    }
    if (cs.remainingBits % 8 !== 0) {
      throw Error("Number remaining of bits is not multiply of 8");
    }

    const data = cs.loadBuffer(cs.remainingBits / 8);
    res = Buffer.concat([res, data]);
    c = c.refs && c.refs[0];
  }

  return res;
}

export function decodeOffChainContent(content: Cell) {
  const data = flattenSnakeCell(content);

  const prefix = data[0];
  if (prefix !== OFF_CHAIN_CONTENT_PREFIX) {
    throw new Error(`Unknown content prefix: ${prefix.toString(16)}`);
  }
  return data.slice(1).toString();
}

export async function getJettonData() {
  let { stack } = await toncenter.callGetMethod(
    jettonAddress,
    "get_jetton_data"
  );

  console.log("stack: ", stack);

  // (int total_supply, int mintable, slice admin_address, cell content, cell jetton_wallet_code, int circulating_supply, int midpoint_supply, int max_price, int steepness) = load_data();
  let totalSupply = stack.readBigNumber();
  let mintable = stack.readBigNumber(); // flag which indicates whether number of jettons can increase
  let adminAddress = stack.readAddress();
  let jettonContent = stack.readCell();
  let jettonWalletCode = stack.readCell();
  let circulating_supply = stack.readBigNumber();
  let midpoint_supply = stack.readBigNumber();
  let max_price = stack.readBigNumber();
  let steepness = stack.readBigNumber();

  console.log("Jetton info, from get_jetton_data() method:");
  console.log("Total Supply: ", totalSupply.toString());
  console.log("Mintable: ", mintable.toString());
  console.log("Admin adress:", adminAddress);
  console.log("jettonWalletCode:", jettonWalletCode);
  // console.log("Jetton Content Root: ", decodeOffChainContent(jettonContent));
  console.log("circulating_supply: ", circulating_supply.toString());
  console.log("midpoint_supply: ", midpoint_supply.toString());
  console.log("max_price: ", max_price.toString());
  console.log("steepness: ", steepness.toString());
  //https://ipfs.io/ipfs/bafkreiast4fqlkp4upyu2cvo7fn7aabjusx765yzvqitsr4rpwfvhjguhy
}

getJettonData();
