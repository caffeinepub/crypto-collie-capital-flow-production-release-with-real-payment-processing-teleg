export const idlFactory = ({ IDL }) => {
  const Tree = IDL.Rec();
  const ApiError = IDL.Record({
    'source' : IDL.Text,
    'code' : IDL.Int,
    'message' : IDL.Text,
  });
  const CryptoAsset = IDL.Record({
    'volumeMarketCapRatio' : IDL.Float64,
    'marketCap' : IDL.Float64,
    'name' : IDL.Text,
    'percentageChange' : IDL.Float64,
    'description' : IDL.Text,
    'volume' : IDL.Float64,
    'price' : IDL.Float64,
    'symbol' : IDL.Text,
  });
  const ApiResponse = IDL.Variant({
    'error' : ApiError,
    'success' : IDL.Vec(CryptoAsset),
  });
  const FileReference = IDL.Record({ 'hash' : IDL.Text, 'path' : IDL.Text });
  Tree.fill(
    IDL.Variant({
      'red' : IDL.Tuple(Tree, IDL.Text, IDL.Text, Tree),
      'leaf' : IDL.Null,
      'black' : IDL.Tuple(Tree, IDL.Text, IDL.Text, Tree),
    })
  );
  const Map = IDL.Record({ 'root' : Tree, 'size' : IDL.Nat });
  const http_header = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const http_request_result = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(http_header),
  });
  const TransformationInput = IDL.Record({
    'context' : IDL.Vec(IDL.Nat8),
    'response' : http_request_result,
  });
  const TransformationOutput = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(http_header),
  });
  return IDL.Service({
    'dropFileReference' : IDL.Func([IDL.Text], [], []),
    'fetchBinanceFuturesAssets' : IDL.Func([], [], []),
    'fetchCoinGeckoMarketCap' : IDL.Func([], [], []),
    'fetchCoinMarketCapMarketCap' : IDL.Func([], [], []),
    'fetchRealTimeData' : IDL.Func([], [ApiResponse], []),
    'fetchWithRetry' : IDL.Func([IDL.Nat], [ApiResponse], []),
    'getAggregateMarketData' : IDL.Func(
        [],
        [
          IDL.Record({
            'totalMarketCap' : IDL.Float64,
            'totalVolume' : IDL.Float64,
            'totalExcludingBTC' : IDL.Float64,
            'totalExcludingBTCAndETH' : IDL.Float64,
          }),
        ],
        ['query'],
      ),
    'getAggregatedMarketCap' : IDL.Func([], [IDL.Float64], ['query']),
    'getCapitalFlowVisualizationData' : IDL.Func(
        [],
        [
          IDL.Record({
            'stablecoins' : IDL.Float64,
            'cryptoToUsd' : IDL.Float64,
            'usdToCrypto' : IDL.Float64,
            'totalCrypto' : IDL.Float64,
            'usdCenter' : IDL.Float64,
            'inflow' : IDL.Float64,
            'totalExcludingBTC' : IDL.Float64,
            'outflow' : IDL.Float64,
            'totalExcludingBTCAndETH' : IDL.Float64,
          }),
        ],
        ['query'],
      ),
    'getCurrentTopAsset' : IDL.Func([], [ApiResponse], ['query']),
    'getFileReference' : IDL.Func([IDL.Text], [FileReference], []),
    'getLastUpdateTime' : IDL.Func([], [IDL.Int], ['query']),
    'getMarketCapSources' : IDL.Func(
        [],
        [
          IDL.Record({
            'aggregated' : IDL.Float64,
            'coinGecko' : IDL.Float64,
            'coinMarketCap' : IDL.Float64,
          }),
        ],
        ['query'],
      ),
    'getPortugueseLabels' : IDL.Func([], [Map], ['query']),
    'getTopCryptoAssets' : IDL.Func([], [ApiResponse], ['query']),
    'listFileReferences' : IDL.Func([], [IDL.Vec(FileReference)], []),
    'registerFileReference' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'transform' : IDL.Func(
        [TransformationInput],
        [TransformationOutput],
        ['query'],
      ),
    'updateCapitalFlowData' : IDL.Func([], [ApiResponse], []),
  });
};
export const init = ({ IDL }) => { return []; };
