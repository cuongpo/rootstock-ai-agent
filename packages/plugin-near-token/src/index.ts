import { Plugin } from "@elizaos/core/src/types";
import { walletProvider } from "./providers/wallet";
import { executeCreateToken } from "./actions/createToken";

export const nearTokenPlugin: Plugin = {
    name: "NEAR_TOKEN",
    description: "Plugin for creating and managing tokens on NEAR Protocol",
    providers: [walletProvider],
    actions: [executeCreateToken],
    evaluators: []
};

export default nearTokenPlugin;
