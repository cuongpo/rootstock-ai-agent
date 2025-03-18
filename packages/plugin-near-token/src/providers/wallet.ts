import { Provider } from "@elizaos/core/src/types";
import { connect, keyStores } from "near-api-js";

export const walletProvider: Provider = {
    name: "NEAR_WALLET",
    description: "NEAR Protocol wallet provider",
    async initialize(runtime) {
        const networkId = runtime.getSetting("NEAR_NETWORK_ID") || "testnet";
        const nodeUrl = runtime.getSetting("NEAR_NODE_URL") || `https://rpc.${networkId}.near.org`;
        const walletUrl = runtime.getSetting("NEAR_WALLET_URL") || `https://wallet.${networkId}.near.org`;

        const keyStore = new keyStores.InMemoryKeyStore();
        const near = await connect({
            networkId,
            nodeUrl,
            walletUrl,
            deps: { keyStore },
        });

        return {
            near,
            keyStore,
        };
    },
};
