import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

export interface Signers {
  owner: SignerWithAddress;
  stranger: SignerWithAddress;
}
