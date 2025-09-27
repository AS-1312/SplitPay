// Enhanced wallet detection utilities

export function detectMetaMask(): boolean {
  if (typeof window === 'undefined') return false

  // Check for MetaMask in multiple ways
  const { ethereum } = window as any

  if (!ethereum) return false

  // MetaMask sets this flag
  if (ethereum.isMetaMask) return true

  // Fallback: check for MetaMask in providers array
  if (ethereum.providers?.some((p: any) => p.isMetaMask)) return true

  // Another fallback: check user agent (less reliable)
  if (ethereum._metamask) return true

  return false
}

export function detectBrowserWallet(): boolean {
  if (typeof window === 'undefined') return false

  return !!(window as any).ethereum
}

export function getWalletInfo() {
  if (typeof window === 'undefined') {
    return {
      hasEthereum: false,
      hasMetaMask: false,
      providers: [],
      userAgent: 'Server',
    }
  }

  const ethereum = (window as any).ethereum
  const hasEthereum = !!ethereum
  const hasMetaMask = detectMetaMask()

  let providers: string[] = []
  if (ethereum) {
    if (ethereum.isMetaMask) providers.push('MetaMask')
    if (ethereum.isCoinbaseWallet) providers.push('Coinbase Wallet')
    if (ethereum.isFrame) providers.push('Frame')
    if (ethereum.isTrust) providers.push('Trust Wallet')
    if (ethereum.providers) {
      providers = providers.concat(
        ethereum.providers.map((p: any) => {
          if (p.isMetaMask) return 'MetaMask'
          if (p.isCoinbaseWallet) return 'Coinbase Wallet'
          return 'Unknown Provider'
        })
      )
    }
  }

  return {
    hasEthereum,
    hasMetaMask,
    providers: [...new Set(providers)], // Remove duplicates
    userAgent: navigator.userAgent,
    ethereumObject: ethereum ? Object.keys(ethereum) : [],
  }
}