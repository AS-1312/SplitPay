import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [sepolia],
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
  },
})

export { sepolia }

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}