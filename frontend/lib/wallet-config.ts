import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, hardhat } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [sepolia, mainnet, hardhat],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'SplitPay',
        url: 'https://splitpay.app',
      },
    }),
  ],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
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