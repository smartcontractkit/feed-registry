// eslint-disable @typescript-eslint/no-explicit-any
import { Fixture } from "ethereum-waffle";

import { Signers } from "./";
import { AggregatorV2V3Interface, FeedRegistry } from "../typechain";

declare module "mocha" {
  export interface Context {
    registry: FeedRegistry;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}
