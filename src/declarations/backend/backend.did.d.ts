import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface ApiError {
  'source' : string,
  'code' : bigint,
  'message' : string,
}
export type ApiResponse = { 'error' : ApiError } |
  { 'success' : Array<CryptoAsset> };
export interface CryptoAsset {
  'volumeMarketCapRatio' : number,
  'marketCap' : number,
  'name' : string,
  'percentageChange' : number,
  'description' : string,
  'volume' : number,
  'price' : number,
  'symbol' : string,
}
export interface FileReference { 'hash' : string, 'path' : string }
export interface Map { 'root' : Tree, 'size' : bigint }
export interface TransformationInput {
  'context' : Uint8Array | number[],
  'response' : http_request_result,
}
export interface TransformationOutput {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<http_header>,
}
export type Tree = { 'red' : [Tree, string, string, Tree] } |
  { 'leaf' : null } |
  { 'black' : [Tree, string, string, Tree] };
export interface http_header { 'value' : string, 'name' : string }
export interface http_request_result {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<http_header>,
}
export interface _SERVICE {
  'dropFileReference' : ActorMethod<[string], undefined>,
  'fetchBinanceFuturesAssets' : ActorMethod<[], undefined>,
  'fetchCoinGeckoMarketCap' : ActorMethod<[], undefined>,
  'fetchCoinMarketCapMarketCap' : ActorMethod<[], undefined>,
  'fetchRealTimeData' : ActorMethod<[], ApiResponse>,
  'fetchWithRetry' : ActorMethod<[bigint], ApiResponse>,
  'getAggregateMarketData' : ActorMethod<
    [],
    {
      'totalMarketCap' : number,
      'totalVolume' : number,
      'totalExcludingBTC' : number,
      'totalExcludingBTCAndETH' : number,
    }
  >,
  'getAggregatedMarketCap' : ActorMethod<[], number>,
  'getCapitalFlowVisualizationData' : ActorMethod<
    [],
    {
      'stablecoins' : number,
      'cryptoToUsd' : number,
      'usdToCrypto' : number,
      'totalCrypto' : number,
      'usdCenter' : number,
      'inflow' : number,
      'totalExcludingBTC' : number,
      'outflow' : number,
      'totalExcludingBTCAndETH' : number,
    }
  >,
  'getCurrentTopAsset' : ActorMethod<[], ApiResponse>,
  'getFileReference' : ActorMethod<[string], FileReference>,
  'getLastUpdateTime' : ActorMethod<[], bigint>,
  'getMarketCapSources' : ActorMethod<
    [],
    { 'aggregated' : number, 'coinGecko' : number, 'coinMarketCap' : number }
  >,
  'getPortugueseLabels' : ActorMethod<[], Map>,
  'getTopCryptoAssets' : ActorMethod<[], ApiResponse>,
  'listFileReferences' : ActorMethod<[], Array<FileReference>>,
  'registerFileReference' : ActorMethod<[string, string], undefined>,
  'transform' : ActorMethod<[TransformationInput], TransformationOutput>,
  'updateCapitalFlowData' : ActorMethod<[], ApiResponse>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
