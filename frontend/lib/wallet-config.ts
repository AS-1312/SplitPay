import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, hardhat } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia, hardhat],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'SplitPay',
        url: 'https://splitpay.app',
      },
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [hardhat.id]: http(),
  },
})

// Re-export for easier imports
export { mainnet, sepolia, hardhat }

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}