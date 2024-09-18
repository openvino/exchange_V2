const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        stream: require.resolve("stream-browserify"),
        crypto: require.resolve("crypto-browserify"),
        buffer: require.resolve("buffer"),
      };

      // Proveer Buffer globalmente
      webpackConfig.plugins = (webpackConfig.plugins || []).concat([
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
        }),
      ]);

      // Excluir el uso de process en thirdweb
      webpackConfig.module.rules.push({
        test: /thirdweb/, // Coincidir específicamente con thirdweb
        resolve: {
          fallback: {
            process: false, // No incluir process en thirdweb
          },
        },
      });

      // Incluir process para todas las demás librerías
      webpackConfig.plugins = (webpackConfig.plugins || []).concat([
        new webpack.ProvidePlugin({
          process: "process/browser", // Solo para las demás librerías
        }),
      ]);

      return webpackConfig;
    },
  },
  babel: {
    plugins: [
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      ["@babel/plugin-proposal-class-properties", { loose: true }],
      ["@babel/plugin-transform-private-methods", { loose: true }],
      ["@babel/plugin-transform-private-property-in-object", { loose: true }],
    ],
  },
};

// const webpack = require("webpack");

// module.exports = {
//   webpack: {
//     configure: (webpackConfig) => {
//       webpackConfig.resolve.fallback = {
//         stream: require.resolve("stream-browserify"),
//         crypto: require.resolve("crypto-browserify"),
//         buffer: require.resolve("buffer"),
//       };

//       // Proveer Buffer globalmente
//       webpackConfig.plugins = (webpackConfig.plugins || []).concat([
//         new webpack.ProvidePlugin({
//           Buffer: ["buffer", "Buffer"],
//         }),
//       ]);

//       // Excluir el uso de process en thirdweb
//       webpackConfig.module.rules.push({
//         test: /thirdweb/, // Coincidir específicamente con thirdweb
//         resolve: {
//           fallback: {
//             process: false, // No incluir process en thirdweb
//           },
//         },
//       });

//       // Incluir process para todas las demás librerías
//       webpackConfig.plugins = (webpackConfig.plugins || []).concat([
//         new webpack.ProvidePlugin({
//           process: "process/browser", // Solo para las demás librerías
//         }),
//       ]);

//       return webpackConfig;
//     },
//   },
// };
