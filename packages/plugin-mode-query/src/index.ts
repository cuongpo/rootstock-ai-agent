import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    Plugin,
    State,
    elizaLogger,
} from "@elizaos/core";
import axios from 'axios';

const BLOCKSCOUT_API = 'https://rootstock.blockscout.com/api/v2';

interface BlockscoutResponse<T> {
    items: any;
    data: T;
    status: string;
    message?: string;
    coin_balance?: string;
}

interface AddressBalance {
    coin_balance: string;
    hash: string;
}

interface Block {
    height: string;
    timestamp: string;
    hash: string;
}

interface TransactionDetails {
    timestamp: string;
    hash: string;
    status: string;
    method: string;
    to: {
        hash: string;
        name?: string;
    } | string;
    from: {
        hash: string;
        name?: string;
    } | string;
    value: string;
    gas_used: string;
    gas_price: string;
    block: number;
    block_number?: number;
    token_transfers?: Array<{
        token: {
            name: string;
            symbol: string;
            decimals: string;
        };
        total: {
            value: string;
            decimals: string;
        };
        from: {
            hash: string;
        };
        to: {
            hash: string;
        };
    }>;
}

interface NetworkStats {
    average_block_time: number;
    coin_price_change_percentage: string;
    gas_prices: {
        average: number;
        fast: number;
        slow: number;
    };
    network_utilization_percentage: string;
    total_addresses: string;
    total_transactions: string;
}

const getBalance: Action = {
    name: "GET_ROOTSTOCK_BALANCE",
    similes: ["CHECK_ROOTSTOCK_BALANCE", "FETCH_ROOTSTOCK_BALANCE"],
    description: "Get the balance of a Rootstock network address",
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "What's the balance of 0x742d35Cc6634C0532925a3b844Bc454e4438f44e?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Let me check the balance for that address.",
                    action: "GET_ROOTSTOCK_BALANCE"
                },
            },
        ]
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        options: any,
        callback?: HandlerCallback
    ) => {
        if (!callback) return;

        try {
            const addressMatch = message.content.text.match(/0x[a-fA-F0-9]{40}/);
            const address = addressMatch ? addressMatch[0] : options?.address;

            if (!address) {
                callback({
                    text: "Please provide a valid 0x address"
                });
                return;
            }

            const response = await axios.get(`${BLOCKSCOUT_API}/addresses/${address}`);
            elizaLogger.log(response.data);
            if (!response.data) {
                callback({
                    text:  'Failed to fetch balance'
                });
                return;
            }

            const balanceInWei = response.data.coin_balance || '0';
            const balance = (Number(balanceInWei) / 1e18).toFixed(5);

            elizaLogger.log(`Balance for address ${address}: ${balance}`);

            callback({
                text: `The balance for ${address} is ${balance} RBTC`
            });
        } catch (error: any) {
            elizaLogger.error('Error fetching balance:', error);
            callback({
                text: `Failed to fetch balance: ${error.message}`
            });
        }
    }
};

const getLatestBlock: Action = {
    name: "GET_ROOTSTOCK_BLOCK",
    similes: ["CHECK_ROOTSTOCK_BLOCK", "FETCH_ROOTSTOCK_BLOCK"],
    description: "Get the latest block information from Rootstock network",
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "What's the latest block on Rootstock?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll check the latest block information.",
                    action: "GET_ROOTSTOCK_BLOCK"
                },
            },
        ]
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        options: any,
        callback?: HandlerCallback
    ) => {
        if (!callback) return;

        try {
            const response = await axios.get(`${BLOCKSCOUT_API}/blocks`);

            // if (response.data || response.data.status !== 'success') {
            //     callback({
            //         text: response.data?.message || 'Failed to fetch latest block'
            //     });
            //     return;
            // }

            const block = response.data.items ? response.data.items[0] : null;
            if (!block) {
                callback({
                    text: 'Failed to fetch latest block data'
                });
                return;
            }
            console.log("1");
            console.log(block.height);
            callback({
                text: `Latest block:\nNumber: ${block.height || 'N/A'}\nTimestamp: ${block.timestamp || 'N/A'}\nHash: ${block.hash || 'N/A'}`
            });
        } catch (error: any) {
            console.log("3");
            elizaLogger.error('Error fetching latest block:', error);
            callback({
                text: `Failed to fetch latest block: ${error.message}`
            });
        }
    }
};

const getTransactions: Action = {
    name: "GET_ROOTSTOCK_TRANSACTIONS",
    similes: ["CHECK_ROOTSTOCK_TRANSACTIONS", "FETCH_ROOTSTOCK_TRANSACTIONS"],
    description: "Get transaction details by hash",
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Show me details for transaction 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Let me fetch that transaction details for you.",
                    action: "GET_ROOTSTOCK_TRANSACTIONS"
                },
            },
        ]
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        options: any,
        callback?: HandlerCallback
    ) => {
        if (!callback) return;

        try {
            const txHashMatch = message.content.text.match(/0x[a-fA-F0-9]{64}/);
            const txHash = txHashMatch ? txHashMatch[0] : options?.txHash;

            if (!txHash) {
                callback({
                    text: "Please provide a valid transaction hash"
                });
                return;
            }

            elizaLogger.log(`Fetching transaction: ${txHash}`);
            const response = await axios.get(`${BLOCKSCOUT_API}/transactions/${txHash}`);
            const tx = response.data;
            elizaLogger.log('Transaction response:', tx);

            if (!tx) {
                callback({
                    text: 'Failed to fetch transaction details'
                });
                return;
            }

            let details = `Transaction Details:\n`;
            details += `Hash: ${tx.hash || 'Unknown'}\n`;
            details += `Status: ${tx.status || 'Unknown'}\n`;
            details += `Block: ${tx.block_number || tx.block || 'Unknown'}\n`;
            details += `Timestamp: ${tx.timestamp || 'Unknown'}\n`;
            
            // Handle from address which could be an object or string
            const fromAddress = typeof tx.from === 'object' && tx.from ? tx.from.hash : tx.from;
            details += `From: ${fromAddress || 'Unknown'}\n`;
            
            // Handle to address which could be an object or string
            const toAddress = typeof tx.to === 'object' && tx.to ? tx.to.hash : tx.to;
            const toName = typeof tx.to === 'object' && tx.to && tx.to.name ? ` (${tx.to.name})` : '';
            details += `To: ${toAddress || 'Unknown'}${toName}\n`;

            if (tx.token_transfers && tx.token_transfers.length > 0) {
                const transfer = tx.token_transfers[0];
                const tokenAmount = Number(transfer.total.value) / Math.pow(10, Number(transfer.total.decimals));
                details += `Token Transfer: ${tokenAmount} ${transfer.token.symbol}\n`;
                details += `Token Contract: ${transfer.token.name} (${transfer.token.symbol})\n`;
            } else {
                const valueInEth = Number(tx.value) / 1e18;
                details += `Value: ${valueInEth} RBTC\n`;
            }

            details += `Gas Used: ${tx.gas_used || 'Unknown'}\n`;
            details += `Gas Price: ${tx.gas_price ? (Number(tx.gas_price) / 1e9) + ' Gwei' : 'Unknown'}`;

            callback({
                text: details
            });
        } catch (error: any) {
            elizaLogger.error('Error fetching transaction:', error);
            callback({
                text: `Failed to fetch transaction: ${error.message}`
            });
        }
    }
};

const getNetworkStats: Action = {
    name: "GET_NETWORK_STATS",
    similes: ["CHECK_NETWORK_STATS", "FETCH_NETWORK_STATS"],
    description: "Get Rootstock network statistics including total addresses, transactions, and average block time",
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "What are the current network statistics?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll check the current network statistics for you.",
                    action: "GET_NETWORK_STATS"
                },
            },
        ]
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        options: any,
        callback?: HandlerCallback
    ) => {
        if (!callback) return;

        try {
            const response = await axios.get(`${BLOCKSCOUT_API}/stats`);
            const stats = response.data;
            elizaLogger.log('Network stats response:', stats);

            if (!stats) {
                callback({
                    text: 'Failed to fetch network statistics'
                });
                return;
            }

            // Convert block time from milliseconds to seconds and round to 2 decimal places
            const blockTimeInSeconds = stats.average_block_time ? (stats.average_block_time / 1000).toFixed(2) : 'Unknown';

            const details = [
                `📊 Network Statistics:`,
                ``,
                `📈 Activity:`,
                `• Total Addresses: ${stats.total_addresses ? Number(stats.total_addresses).toLocaleString() : 'Unknown'}`,
                `• Total Transactions: ${stats.total_transactions ? Number(stats.total_transactions).toLocaleString() : 'Unknown'}`,
                `• Network Utilization: ${stats.network_utilization_percentage ? stats.network_utilization_percentage + '%' : 'Unknown'}`,
                ``,
                `⚡ Performance:`,
                `• Average Block Time: ${blockTimeInSeconds} seconds`,
                ``,
                `⛽ Gas Prices (Gwei):`,
                `• Slow: ${stats.gas_prices?.slow || 'Unknown'}`,
                `• Average: ${stats.gas_prices?.average || 'Unknown'}`,
                `• Fast: ${stats.gas_prices?.fast || 'Unknown'}`,
                ``,
                `💰 Token:`,
                `• Price Change (24h): ${stats.coin_price_change_percentage ? stats.coin_price_change_percentage + '%' : 'Unknown'}`
            ].join('\n');

            callback({
                text: details
            });
        } catch (error: any) {
            elizaLogger.error('Error fetching network stats:', error);
            callback({
                text: `Failed to fetch network statistics: ${error.message}`
            });
        }
    }
};

const modeQueryPlugin: Plugin = {
    name: "@elizaos/plugin-mode-query",
    description: "Plugin for querying Rootstock network data",
    actions: [getBalance, getLatestBlock, getTransactions, getNetworkStats],
    evaluators: [],
    providers: [],
    services: []
};

export default modeQueryPlugin;
