/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle React Native dependencies and polyfills
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };

    // Ignore React Native async storage warnings
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        '@react-native-async-storage/async-storage': 'AsyncStorage'
      });
    }

    // Handle pino-pretty and disable WalletConnect dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
      '@walletconnect/web3-provider': false,
      '@walletconnect/ethereum-provider': false,
    };

    // Ignore WalletConnect modules completely
    config.externals.push(function ({context, request}, callback) {
      if (request.includes('@walletconnect') || request.includes('@reown')) {
        return callback(null, 'window')
      }
      callback()
    });

    return config;
  },
};

module.exports = nextConfig;
