import { Cell, Dictionary, beginCell } from "ton-core";

import { Sha256 } from "@aws-crypto/sha256-js";

const OFF_CHAIN_CONTENT_PREFIX = 0x01;
const ONCHAIN_CONTENT_PREFIX = 0x00;
const SNAKE_PREFIX = 0x00;

export type JettonMetaDataKeys = "name" | "description" | "image" | "symbol";

const jettonOnChainMetadataSpec: {
  [key in JettonMetaDataKeys]: "utf8" | "ascii" | undefined;
} = {
  name: "utf8",
  description: "utf8",
  image: "ascii",
  symbol: "utf8",
};

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function bufferToChunks(buff: Buffer, chunkSize: number) {
  const chunks: Buffer[] = [];
  while (buff.byteLength > 0) {
    chunks.push(buff.slice(0, chunkSize));
    buff = buff.slice(chunkSize);
  }
  return chunks;
}

export function makeSnakeCell(data: Buffer): Cell {
  const chunks = bufferToChunks(data, 127)

  if (chunks.length === 0) {
    return beginCell().endCell()
  }

  if (chunks.length === 1) {
    return beginCell().storeBuffer(chunks[0]).endCell()
  }

  let curCell = beginCell()

  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i]

    curCell.storeBuffer(chunk)

    if (i - 1 >= 0) {
      const nextCell = beginCell()
      nextCell.storeRef(curCell)
      curCell = nextCell
    }
  }

  return curCell.endCell()
}

export function encodeOffChainContent(metadataLink: string) {
  let data = Buffer.from(metadataLink, "ascii");
  let offChainPrefix = Buffer.from([OFF_CHAIN_CONTENT_PREFIX]);
  data = Buffer.concat([offChainPrefix, data]);
  const result = makeSnakeCell(data);
  console.log("result: ", result)
  return result
}



// This is example data - Modify these params for your own jetton!
// - Data is stored on-chain (except for the image data itself)
// - Owner should usually be the deploying wallet's address.

const sha256 = (str: string) => {
  const sha = new Sha256();
  sha.update(str);
  return Buffer.from(sha.digestSync());
};

// export function buildTokenMetadataCell(data: { [s: string]: string | undefined }) {
//   const KEYLEN = 256;
//   // const dict = beginDict(KEYLEN);
//   const dict = beginCell();

//   Object.entries(data).forEach(([k, v]: [string, string | undefined]) => {
//     if (!jettonOnChainMetadataSpec[k as JettonMetaDataKeys])
//       throw new Error(`Unsupported onchain key: ${k}`);
//     if (v === undefined || v === "") return;

//     let bufferToStore = Buffer.from(v, jettonOnChainMetadataSpec[k as JettonMetaDataKeys]);

//     const CELL_MAX_SIZE_BYTES = Math.floor((1023 - 8) / 8);

//     const rootCell =  beginCell();
//     rootCell.storeBit(SNAKE_PREFIX);
//     let currentCell = rootCell;

//     while (bufferToStore.length > 0) {
//       currentCell.storeBuffer(bufferToStore.slice(0, CELL_MAX_SIZE_BYTES));
//       bufferToStore = bufferToStore.slice(CELL_MAX_SIZE_BYTES);
//       if (bufferToStore.length > 0) {
//         const newCell = beginCell();
//         currentCell.storeRef(newCell);
//         currentCell = newCell;
//       }
//     }

//     const sha = sha256(k).byteOffset

//     const jettonDict = Dictionary.empty<Buffer, Cell>();
//     dict.storeDict(jettonDict, Dictionary.Keys.Buffer(sha), rootCell)


//     sha256(k).then((buf) => {
//       const s =  Buffer.from(buf)
//       dict.storeRef(s);
//     })
//   });

//   return beginCell().storeInt(ONCHAIN_CONTENT_PREFIX, 8).storeDict().endCell();
// }