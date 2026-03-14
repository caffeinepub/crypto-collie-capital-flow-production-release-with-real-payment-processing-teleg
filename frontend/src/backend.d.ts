import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface StripeConfigurationPublic {
    allowedCountries: Array<string>;
    isConfigured: boolean;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface PaymentTransaction {
    status: string;
    method: PaymentMethod;
    createdAt: bigint;
    user: Principal;
    updatedAt?: bigint;
    amountUsd: number;
    planType: PlanType;
    transactionId: string;
}
export interface Chapter {
    title: string;
    content: string;
    number: bigint;
}
export interface Subscription {
    status: SubscriptionStatus;
    createdAt: bigint;
    user: Principal;
    updatedAt?: bigint;
    lastPaymentId?: string;
    planType: PlanType;
}
export interface CategoryMetrics {
    trend: string;
    marketCap: number;
    name: string;
    volume: number;
    flowMetrics: FlowMetrics;
    category: Category;
    price: number;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface DominanceData {
    btcDominance: number;
    trend: DominanceTrend;
    change24h: number;
    usdDominance: number;
    bitcoinCap: number;
    stablecoinCap: number;
    totalCryptoCap: number;
    timestamp: bigint;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export type SubscriptionStatus = {
    __kind__: "active";
    active: {
        expiresAt?: bigint;
    };
} | {
    __kind__: "canceled";
    canceled: {
        canceledAt?: bigint;
    };
} | {
    __kind__: "expired";
    expired: {
        lastActive?: bigint;
    };
} | {
    __kind__: "pending";
    pending: {
        startedAt?: bigint;
    };
};
export interface PaymentConfig {
    method: PaymentMethod;
    description: string;
    enabled: boolean;
    priceUsd: number;
    planType: PlanType;
}
export interface AdminAuditEntry {
    action: string;
    admin: Principal;
    timestamp: bigint;
    details: string;
}
export interface TelegramPostLog {
    admin: Principal;
    messagePreview: string;
    errorDetails?: string;
    httpStatusCode?: bigint;
    timestamp: bigint;
    success: boolean;
}
export interface FlowMetrics {
    direction: string;
    volumeStrength: number;
    threshold: string;
    netFlow: number;
    percentageChange: number;
    totalFlow: number;
    inflow: number;
    hasStrongConfluence: boolean;
    outflow: number;
    intensity: string;
}
export interface CryptoAsset {
    region: Region;
    openInterestMomentum: OpenInterestMomentum;
    volatility: number;
    institutionalCriteria: InstitutionalCriteria;
    volumeStrength: VolumeStrength;
    volumeMarketCapRatio: number;
    marketCap: number;
    name: string;
    percentageChange: number;
    correlation: number;
    description: string;
    volume: number;
    openInterest: number;
    momentum: number;
    isInstitutionalSetup: boolean;
    openInterestStatus: string;
    hasStrongConfluence: boolean;
    confluenceScore: number;
    price: number;
    rsiTrend: RsiTrend;
    hasConfluence: boolean;
    rsiValue: number;
    recommendationScore: number;
    rsiStatus: string;
    symbol: string;
    setupNarrative: string;
    earlyConfluence: EarlyConfluence;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface EarlyConfluence {
    probability: number;
    volumeSpike: boolean;
    patternFormation: boolean;
    signalStrength: string;
    projectedReversal: boolean;
    timingEstimate: number;
    isEarlyConfirmed: boolean;
    rsiMomentum: boolean;
    institutionalVolume: boolean;
    confluenceLabel: string;
    confluenceScore: number;
    shortIntervalSignal: boolean;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TelegramPostResult {
    resultMessage: string;
    messageId?: bigint;
    errorDetails?: string;
    httpStatusCode?: bigint;
    isSuccess: boolean;
}
export interface InstitutionalCriteria {
    hasOb: boolean;
    hasDisplacement: boolean;
    hasFvg: boolean;
    hasManipulation: boolean;
    hasInstitutionalTarget: boolean;
    hasMitigation: boolean;
    hasChoch: boolean;
    hasLiquidity: boolean;
}
export interface UserProfile {
    name: string;
    createdAt: bigint;
    email?: string;
}
export enum Category {
    btc = "btc",
    eth = "eth",
    altcoins = "altcoins"
}
export enum DominanceTrend {
    up = "up",
    steady = "steady",
    down = "down"
}
export enum OpenInterestMomentum {
    steady = "steady",
    decreasing = "decreasing",
    increasing = "increasing"
}
export enum PaymentMethod {
    icp = "icp",
    stripe = "stripe",
    stablecoin = "stablecoin"
}
export enum PlanType {
    lifetime = "lifetime",
    weekly = "weekly"
}
export enum Region {
    usa = "usa",
    europe = "europe",
    brasil = "brasil",
    other = "other",
    asia = "asia",
    arabia = "arabia",
    india = "india",
    africa = "africa"
}
export enum RsiTrend {
    steady = "steady",
    rising = "rising",
    falling = "falling"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VolumeStrength {
    low = "low",
    veryHigh = "veryHigh",
    high = "high",
    extreme = "extreme",
    medium = "medium"
}
export interface backendInterface {
    activateSubscription(planType: PlanType, paymentId: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelSubscription(): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createIcpPayment(planType: PlanType): Promise<string>;
    createStablecoinPayment(planType: PlanType): Promise<string>;
    getAdminAuditLog(limit: bigint): Promise<Array<AdminAuditEntry>>;
    getAssetAnalysis(_symbol: string): Promise<CryptoAsset | null>;
    getAssetChartData(_symbol: string, _interval: string): Promise<Array<number>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategoryMetrics(): Promise<Array<CategoryMetrics>>;
    getChapter(number: bigint): Promise<Chapter | null>;
    getDominanceAlerts(_threshold: number): Promise<Array<{
        dominanceValue: number;
        message: string;
        dominanceType: string;
        timestamp: bigint;
    }>>;
    getDominanceComparison(): Promise<{
        btcDominance: number;
        usdDominance: number;
        dominanceRatio: number;
        relativeStrength: string;
    } | null>;
    getDominanceData(): Promise<Array<DominanceData>>;
    getIntelligentRecommendations(): Promise<Array<CryptoAsset>>;
    getLatestDominanceMetrics(): Promise<{
        btcDominance: number;
        usdDominance: number;
        bitcoinCap: number;
        stablecoinCap: number;
        totalCryptoCap: number;
        timestamp: bigint;
    } | null>;
    getPaymentConfiguration(method: PaymentMethod, planType: PlanType): Promise<PaymentConfig | null>;
    getPaymentTransaction(transactionId: string): Promise<PaymentTransaction | null>;
    getStripeConfiguration(): Promise<StripeConfigurationPublic>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getSubscription(): Promise<Subscription | null>;
    getTelegramPostLog(limit: bigint): Promise<Array<TelegramPostLog>>;
    getThreeMinuteTimeframe(): Promise<string>;
    getTopCapitalFlowProportionalToMarketCap(_limit: bigint): Promise<Array<{
        usdInflow: number;
        marketCap: number;
        proportionalFlow: number;
        symbol: string;
    }>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserSubscription(user: Principal): Promise<Subscription | null>;
    hasPremiumAccess(user: Principal): Promise<boolean>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listAllSubscriptions(): Promise<Array<Subscription>>;
    listAllUserProfiles(): Promise<Array<UserProfile>>;
    listChapters(): Promise<Array<{
        title: string;
        number: bigint;
    }>>;
    listPaymentConfigurations(): Promise<Array<PaymentConfig>>;
    listPaymentTransactions(): Promise<Array<PaymentTransaction>>;
    ping(): Promise<string>;
    recordPaymentTransaction(transaction: PaymentTransaction): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchByKeyword(keyword: string): Promise<Array<Chapter>>;
    sendTelegramPost(message: string): Promise<TelegramPostResult>;
    setPaymentConfiguration(config: PaymentConfig): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateSubscription(subscription: Subscription): Promise<void>;
}
