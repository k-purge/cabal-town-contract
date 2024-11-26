import { stackSlice } from "ton-contract-executor";
import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
  SendMode,
} from "ton-core";
// import { Cell as TonCell  } from '@ton/core';

export class MainContract implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromConfig(code: Cell, data: Cell, workchain = 0) {
    const init = { code, data };
    const address = contractAddress(workchain, init);

    return new MainContract(address, init);
  }

  async sendInternalMessage(
    provider: ContractProvider,
    sender: Sender,
    value: bigint
  ) {
    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async getData(provider: ContractProvider) {
    const { stack } = await provider.get("get_jetton_data", []);

    return {
      totalSupply: stack.readBigNumber(),
      mintable: stack.readBigNumber(),
      adminAddress: stack.readAddress(),
      jettonContent: stack.readCell(),
      jettonWalletCode: stack.readCell(),
      supply: stack.readBigNumber(),
      reserveRate: stack.readBigNumber(),
      reserveBalance: stack.readBigNumber(),
    };
  }

  async getWalletAddress(provider: ContractProvider, ownerAddressCell: Cell) {
    const { stack } = await provider.get("get_wallet_address", [
      {
        type: "slice",
        cell: ownerAddressCell,
      },
    ]);

    return stack.readAddress();
  }
}
