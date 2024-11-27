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
  let jettonOwned: any;
  let latestSupply: any;

  beforeAll(async () => {
    const blockchain = await Blockchain.create();
    senderWallet = await blockchain.treasury("sender", {
      balance: new BN("1000000000000000000"),
      resetBalanceIfZero: true,
    });

    const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0];

    const dataCell = beginCell()
      .storeUint(new BN("100000000000000000000"), 128) // total supply
      .storeUint(new BN("10000000000000000"), 128) // initial supply
      .storeUint(new BN(4200), 32) // reserve rate
      .storeUint(new BN("100000000000"), 64) // reserve balance
      .storeAddress(senderWallet.address)
      .storeRef(
        beginCell()
          .storeInt(0x00, 8) // Store the content prefix
          .endCell()
      )
      .storeRef(JETTON_WALLET_CODE)
      .storeDict(null)
      .endCell();

    myContract = blockchain.openContract(
      await MainContract.createFromConfig(codeCell, dataCell)
    );

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
    expect(getData.adminAddress).toEqualAddress(senderWallet.address);
  });

  it("test get_wallet_address", async () => {
    const ownerAddressCell = beginCell().storeAddress(adminAddress).endCell();

    const jettonWalletAddress = await myContract.getWalletAddress(
      ownerAddressCell
    );
    expect(!jettonWalletAddress).toEqual(false);
  });

  it("test get_purchase_return", async () => {
    const getData = await myContract.getData();

    const ton = 1000000000;
    const totalReserveBalance = Number(getData.reserveBalance) + ton;
    const expectedPurchaseAmt =
      Number(getData.supply) *
      (Math.pow(
        1 + ton / totalReserveBalance,
        Number(getData.reserveRate) / 10000
      ) -
        1);

    const purchaseReturn = await myContract.getPurchaseReturn(ton);

    expect(Number(purchaseReturn).toString()).toEqual(
      expectedPurchaseAmt.toFixed(0)
    );
  });

  it("test get_sale_return", async () => {
    const getData = await myContract.getData();

    const sellAmt = 1000000000;
    const expectedSaleReturn =
      Number(getData.reserveBalance) *
      (1 -
        Math.pow(
          1 - sellAmt / Number(getData.supply),
          1 / (Number(getData.reserveRate) / 10000)
        ));

    const actualSaleReturn = await myContract.getSaleReturn(sellAmt);

    expect(Number(actualSaleReturn).toString()).toEqual(
      expectedSaleReturn.toFixed(0)
    );
  });

  it("test purchase token success", async () => {
    const body = beginCell()
      .storeUint(31, 32) // op code 31 -> buy jetton
      .storeUint(1, 64)
      .storeCoins(new BN("1000000000"))
      .storeRef(beginCell().endCell())
      .endCell();

    sentMessageResult = await myContract.sendTransaction(
      senderWallet.getSender(),
      toNano("0.05"),
      body
    );

    expect(sentMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });

    const getData = await myContract.getData();
    expect(getData.reserveBalance).toEqual(100000000000n + 1000000000n);

    latestSupply = getData.supply;
    jettonOwned = getData.supply - 10000000000000000n;
  });

  it("test sell token success", async () => {
    const body = beginCell()
      .storeUint(51, 32) // op code 51 -> sell jetton
      .storeUint(1, 64)
      .storeCoins(jettonOwned)
      .storeRef(beginCell().endCell())
      .endCell();

    sentMessageResult = await myContract.sendTransaction(
      senderWallet.getSender(),
      toNano("2"),
      body
    );

    expect(sentMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });

    const getData = await myContract.getData();
    expect(getData.supply).toEqual(latestSupply - jettonOwned);
  });

  it("test mint token to be failed", async () => {
    const body = beginCell()
      .storeUint(21, 32) // op code 21 -> mint jetton
      .storeUint(1, 64) // queryid
      .storeAddress(adminAddress)
      .storeCoins(new BN("100000000")) // ton amt
      .storeRef(
        // internal transfer message
        beginCell()
          .storeUint(0x178d4519, 32) // op code 0x178d4519 -> internal transfer
          .storeUint(0, 64)
          .storeCoins(new BN("100000000000")) // jetton_amount
          .storeAddress(null)
          .storeAddress(adminAddress)
          .storeCoins(new BN("10000000"))
          .storeBit(false) // forward_payload in this slice, not separate cell
          .endCell()
      )
      .endCell();

    sentMessageResult = await myContract.sendTransaction(
      senderWallet.getSender(),
      toNano("1"),
      body
    );

    expect(sentMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: false,
    });

    const getData = await myContract.getData();
    expect(getData.supply).toEqual(latestSupply - jettonOwned);
  });

  it("test add role success", async () => {
    const roleRef = beginCell().storeUint(1, 8).endCell(); // 1 ~= MINTER ROLE

    const body = beginCell()
      .storeUint(81, 32) // op code 81 -> add role
      .storeUint(1, 64)
      .storeAddress(senderWallet.address)
      .storeRef(roleRef)
      .endCell();

    sentMessageResult = await myContract.sendTransaction(
      senderWallet.getSender(),
      toNano("0.1"),
      body
    );

    expect(sentMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });

    const addressCell = beginCell()
      .storeAddress(senderWallet.address)
      .endCell();
    const hasRole = await myContract.getHasRole(addressCell, 1);

    expect(hasRole).toEqual(-1n);
  });

  it("test mint token success", async () => {
    const body = beginCell()
      .storeUint(21, 32) // op code 21 -> mint jetton
      .storeUint(1, 64) // queryid
      .storeAddress(adminAddress)
      .storeCoins(new BN("1000000")) // ton amt
      .storeRef(
        // internal transfer message
        beginCell()
          .storeUint(0x178d4519, 32) // op code 0x178d4519 -> internal transfer
          .storeUint(0, 64)
          .storeCoins(new BN("1000000000")) // jetton_amount
          .storeAddress(adminAddress)
          .storeAddress(adminAddress)
          .storeCoins(new BN("1000000"))
          .storeBit(false) // forward_payload in this slice, not separate cell
          .endCell()
      )
      .endCell();

    sentMessageResult = await myContract.sendTransaction(
      senderWallet.getSender(),
      toNano("1.5"),
      body
    );

    expect(sentMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });

    const getData = await myContract.getData();
    expect(getData.supply).toEqual(10000000000000000n + 1000000000n);
  });
});
