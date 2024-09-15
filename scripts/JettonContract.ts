import {
  Address,
  Cell,
  contractAddress,
  Contract,
  ContractProvider,
  Sender,
  beginCell,
} from "ton-core";

export default class JettonContract implements Contract {
  static createForDeploy(data: Cell, code: Cell): JettonContract {
    const workchain = 0; // deploy to workchain 0
    const address = contractAddress(workchain, { code, data });
    return new JettonContract(address, { code, data });
  }

  async sendDeploy(provider: ContractProvider, via: Sender) {
    await provider.internal(via, {
      value: "0.01", // send 0.01 TON to contract for rent
      bounce: false,
    });
  }

  async getTokenPrice(provider: ContractProvider) {
    // for (let i = 0; i < 100000; i+=1000) {
    //   if (i % 1000 !== 0) {
    //     continue;
    //   }

    //   // const { stack: get_exp } = await provider.get("get_exp", [
    //   //   {
    //   //     type: "int",
    //   //     value: BigInt(5),
    //   //   },
    //   //   {
    //   //     type: "int",
    //   //     value: BigInt(i),
    //   //   },
    //   //   {
    //   //     type: "int",
    //   //     value: BigInt(50000),
    //   //   },
    //   // ]);
    //   // // console.log("get_exp: ", get_exp);
    //   // const exp =
    //   //   Number.parseInt(get_exp.readBigNumber().toString()) / 1000000000;
    //   // console.log("k=0.00005; Quantity=" + i + " get_exp: ", exp);

    //   const { stack: priceStack } = await provider.get("get_price", [
    //     {
    //       type: "int",
    //       value: BigInt(1),
    //     },
    //     {
    //       type: "int",
    //       value: BigInt(i),
    //     },
    //     {
    //       type: "int",
    //       value: BigInt(5000),
    //     },
    //   ]);
    //   // console.log("priceStack: ", priceStack);
    //   const price =
    //     Number.parseInt(priceStack.readBigNumber().toString()) / 1000000000;
    //   console.log("k=0.0001; Mid-point=50000; Quantity=" + i + " Price: ", price);
    // }

    const amt = 3;
    const { stack } = await provider.get("get_token_price", [
      {
        type: "int",
        value: BigInt(amt),
      },
    ]);
    console.log("stack: ", stack);
    console.log("stack: ", Number.parseInt(stack.readBigNumber().toString())/1000000000/amt);

    return stack;
  }

  async sendTokenForBuy(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    amt: number
  ) {
    // const value: string = "0.001"
    // const amt: number = 3
    console.log("via: ", via);
    console.log("value: ", value);
    console.log("amt: ", amt);

    const ownerAddress = Address.parse(
      "0QAev-hNwxzNtPK8YBZNs7iWXkddHUnmaE36so_J4nmsP1kt"
    );

    const body = beginCell()
      .storeUint(31, 32) // op::buy_token
      .storeUint(31, 64) // query_id
      // .storeAddress(ownerAddress)
      .storeCoins(amt) // amt of jetton tokens to buy
      .storeRef(beginCell())
      .endCell();

    await provider.internal(via, {
      value, // send value of TON to buy jetton tokens
      bounce: false,
      body,
    });
  }

  async sendTokenForSell(
    provider: ContractProvider,
    via: Sender,
    amt: number
  ) {
    // const value: string = "0.001"
    // const amt: number = 3
    console.log("via: ", via);
    console.log("amt: ", amt);

    const body = beginCell()
      .storeUint(53, 32) // op::buy_token
      .storeUint(53, 64) // query_id
      // .storeAddress(ownerAddress)
      .storeCoins(amt) // amt of jetton tokens to buy
      .storeRef(beginCell())
      .endCell();

    await provider.internal(via, {
      value: 50000000n, // send value for gas
      bounce: false,
      body,
    });
  }

  async transferToken(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    amt: number
  ) {
    // const value: string = "0.001"
    // const amt: number = 3
    console.log("via: ", via);
    console.log("value: ", value);
    console.log("amt: ", amt);

    const body = beginCell()
      .storeUint(0xf8a7ea5, 32) // op::transfer
      .storeUint(101, 64) // query_id
      .storeCoins(amt) // amt of jetton tokens to buy
      .endCell();

    await provider.internal(via, {
      value, // send value of TON to buy jetton tokens
      bounce: false,
      body,
    });
  }

  async sendTokenDebug(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    amt: number
  ) {
    // const value: string = "0.001"
    // const amt: number = 3
    console.log("via: ", via);
    console.log("value: ", value);
    console.log("amt: ", amt);

    const body = beginCell()
      .storeUint(101, 32) // op::transfer
      .storeUint(101, 64) // query_id
      .storeCoins(amt) // amt of jetton tokens to buy
      .endCell();

    await provider.internal(via, {
      value, // send value of TON to buy jetton tokens
      bounce: false,
      body,
    });
  }

  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}
}
