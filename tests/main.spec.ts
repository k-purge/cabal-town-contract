const BN = require("bn.js");
import "@ton-community/test-utils";
import { beginCell, Cell, Address, toNano } from "ton-core";
import { hex } from "../build/jetton-master.compiled.json";
import { hex as walletHex } from "../build/jetton-wallet.compiled.json";
import { Blockchain } from "@ton-community/sandbox";
import { MainContract } from "../wrappers/MainContract";

describe("Test jetton minter", () => {
  const JETTON_WALLET_CODE = Cell.fromBoc(Buffer.from(walletHex, "hex"))[0];
  const adminAddress = Address.parse(
    "0QAOc7gW0Si6uEifcV-jLqR8dxFIHxiHtPxOkgTDXc9eR9n6"
  );

  let sentMessageResult: any;
  let senderWallet: any;
  let myContract: any;

  beforeAll(async () => {
    const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0];

    const dataCell = beginCell()
      .storeUint(new BN("100000000000000000000"), 128) // total supply
      .storeUint(new BN("10000000000000000"), 128) // initial supply
      .storeUint(new BN(4200), 32) // reserve rate
      .storeUint(new BN("100000000000"), 64) // reserve balance
      .storeAddress(adminAddress)
      .storeRef(
        beginCell()
          .storeInt(0x00, 8) // Store the content prefix
          .endCell()
      )
      .storeRef(JETTON_WALLET_CODE)
      .endCell();
    const blockchain = await Blockchain.create();

    myContract = blockchain.openContract(
      await MainContract.createFromConfig(codeCell, dataCell)
    );

    senderWallet = await blockchain.treasury("sender");

    sentMessageResult = await myContract.sendInternalMessage(
      senderWallet.getSender(),
      toNano("0.05")
    );
  });

  it("test deploy", async () => {
    expect(sentMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });
  });

  it("test get_jetton_data", async () => {
    const getData = await myContract.getData();

    expect(getData.totalSupply).toBe(100000000000000000000n);
    expect(getData.mintable).toEqual(-1n);
    expect(getData.reserveRate).toEqual(4200n);
    expect(getData.reserveBalance).toEqual(100000000000n);
    expect(getData.supply).toEqual(10000000000000000n);
    expect(getData.adminAddress).toEqualAddress(adminAddress);
  });

  it("test get_wallet_address", async () => {
    const ownerAddressCell = beginCell().storeAddress(adminAddress).endCell();

    const jettonWalletAddress = await myContract.getWalletAddress(
      ownerAddressCell
    );
    expect(!jettonWalletAddress).toEqual(false);
  });
});
