import {
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    type Action,
    composeContext,
    generateObject,
} from "@elizaos/core";
import { connect, keyStores, utils } from "near-api-js";
import BN from "bn.js";
import { configureWallet, parseSeedPhrase } from '../config/wallet';

export interface TokenMetadata {
    spec: string;
    name: string;
    symbol: string;
    icon?: string;
    decimals: number;
    totalSupply: string;
}

export interface CreateTokenContent {
    name: string;
    symbol: string;
    totalSupply: string;
    decimals?: number;
    icon?: string;
}

function isCreateTokenContent(content: any): content is CreateTokenContent {
    return (
        typeof content === "object" &&
        content !== null &&
        typeof content.name === "string" &&
        typeof content.symbol === "string" &&
        typeof content.totalSupply === "string"
    );
}

async function deployToken(
    runtime: IAgentRuntime,
    metadata: TokenMetadata
): Promise<string> {
    const seedPhrase = runtime.getSetting("NEAR_SEED_PHRASE");
    if (!seedPhrase) {
        throw new Error("NEAR_SEED_PHRASE not set in runtime settings");
    }

    // Configure wallet with seed phrase
    const { keyStore, networkId } = await configureWallet(seedPhrase);
    
    // Use testnet by default
    const nodeUrl = "https://rpc.testnet.near.org";
    const walletUrl = "https://wallet.testnet.near.org";

    // Get account ID from seed phrase
    const { secretKey, publicKey } = parseSeedPhrase(seedPhrase);
    console.log("Public Key:", publicKey);

    // Initialize connection to NEAR
    const near = await connect({
        networkId: "testnet",
        nodeUrl,
        walletUrl,
        deps: { keyStore },
    });

    // Get account ID from public key
    const accountId = await near.connection.signer.getPublicKey();
    console.log("Account ID:", accountId);

    // Get account object
    const account = await near.account(accountId.toString());
    
    // Generate a unique contract name based on the token symbol
    const contractId = `${metadata.symbol.toLowerCase()}-token.${accountId}`;
    
    // Read the FT contract code
    const contractCode = await runtime.readFile("contracts/ft.wasm");
    if (!contractCode) {
        throw new Error("Failed to read FT contract code. Please ensure the contract is compiled and available.");
    }

    console.log(`Deploying token contract to ${contractId}...`);
    
    try {
        // Deploy the contract
        await account.deployContract(contractCode);
        
        // Initialize the contract with metadata
        await account.functionCall({
            contractId,
            methodName: "new",
            args: {
                owner_id: accountId,
                total_supply: metadata.totalSupply,
                metadata: {
                    spec: metadata.spec,
                    name: metadata.name,
                    symbol: metadata.symbol,
                    decimals: metadata.decimals,
                    icon: metadata.icon || null,
                },
            },
            gas: new BN("300000000000000"), // 300 TGas
            attachedDeposit: new BN("0"),
        });
        
        console.log("Token contract deployed and initialized successfully!");
        return contractId;
        
    } catch (error) {
        console.error("Error deploying token contract:", error);
        throw new Error(`Failed to deploy token contract: ${error.message}`);
    }
}

const createTokenTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "name": "My Token",
    "symbol": "MTK",
    "totalSupply": "1000000000000000000000000",
    "decimals": 18,
    "icon": null
}
\`\`\`

The token creation request should include:
- name: The name of the token
- symbol: The token symbol (2-4 characters)
- totalSupply: The total supply in yocto (10^-24) units
- decimals: (optional) Number of decimals, defaults to 18
- icon: (optional) URL to the token icon
`;

export const executeCreateToken: Action = {
    name: "CREATE_TOKEN",
    triggers: [
        "CREATE TOKEN",
        "CREATE A TOKEN",
        "MAKE A TOKEN",
        "MAKE TOKEN",
        "DEPLOY A TOKEN",
        "CREATE NEW TOKEN",
        "DEPLOY NEW TOKEN",
        "HELP ME CREATE A TOKEN",
        "HELP CREATE TOKEN"
    ],
    description: "Create a new token on NEAR Protocol",
    validate(runtime: IAgentRuntime, message: Memory) {
        console.log("Validating token creation request:", message);
        const content = message.content;
        
        // Extract token info from text if available
        if (typeof content.text === "string") {
            const text = content.text.toLowerCase();
            console.log("Processing text:", text);
            
            // Try to extract name and symbol from different patterns
            let nameMatch = text.match(/token\s+([a-zA-Z0-9]+)/i) || 
                          text.match(/create\s+(?:a\s+)?token\s+([a-zA-Z0-9]+)/i) ||
                          text.match(/make\s+(?:a\s+)?token\s+([a-zA-Z0-9]+)/i);
                          
            let symbolMatch = text.match(/symbol\s+([a-zA-Z0-9]+)/i) ||
                            text.match(/with\s+symbol\s+([a-zA-Z0-9]+)/i) ||
                            text.match(/-\s*symbol\s+([a-zA-Z0-9]+)/i) ||
                            text.match(/\(([a-zA-Z0-9]+)\)/i);

            let totalSupplyMatch = text.match(/supply\s+(\d+)/i);

            console.log("Matches found:", { nameMatch, symbolMatch, totalSupplyMatch });

            // If we found either name or symbol
            if (nameMatch || symbolMatch) {
                const tokenInfo = {
                    name: nameMatch ? nameMatch[1].toUpperCase() : "TOKEN",
                    symbol: symbolMatch ? symbolMatch[1].toUpperCase() : (nameMatch ? nameMatch[1].toUpperCase() : "TKN"),
                    totalSupply: totalSupplyMatch ? 
                        (BigInt(totalSupplyMatch[1]) * BigInt(10**24)).toString() : 
                        "1000000000000000000000000000", // Default 1 billion tokens
                    decimals: 24 // NEAR uses 24 decimals by default
                };
                
                console.log("Extracted token info:", tokenInfo);
                return tokenInfo;
            }
        }
        
        if (!isCreateTokenContent(content)) {
            throw new Error("Please provide token name and symbol. Example: 'create token BROLAB with symbol BRO and total supply 1000000000'");
        }

        return content;
    },
    async handler(
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> {
        try {
            console.log("Starting token creation process...");
            console.log("Message content:", message.content);
            
            // Get validated content
            const validatedContent = this.validate(runtime, message);
            console.log("Validated content:", validatedContent);
            
            const metadata: TokenMetadata = {
                spec: "ft-1.0.0",
                name: validatedContent.name,
                symbol: validatedContent.symbol,
                decimals: validatedContent.decimals || 24,
                totalSupply: validatedContent.totalSupply,
                icon: validatedContent.icon,
            };

            console.log("Prepared metadata:", metadata);
            
            try {
                console.log("Deploying token contract...");
                const contractId = await deployToken(runtime, metadata);
                console.log("Token contract deployed successfully at:", contractId);
                
                if (callback) {
                    callback({
                        type: "success",
                        content: {
                            contractId,
                            ...metadata,
                        },
                    });
                }
                
                return true;
            } catch (error) {
                console.error("Error deploying token:", error);
                if (callback) {
                    callback({
                        type: "error",
                        content: {
                            error: error.message,
                        },
                    });
                }
                return false;
            }
        } catch (error) {
            console.error("Error in handler:", error);
            if (callback) {
                callback({
                    type: "error",
                    content: {
                        error: error.message,
                    },
                });
            }
            return false;
        }
    },
    examples: [
        {
            user: "{{user1}}",
            content: {
                text: "Create a new token called MyToken with symbol MTK and total supply of 1 million tokens",
            },
        },
        {
            assistant: "{{assistant}}",
            content: {
                name: "MyToken",
                symbol: "MTK",
                totalSupply: "1000000000000000000000000000",
                decimals: 24,
            },
        },
    ],
    template: createTokenTemplate,
    modelClass: ModelClass.FUNCTION,
};
