import { keyStores, KeyPair } from 'near-api-js';
import { parseSeedPhrase as nearParseSeedPhrase } from 'near-seed-phrase';

export function parseSeedPhrase(seedPhrase: string) {
    return nearParseSeedPhrase(seedPhrase);
}

export async function configureWallet(seedPhrase: string) {
    try {
        // Parse the seed phrase to get keypair
        const { secretKey, publicKey } = parseSeedPhrase(seedPhrase);
        
        // Create an in-memory keystore
        const keyStore = new keyStores.InMemoryKeyStore();
        
        // Create a KeyPair from the secret key
        const keyPair = KeyPair.fromString(secretKey);
        
        // Store the key for testnet
        const networkId = 'testnet';
        const accountId = process.env.NEAR_ACCOUNT_ID || '';
        
        if (!accountId) {
            throw new Error('NEAR_ACCOUNT_ID environment variable is not set');
        }
        
        // Add the key to the keystore
        await keyStore.setKey(networkId, accountId, keyPair);
        
        return {
            keyStore,
            accountId,
            publicKey,
            networkId
        };
    } catch (error) {
        console.error('Error configuring wallet:', error);
        throw error;
    }
}
