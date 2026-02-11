import OutCall "http-outcalls/outcall";
import Registry "blob-storage/registry";
import BlobStorage "blob-storage/Mixin";
import Stripe "stripe/stripe";
import AccessControl "authorization/access-control";
import OrderedMap "mo:base/OrderedMap";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";
import Float "mo:base/Float";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Char "mo:base/Char";




actor CryptoCollieCapitalFlow {
    transient let textMap = OrderedMap.Make<Text>(Text.compare);
    transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
    transient let natMap = OrderedMap.Make<Nat>(Nat.compare);

    let registry = Registry.new();
    include BlobStorage(registry);

    var creatorPrincipal : ?Principal = null;
    let accessControlState = AccessControl.initState();

    var capitalFlowData = textMap.empty<[CryptoAsset]>();
    var lastUpdateTime : Int = 0;
    var marketHoursData = textMap.empty<MarketHours>();
    var arrowAnimationState = textMap.empty<ArrowState>();
    var realCapitalFlowData = textMap.empty<Float>();
    var symbolsBTCUSDT = textMap.empty<Float>();
    var symbolsETHUSDT = textMap.empty<Float>();
    var symbolsALTUSDT = textMap.empty<Float>();

    var trendingAssets = natMap.empty<Text>();
    var trendingAssetsBTCUSDT = natMap.empty<Text>();
    var trendingAssetsETHUSDT = natMap.empty<Text>();
    var trendingAssetsALTUSDT = natMap.empty<Text>();

    var paymentConfigurations = textMap.empty<PaymentConfig>();
    var paymentTransactions = textMap.empty<PaymentTransaction>();
    var userProfiles = principalMap.empty<UserProfile>();
    var userSubscriptions = principalMap.empty<Subscription>();
    var stripeConfiguration : ?Stripe.StripeConfiguration = null;
    var adminAuditLog = natMap.empty<AdminAuditEntry>();
    var auditLogCounter : Nat = 0;
    var telegramPostLog = natMap.empty<TelegramPostLog>();
    var telegramPostCounter : Nat = 0;
    var lastDominanceUpdateTime : Int = 0;

    let telegramBotToken : Text = "8564030706:AAGlycTPix1dH86UIsFuS1QgQnpA8zvNFAw";
    let telegramChannelId : Text = "-1003579818127";

    type InstitutionalCriteria = {
        hasLiquidity : Bool;
        hasManipulation : Bool;
        hasChoch : Bool;
        hasOb : Bool;
        hasFvg : Bool;
        hasMitigation : Bool;
        hasDisplacement : Bool;
        hasInstitutionalTarget : Bool;
    };

    type UserProfile = {
        name : Text;
        email : ?Text;
        createdAt : Int;
    };

    type Category = { #btc; #eth; #altcoins };

    type CategoryMetrics = {
        category : Category;
        name : Text;
        flowMetrics : FlowMetrics;
        price : Float;
        volume : Float;
        marketCap : Float;
        trend : Text;
    };

    type FlowMetrics = {
        totalFlow : Float;
        inflow : Float;
        outflow : Float;
        netFlow : Float;
        percentageChange : Float;
        volumeStrength : Float;
        hasStrongConfluence : Bool;
        intensity : Text;
        direction : Text;
        threshold : Text;
    };

    type CryptoAsset = {
        name : Text;
        symbol : Text;
        volume : Float;
        price : Float;
        percentageChange : Float;
        marketCap : Float;
        volumeMarketCapRatio : Float;
        description : Text;
        momentum : Float;
        volatility : Float;
        correlation : Float;
        confluenceScore : Float;
        hasConfluence : Bool;
        region : Region;
        rsiValue : Float;
        rsiTrend : RsiTrend;
        openInterest : Float;
        openInterestMomentum : OpenInterestMomentum;
        volumeStrength : VolumeStrength;
        recommendationScore : Float;
        hasStrongConfluence : Bool;
        rsiStatus : Text;
        openInterestStatus : Text;
        institutionalCriteria : InstitutionalCriteria;
        isInstitutionalSetup : Bool;
        setupNarrative : Text;
        earlyConfluence : EarlyConfluence;
    };

    type Region = {
        #usa;
        #asia;
        #europe;
        #brasil;
        #india;
        #arabia;
        #africa;
        #other;
    };

    type RsiTrend = {
        #rising;
        #falling;
        #steady;
    };

    type OpenInterestMomentum = {
        #increasing;
        #decreasing;
        #steady;
    };

    type VolumeStrength = {
        #high;
        #medium;
        #low;
        #veryHigh;
        #extreme;
    };

    type MarketSession = {
        name : Text;
        region : Region;
        openTimeBrt : Int;
        closeTimeBrt : Int;
        openStatus : Text;
        closeStatus : Text;
        preMarketStatus : Text;
        afterHoursStatus : Text;
    };

    type MarketHours = {
        region : Region;
        openTime : Int;
        closeTime : Int;
        status : Text;
    };

    type FlowDirection = {
        #usdToBtc;
        #btcToUsd;
        #usdToEth;
        #ethToUsd;
        #usdToAltcoins;
        #altcoinsToUsd;
        #altcoinsToBtc;
        #btcToAltcoins;
        #other;
    };

    type ArrowState = {
        position : Float;
        speed : Float;
        direction : FlowDirection;
        lastUpdate : Int;
    };

    type PaymentMethod = {
        #icp;
        #stablecoin;
        #stripe;
    };

    type PlanType = {
        #weekly;
        #lifetime;
    };

    type SubscriptionStatus = {
        #active : { expiresAt : ?Int };
        #expired : { lastActive : ?Int };
        #pending : { startedAt : ?Int };
        #canceled : { canceledAt : ?Int };
    };

    type PaymentConfig = {
        method : PaymentMethod;
        planType : PlanType;
        priceUsd : Float;
        description : Text;
        enabled : Bool;
    };

    type EarlyConfluence = {
        shortIntervalSignal : Bool;
        rsiMomentum : Bool;
        volumeSpike : Bool;
        patternFormation : Bool;
        confluenceScore : Float;
        institutionalVolume : Bool;
        signalStrength : Text;
        projectedReversal : Bool;
        confluenceLabel : Text;
        timingEstimate : Float;
        probability : Float;
        isEarlyConfirmed : Bool;
    };

    type PaymentTransaction = {
        transactionId : Text;
        method : PaymentMethod;
        planType : PlanType;
        amountUsd : Float;
        user : Principal;
        status : Text;
        createdAt : Int;
        updatedAt : ?Int;
    };

    type Subscription = {
        user : Principal;
        planType : PlanType;
        status : SubscriptionStatus;
        lastPaymentId : ?Text;
        createdAt : Int;
        updatedAt : ?Int;
    };

    type StripeConfigurationPublic = {
        allowedCountries : [Text];
        isConfigured : Bool;
    };

    type TelegramPostResult = {
        isSuccess : Bool;
        messageId : ?Int;
        resultMessage : Text;
        httpStatusCode : ?Nat;
        errorDetails : ?Text;
    };

    type AdminAuditEntry = {
        timestamp : Int;
        admin : Principal;
        action : Text;
        details : Text;
    };

    type TelegramPostLog = {
        timestamp : Int;
        admin : Principal;
        messagePreview : Text;
        success : Bool;
        httpStatusCode : ?Nat;
        errorDetails : ?Text;
    };

    type Candle = {
        timestamp : Int;
        open : Float;
        high : Float;
        low : Float;
        close : Float;
    };

    type Pattern = {
        #engulfing;
        #pinBar;
        #liquiditySweep;
        #bosChoch;
        #fvg;
        #supplyDemand;
        #forceCandle;
    };

    type PatternResult = {
        pattern : Pattern;
        direction : Text;
        strength : Text;
        confidence : Float;
        detectedAt : Int;
        contextualReason : Text;
        expectedMovement : Text;
    };

    type ConfluenceResult = {
        score : Nat;
        patterns : [PatternResult];
        trendDirection : Text;
        signalStrength : Text;
        recommendation : Text;
        contextualNarrative : Text;
        confidenceLevel : Text;
    };

    type DominanceData = {
        stablecoinCap : Float;
        bitcoinCap : Float;
        totalCryptoCap : Float;
        usdDominance : Float;
        btcDominance : Float;
        timestamp : Int;
        change24h : Float;
        trend : DominanceTrend;
    };

    type DominanceTrend = {
        #up;
        #down;
        #steady;
    };

    var dominanceData : [DominanceData] = [];
    var threeMinuteFlowData : [CryptoAsset] = [];

    let defaultMarketSessions : [MarketSession] = [
        {
            name = "NYSE (EUA)";
            region = #usa;
            openTimeBrt = 11;
            closeTimeBrt = 18;
            openStatus = "Aberto";
            closeStatus = "Fechado";
            preMarketStatus = "Pré-market";
            afterHoursStatus = "After-hours";
        },
        {
            name = "NASDAQ (EUA)";
            region = #usa;
            openTimeBrt = 11;
            closeTimeBrt = 18;
            openStatus = "Aberto";
            closeStatus = "Fechado";
            preMarketStatus = "Pré-market";
            afterHoursStatus = "After-hours";
        },
        {
            name = "LSE (Reino Unido)";
            region = #europe;
            openTimeBrt = 4;
            closeTimeBrt = 12;
            openStatus = "Aberto";
            closeStatus = "Fechado";
            preMarketStatus = "Pré-market";
            afterHoursStatus = "After-hours";
        },
        {
            name = "B3 (Brasil)";
            region = #brasil;
            openTimeBrt = 10;
            closeTimeBrt = 17;
            openStatus = "Aberto";
            closeStatus = "Fechado";
            preMarketStatus = "Pré-market";
            afterHoursStatus = "After-hours";
        },
        {
            name = "NSE (Índia)";
            region = #india;
            openTimeBrt = 1;
            closeTimeBrt = 9;
            openStatus = "Aberto";
            closeStatus = "Fechado";
            preMarketStatus = "Pré-market";
            afterHoursStatus = "After-hours";
        },
        {
            name = "Tadawul (Arábia Saudita)";
            region = #arabia;
            openTimeBrt = 5;
            closeTimeBrt = 10;
            openStatus = "Aberto";
            closeStatus = "Fechado";
            preMarketStatus = "Pré-market";
            afterHoursStatus = "After-hours";
        },
        {
            name = "JSE (África do Sul)";
            region = #africa;
            openTimeBrt = 4;
            closeTimeBrt = 12;
            openStatus = "Aberto";
            closeStatus = "Fechado";
            preMarketStatus = "Pré-market";
            afterHoursStatus = "After-hours";
        },
    ];

    func logAdminAction(admin : Principal, action : Text, details : Text) {
        let entry : AdminAuditEntry = {
            timestamp = Time.now();
            admin;
            action;
            details;
        };
        adminAuditLog := natMap.put(adminAuditLog, auditLogCounter, entry);
        auditLogCounter += 1;
    };

    func logTelegramPost(admin : Principal, messagePreview : Text, success : Bool, httpStatusCode : ?Nat, errorDetails : ?Text) {
        let entry : TelegramPostLog = {
            timestamp = Time.now();
            admin;
            messagePreview;
            success;
            httpStatusCode;
            errorDetails;
        };
        telegramPostLog := natMap.put(telegramPostLog, telegramPostCounter, entry);
        telegramPostCounter += 1;
    };

    func isValidStripeKey(key : Text) : Bool {
        let chars = Text.toArray(key);
        if (chars.size() < 10) return false;

        let prefix = Text.fromArray(Array.subArray(chars, 0, 8));
        prefix == "sk_live_" or prefix == "sk_test_";
    };

    func isValidCountryCode(code : Text) : Bool {
        let chars = Text.toArray(code);
        if (chars.size() != 2) return false;

        Array.foldLeft<Char, Bool>(
            chars,
            true,
            func(acc, c) {
                acc and (Char.isUppercase(c) or Char.isLowercase(c));
            },
        );
    };

    func validateCountryCodes(countries : [Text]) : Bool {
        if (countries.size() == 0) return false;

        Array.foldLeft<Text, Bool>(
            countries,
            true,
            func(acc, country) {
                acc and isValidCountryCode(country);
            },
        );
    };

    func isValidTelegramBotToken(token : Text) : Bool {
        let parts = Iter.toArray(Text.split(token, #char(':')));
        if (parts.size() != 2) return false;

        let idLength = Text.size(parts[0]);
        let secretLength = Text.size(parts[1]);
        idLength > 3 and secretLength > 8;
    };

    func isValidTelegramChannelId(id : Text) : Bool {
        let trimmedId = Text.trimStart(id, #char('-'));
        switch (Nat.fromText(trimmedId)) {
            case (?_value) { true };
            case null { false };
        };
    };

    func isMessageContentValid(message : Text) : Bool {
        let trimmed = Text.trim(message, #text(" \t\n\r"));
        Text.size(trimmed) > 0;
    };

    func sanitizeMessageContent(message : Text) : Text {
        let maxLength = 4096;
        let trimmed = Text.trim(message, #text(" \t\n\r"));

        if (Text.size(trimmed) == 0) {
            return "";
        };

        if (Text.size(trimmed) > maxLength) {
            let chars = Text.toArray(trimmed);
            Text.fromArray(Array.subArray(chars, 0, maxLength));
        } else {
            trimmed;
        };
    };

    func checkTelegramRateLimit(admin : Principal) : Bool {
        let now = Time.now();
        let oneHourAgo = now - 3_600_000_000_000;

        var recentPosts = 0;
        for ((_, entry) in natMap.entries(telegramPostLog)) {
            if (entry.admin == admin and entry.timestamp > oneHourAgo) {
                recentPosts += 1;
            };
        };

        recentPosts < 10;
    };

    func parseHttpStatusFromResponse(response : Text) : ?Nat {
        if (Text.contains(response, #text("\"ok\":true"))) {
            return ?200;
        };
        if (Text.contains(response, #text("\"error_code\":400"))) {
            return ?400;
        };
        if (Text.contains(response, #text("\"error_code\":401"))) {
            return ?401;
        };
        if (Text.contains(response, #text("\"error_code\":403"))) {
            return ?403;
        };
        if (Text.contains(response, #text("\"error_code\":429"))) {
            return ?429;
        };
        if (Text.contains(response, #text("\"error_code\":500"))) {
            return ?500;
        };
        null;
    };

    func categorizeErrorMessage(response : Text, statusCode : ?Nat) : Text {
        switch (statusCode) {
            case (?400) {
                if (Text.contains(response, #text("chat not found")) or Text.contains(response, #text("chat_not_found"))) {
                    return "Chat não encontrado";
                };
                if (Text.contains(response, #text("message")) and Text.contains(response, #text("invalid"))) {
                    return "Formato de mensagem inválido";
                };
                return "Erro de requisição: " # response;
            };
            case (?401) {
                return "Token inválido";
            };
            case (?403) {
                return "Permissões insuficientes";
            };
            case (?429) {
                return "Limite de taxa excedido";
            };
            case (?500) {
                return "Erro interno do Telegram";
            };
            case (_) {
                if (Text.contains(response, #text("error"))) {
                    return "Erro de conexão: " # response;
                };
                return "Erro desconhecido";
            };
        };
    };

    func safeSub(a : Nat, b : Nat) : Nat {
        if (a < b) { 0 } else { a - b };
    };

    func isCreator(caller : Principal) : Bool {
        switch (creatorPrincipal) {
            case (?creator) { Principal.equal(creator, caller) };
            case null { false };
        };
    };

    func requireCreatorAccess(caller : Principal) {
        if (not isCreator(caller)) {
            Debug.trap("Acesso restrito: Apenas o criador pode acessar esta funcionalidade");
        };
    };

    func requireAdminAccess(caller : Principal) {
        if (not (isCreator(caller) or AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Acesso restrito: Apenas administradores podem acessar esta funcionalidade");
        };
    };

    func requireAuthentication(caller : Principal) {
        if (Principal.isAnonymous(caller)) {
            Debug.trap("Acesso restrito: Autenticação necessária");
        };
    };

    func requirePremiumAccess(caller : Principal) {
        if (isCreator(caller)) {
            return;
        };

        if (AccessControl.isAdmin(accessControlState, caller)) {
            return;
        };

        if (Principal.isAnonymous(caller)) {
            Debug.trap("Acesso restrito: Autenticação necessária para acessar recursos premium");
        };

        if (not hasActiveSubscription(caller)) {
            Debug.trap("Acesso restrito: Assinatura ativa necessária para acessar recursos premium");
        };
    };

    func hasActiveSubscription(caller : Principal) : Bool {
        if (isCreator(caller)) {
            return true;
        };

        if (AccessControl.isAdmin(accessControlState, caller)) {
            return true;
        };

        switch (principalMap.get(userSubscriptions, caller)) {
            case (?subscription) {
                switch (subscription.status) {
                    case (#active { expiresAt }) {
                        switch (expiresAt) {
                            case (?expiry) {
                                let now = Time.now();
                                expiry > now;
                            };
                            case null { true };
                        };
                    };
                    case (#pending { startedAt }) { false };
                    case (#expired { lastActive }) { false };
                    case (#canceled { canceledAt }) { false };
                };
            };
            case null { false };
        };
    };

    public shared ({ caller }) func initializeAccessControl() : async () {
        if (creatorPrincipal == null) {
            creatorPrincipal := ?caller;
            Debug.print("Permanent creator principal set: " # Principal.toText(caller));
        };

        AccessControl.initialize(accessControlState, caller);
        Debug.print("AccessControl initialized for: " # Principal.toText(caller));
    };

    public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
        requireAuthentication(caller);

        if (isCreator(caller)) {
            return #admin;
        };
        AccessControl.getUserRole(accessControlState, caller);
    };

    public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
        requireAuthentication(caller);
        AccessControl.assignRole(accessControlState, caller, user, role);
    };

    public query ({ caller }) func isCallerAdmin() : async Bool {
        requireAuthentication(caller);

        if (isCreator(caller)) {
            return true;
        };
        AccessControl.isAdmin(accessControlState, caller);
    };

    public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
        requireAuthentication(caller);
        principalMap.get(userProfiles, caller);
    };

    public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
        requireAuthentication(caller);

        if (isCreator(caller) or AccessControl.isAdmin(accessControlState, caller)) {
            return principalMap.get(userProfiles, user);
        };

        if (caller != user) {
            Debug.trap("Acesso restrito: Você só pode visualizar seu próprio perfil");
        };
        principalMap.get(userProfiles, user);
    };

    public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
        requireAuthentication(caller);
        userProfiles := principalMap.put(userProfiles, caller, profile);
    };

    public query ({ caller }) func listAllUserProfiles() : async [UserProfile] {
        requireAdminAccess(caller);
        Iter.toArray(principalMap.vals(userProfiles));
    };

    public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
        requireCreatorAccess(caller);

        if (not isValidStripeKey(config.secretKey)) {
            Debug.trap("Erro de validação: Chave secreta do Stripe inválida. Deve começar com sk_live_ ou sk_test_");
        };

        if (not validateCountryCodes(config.allowedCountries)) {
            Debug.trap("Erro de validação: Códigos de país inválidos. Use códigos ISO de 2 letras separados por vírgula (ex: BR,US,PT)");
        };

        stripeConfiguration := ?config;
        logAdminAction(caller, "setStripeConfiguration", "Stripe configuration updated");
    };

    public query ({ caller }) func getStripeConfiguration() : async StripeConfigurationPublic {
        requireCreatorAccess(caller);

        switch (stripeConfiguration) {
            case (?config) {
                {
                    allowedCountries = config.allowedCountries;
                    isConfigured = true;
                };
            };
            case null {
                {
                    allowedCountries = [];
                    isConfigured = false;
                };
            };
        };
    };

    public query ({ caller }) func isStripeConfigured() : async Bool {
        requireAuthentication(caller);
        stripeConfiguration != null;
    };

    func urlEncode(text : Text) : Text {
        let chars = Text.toArray(text);
        var encoded = Text.toArray("");
        var i = 0;
        while (i < chars.size()) {
            let c = chars[i];
            if (c == ' ') {
                encoded := Array.append(encoded, Text.toArray("+"));
            } else if (c == '\n') {
                encoded := Array.append(encoded, Text.toArray("%0A"));
            } else if (c == '\r') {
                encoded := Array.append(encoded, Text.toArray("%0D"));
            } else if (c == '&') {
                encoded := Array.append(encoded, Text.toArray("%26"));
            } else if (c == '=') {
                encoded := Array.append(encoded, Text.toArray("%3D"));
            } else if (c == '+') {
                encoded := Array.append(encoded, Text.toArray("%2B"));
            } else if (c == '#') {
                encoded := Array.append(encoded, Text.toArray("%23"));
            } else if (c == '<') {
                encoded := Array.append(encoded, Text.toArray("%3C"));
            } else if (c == '>') {
                encoded := Array.append(encoded, Text.toArray("%3E"));
            } else {
                encoded := Array.append(encoded, Text.toArray(Char.toText(c)));
            };
            i += 1;
        };
        Text.fromArray(encoded);
    };

    func generateFallbackMessage() : Text {
        "⚠️ Nenhuma recomendação disponível no momento. Dados em atualização.";
    };

    func validateTelegramFields(chatId : Text, text : Text, parseMode : Text) : Bool {
        if (Text.size(chatId) == 0) {
            Debug.print("Telegram validation failed: chat_id is empty");
            return false;
        };
        if (not isValidTelegramChannelId(chatId)) {
            Debug.print("Telegram validation failed: chat_id format is invalid");
            return false;
        };

        let trimmedText = Text.trim(text, #text(" \t\n\r"));
        if (Text.size(trimmedText) == 0) {
            Debug.print("Telegram validation failed: text is empty");
            return false;
        };

        if (parseMode != "HTML" and parseMode != "Markdown" and parseMode != "MarkdownV2") {
            Debug.print("Telegram validation failed: parse_mode is invalid");
            return false;
        };

        true;
    };

    public shared ({ caller }) func sendTelegramPost(message : Text) : async TelegramPostResult {
        requireAdminAccess(caller);

        if (not checkTelegramRateLimit(caller)) {
            Debug.trap("Erro: Limite de taxa excedido. Máximo de 10 posts por hora");
        };

        var sanitizedMessage = sanitizeMessageContent(message);

        if (not isMessageContentValid(sanitizedMessage)) {
            sanitizedMessage := generateFallbackMessage();
            Debug.print("Telegram: Mensagem vazia detectada, usando fallback");
        };

        let messagePreview = if (Text.size(sanitizedMessage) > 100) {
            let chars = Text.toArray(sanitizedMessage);
            Text.fromArray(Array.subArray(chars, 0, 100)) # "...";
        } else {
            sanitizedMessage;
        };

        if (not validateTelegramFields(telegramChannelId, sanitizedMessage, "HTML")) {
            let errorMessage = "Erro de validação: Campos obrigatórios inválidos";
            logTelegramPost(caller, messagePreview, false, null, ?errorMessage);
            logAdminAction(caller, "sendTelegramPost", "Failed validation: " # errorMessage);
            return {
                isSuccess = false;
                messageId = null;
                resultMessage = errorMessage;
                httpStatusCode = null;
                errorDetails = ?errorMessage;
            };
        };

        let apiUrl = "https://api.telegram.org/bot" # telegramBotToken # "/sendMessage";
        let encodedChannelId = urlEncode(telegramChannelId);
        let encodedMessage = urlEncode(sanitizedMessage);

        let body = "chat_id=" # encodedChannelId # "&text=" # encodedMessage # "&parse_mode=HTML";

        Debug.print("Telegram API Request - URL: " # apiUrl);
        Debug.print("Telegram API Request - Channel ID: " # telegramChannelId);
        Debug.print("Telegram API Request - Message Preview: " # messagePreview);
        Debug.print("Telegram API Request - Body Length: " # Nat.toText(Text.size(body)));

        try {
            let response = await OutCall.httpPostRequest(apiUrl, [], body, transform);

            Debug.print("Telegram API Response: " # response);

            let statusCode = parseHttpStatusFromResponse(response);
            let success = Text.contains(response, #text("\"ok\":true"));

            Debug.print("Telegram API Status Code: " # (switch (statusCode) {
                case (?code) { Nat.toText(code) };
                case null { "unknown" };
            }));
            Debug.print("Telegram API Success: " # (if (success) { "true" } else { "false" }));

            if (success) {
                logTelegramPost(caller, messagePreview, true, statusCode, null);
                logAdminAction(caller, "sendTelegramPost", "Successfully sent Telegram post to channel: " # telegramChannelId);
                {
                    isSuccess = true;
                    messageId = null;
                    resultMessage = "Mensagem enviada com sucesso";
                    httpStatusCode = statusCode;
                    errorDetails = null;
                };
            } else {
                let errorMessage = categorizeErrorMessage(response, statusCode);
                logTelegramPost(caller, messagePreview, false, statusCode, ?errorMessage);
                logAdminAction(caller, "sendTelegramPost", "Failed to send Telegram post: " # errorMessage # " | Response: " # response);
                {
                    isSuccess = false;
                    messageId = null;
                    resultMessage = errorMessage;
                    httpStatusCode = statusCode;
                    errorDetails = ?response;
                };
            };
        } catch (e) {
            let errorMessage = "Erro de conexão ao enviar mensagem";
            logTelegramPost(caller, messagePreview, false, null, ?errorMessage);
            logAdminAction(caller, "sendTelegramPost", "Error sending Telegram post: Network error or timeout");
            Debug.print("Telegram API Error: Network error or timeout");
            {
                isSuccess = false;
                messageId = null;
                resultMessage = errorMessage;
                httpStatusCode = null;
                errorDetails = ?errorMessage;
            };
        };
    };

    public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
        OutCall.transform(input);
    };

    public query ({ caller }) func getAdminAuditLog(limit : Nat) : async [AdminAuditEntry] {
        requireAdminAccess(caller);

        let entries = Iter.toArray(natMap.vals(adminAuditLog));
        let actualLimit = if (limit > entries.size()) { entries.size() } else { limit };
        let startIdx = safeSub(entries.size(), actualLimit);
        Array.tabulate<AdminAuditEntry>(
            actualLimit,
            func(i) {
                entries[startIdx + i];
            },
        );
    };

    public query ({ caller }) func getTelegramPostLog(limit : Nat) : async [TelegramPostLog] {
        requireAdminAccess(caller);

        let entries = Iter.toArray(natMap.vals(telegramPostLog));
        let actualLimit = if (limit > entries.size()) { entries.size() } else { limit };
        let startIdx = safeSub(entries.size(), actualLimit);
        Array.tabulate<TelegramPostLog>(
            actualLimit,
            func(i) {
                entries[startIdx + i];
            },
        );
    };

    public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
        requireAuthentication(caller);

        switch (stripeConfiguration) {
            case (?config) {
                await Stripe.createCheckoutSession(config, caller, items, successUrl, cancelUrl, transform);
            };
            case null {
                Debug.trap("Erro: Configuração do Stripe não definida");
            };
        };
    };

    public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
        requireAuthentication(caller);

        switch (stripeConfiguration) {
            case (?config) {
                await Stripe.getSessionStatus(config, sessionId, transform);
            };
            case null {
                Debug.trap("Erro: Configuração do Stripe não definida");
            };
        };
    };

    public shared ({ caller }) func setPaymentConfiguration(config : PaymentConfig) : async () {
        requireCreatorAccess(caller);

        let configId = Text.concat(
            switch (config.method) {
                case (#icp) { "icp_" };
                case (#stablecoin) { "stablecoin_" };
                case (#stripe) { "stripe_" };
            },
            switch (config.planType) {
                case (#weekly) { "weekly" };
                case (#lifetime) { "lifetime" };
            },
        );

        paymentConfigurations := textMap.put(paymentConfigurations, configId, config);
        logAdminAction(caller, "setPaymentConfiguration", "Updated payment config: " # configId);
    };

    public query ({ caller }) func getPaymentConfiguration(method : PaymentMethod, planType : PlanType) : async ?PaymentConfig {
        requireAuthentication(caller);

        let configId = Text.concat(
            switch (method) {
                case (#icp) { "icp_" };
                case (#stablecoin) { "stablecoin_" };
                case (#stripe) { "stripe_" };
            },
            switch (planType) {
                case (#weekly) { "weekly" };
                case (#lifetime) { "lifetime" };
            },
        );

        textMap.get(paymentConfigurations, configId);
    };

    public query ({ caller }) func listPaymentConfigurations() : async [PaymentConfig] {
        requireAdminAccess(caller);
        Iter.toArray(textMap.vals(paymentConfigurations));
    };

    public shared ({ caller }) func recordPaymentTransaction(transaction : PaymentTransaction) : async () {
        requireAuthentication(caller);

        if (transaction.user != caller and not (isCreator(caller) or AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Acesso restrito: Você só pode registrar transações de pagamento para si mesmo");
        };

        if (transaction.amountUsd <= 0.0) {
            Debug.trap("Erro de validação: O valor da transação deve ser maior que zero");
        };

        let configId = Text.concat(
            switch (transaction.method) {
                case (#icp) { "icp_" };
                case (#stablecoin) { "stablecoin_" };
                case (#stripe) { "stripe_" };
            },
            switch (transaction.planType) {
                case (#weekly) { "weekly" };
                case (#lifetime) { "lifetime" };
            },
        );

        switch (textMap.get(paymentConfigurations, configId)) {
            case (?config) {
                if (transaction.amountUsd < config.priceUsd) {
                    Debug.trap("Erro de validação: O valor da transação é menor que o preço do plano");
                };
            };
            case null {
                Debug.trap("Erro: Configuração de pagamento não encontrada para este método e plano");
            };
        };

        paymentTransactions := textMap.put(paymentTransactions, transaction.transactionId, transaction);
    };

    public query ({ caller }) func getPaymentTransaction(transactionId : Text) : async ?PaymentTransaction {
        requireAuthentication(caller);

        switch (textMap.get(paymentTransactions, transactionId)) {
            case (?transaction) {
                if (isCreator(caller) or AccessControl.isAdmin(accessControlState, caller)) {
                    return ?transaction;
                };

                if (transaction.user != caller) {
                    Debug.trap("Acesso restrito: Você só pode visualizar suas próprias transações de pagamento");
                };
                ?transaction;
            };
            case null { null };
        };
    };

    public query ({ caller }) func listPaymentTransactions() : async [PaymentTransaction] {
        requireAdminAccess(caller);
        Iter.toArray(textMap.vals(paymentTransactions));
    };

    public shared ({ caller }) func updateSubscription(subscription : Subscription) : async () {
        requireAuthentication(caller);

        if (not (isCreator(caller) or AccessControl.isAdmin(accessControlState, caller))) {
            if (subscription.user != caller) {
                Debug.trap("Acesso restrito: Você só pode atualizar sua própria assinatura");
            };
        };

        userSubscriptions := principalMap.put(userSubscriptions, subscription.user, subscription);
    };

    public query ({ caller }) func getSubscription() : async ?Subscription {
        requireAuthentication(caller);
        principalMap.get(userSubscriptions, caller);
    };

    public query ({ caller }) func getUserSubscription(user : Principal) : async ?Subscription {
        requireAuthentication(caller);

        if (isCreator(caller) or AccessControl.isAdmin(accessControlState, caller)) {
            return principalMap.get(userSubscriptions, user);
        };

        if (caller != user) {
            Debug.trap("Acesso restrito: Você só pode visualizar sua própria assinatura");
        };
        principalMap.get(userSubscriptions, user);
    };

    public query ({ caller }) func listAllSubscriptions() : async [Subscription] {
        requireAdminAccess(caller);
        Iter.toArray(principalMap.vals(userSubscriptions));
    };

    public shared ({ caller }) func activateSubscription(planType : PlanType, paymentId : Text) : async () {
        requireAuthentication(caller);

        switch (textMap.get(paymentTransactions, paymentId)) {
            case (?transaction) {
                if (not (isCreator(caller) or AccessControl.isAdmin(accessControlState, caller))) {
                    if (transaction.user != caller) {
                        Debug.trap("Acesso restrito: A transação de pagamento não pertence a você");
                    };
                };

                if (transaction.status != "completed" and transaction.status != "success") {
                    Debug.trap("Acesso restrito: O pagamento deve ser concluído antes de ativar a assinatura");
                };

                if (transaction.planType != planType) {
                    Debug.trap("Erro de validação: O tipo de plano da transação não corresponde ao tipo de plano solicitado");
                };

                let configId = Text.concat(
                    switch (transaction.method) {
                        case (#icp) { "icp_" };
                        case (#stablecoin) { "stablecoin_" };
                        case (#stripe) { "stripe_" };
                    },
                    switch (planType) {
                        case (#weekly) { "weekly" };
                        case (#lifetime) { "lifetime" };
                    },
                );

                switch (textMap.get(paymentConfigurations, configId)) {
                    case (?config) {
                        if (transaction.amountUsd < config.priceUsd) {
                            Debug.trap("Acesso restrito: O valor do pagamento é menor que o preço do plano exigido");
                        };
                    };
                    case null {
                        Debug.trap("Erro: Configuração de pagamento não encontrada para este plano");
                    };
                };

                let now = Time.now();
                let expiresAt = switch (planType) {
                    case (#weekly) {
                        ?(now + 7 * 24 * 60 * 60 * 1_000_000_000);
                    };
                    case (#lifetime) {
                        null;
                    };
                };

                let subscription = {
                    user = transaction.user;
                    planType;
                    status = #active { expiresAt };
                    lastPaymentId = ?paymentId;
                    createdAt = now;
                    updatedAt = ?now;
                };

                userSubscriptions := principalMap.put(userSubscriptions, transaction.user, subscription);
            };
            case null {
                Debug.trap("Acesso restrito: Transação de pagamento não encontrada");
            };
        };
    };

    public shared ({ caller }) func cancelSubscription() : async () {
        requireAuthentication(caller);

        switch (principalMap.get(userSubscriptions, caller)) {
            case (?subscription) {
                let now = Time.now();
                let canceledSubscription = {
                    subscription with
                    status = #canceled { canceledAt = ?now };
                    updatedAt = ?now;
                };
                userSubscriptions := principalMap.put(userSubscriptions, caller, canceledSubscription);
            };
            case null {
                Debug.trap("Erro: Nenhuma assinatura ativa encontrada");
            };
        };
    };

    public shared ({ caller }) func createIcpPayment(planType : PlanType) : async Text {
        requireAuthentication(caller);

        let configId = Text.concat("icp_", switch (planType) {
            case (#weekly) { "weekly" };
            case (#lifetime) { "lifetime" };
        });

        switch (textMap.get(paymentConfigurations, configId)) {
            case (?config) {
                if (not config.enabled) {
                    Debug.trap("Erro: O método de pagamento ICP não está habilitado para este plano");
                };
                Float.toText(config.priceUsd * 0.12345);
            };
            case null {
                Debug.trap("Erro: Configuração de pagamento não encontrada para pagamento ICP");
            };
        };
    };

    public shared ({ caller }) func createStablecoinPayment(planType : PlanType) : async Text {
        requireAuthentication(caller);

        let configId = Text.concat("stablecoin_", switch (planType) {
            case (#weekly) { "weekly" };
            case (#lifetime) { "lifetime" };
        });

        switch (textMap.get(paymentConfigurations, configId)) {
            case (?config) {
                if (not config.enabled) {
                    Debug.trap("Erro: O método de pagamento com stablecoin não está habilitado para este plano");
                };
                Float.toText(config.priceUsd);
            };
            case null {
                Debug.trap("Erro: Configuração de pagamento não encontrada para pagamento com stablecoin");
            };
        };
    };

    public query ({ caller }) func hasPremiumAccess(user : Principal) : async Bool {
        requireAuthentication(caller);

        if (caller != user and not (isCreator(caller) or AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Acesso restrito: Você só pode verificar seu próprio acesso premium");
        };

        if (isCreator(user)) {
            return true;
        };

        if (AccessControl.isAdmin(accessControlState, user)) {
            return true;
        };

        hasActiveSubscription(user);
    };

    public query ({ caller }) func getCategoryMetrics() : async [CategoryMetrics] {
        requirePremiumAccess(caller);

        let btcMetrics = calculateCategoryMetrics(#btc, "Total (BTC)");
        let ethMetrics = calculateCategoryMetrics(#eth, "Total 1 (ETH)");
        let altcoinMetrics = calculateCategoryMetrics(#altcoins, "Total 2 (Altcoins)");

        [btcMetrics, ethMetrics, altcoinMetrics];
    };

    func calculateCategoryMetrics(category : Category, name : Text) : CategoryMetrics {
        {
            category;
            name;
            flowMetrics = calculateCategoryFlowMetrics(category);
            price = 100.0;
            volume = 1000000.0;
            marketCap = 5000000.0;
            trend = "alta";
        };
    };

    func calculateCategoryFlowMetrics(_category : Category) : FlowMetrics {
        {
            totalFlow = 1000000.0;
            inflow = 600000.0;
            outflow = 400000.0;
            netFlow = 200000.0;
            percentageChange = 50.0;
            volumeStrength = 10.0;
            hasStrongConfluence = true;
            intensity = "alta";
            direction = "entrada";
            threshold = "médio";
        };
    };

    public query ({ caller }) func getIntelligentRecommendations() : async [CryptoAsset] {
        requirePremiumAccess(caller);

        let recommendations : [CryptoAsset] = [];
        Array.map<CryptoAsset, CryptoAsset>(
            recommendations,
            func(asset : CryptoAsset) : CryptoAsset {
                let criteria = asset.institutionalCriteria;
                let allCriteriaMet = criteria.hasLiquidity and criteria.hasManipulation and criteria.hasChoch and criteria.hasOb and criteria.hasFvg and criteria.hasMitigation and criteria.hasDisplacement and criteria.hasInstitutionalTarget;
                let setupNarrative = generateSetupNarrative(criteria);
                {
                    asset with
                    isInstitutionalSetup = allCriteriaMet;
                    setupNarrative;
                };
            },
        );
    };

    func generateSetupNarrative(criteria : InstitutionalCriteria) : Text {
        var narrative = "Setup Institucional: ";

        if (criteria.hasLiquidity) {
            narrative := narrative # "Liquidez ✅ ";
        } else { narrative := narrative # "Liquidez ❌ " };

        if (criteria.hasManipulation) {
            narrative := narrative # "Manipulação ✅ ";
        } else { narrative := narrative # "Manipulação ❌ " };

        if (criteria.hasChoch) {
            narrative := narrative # "CHOCH ✅ ";
        } else { narrative := narrative # "CHOCH ❌ " };

        if (criteria.hasOb) {
            narrative := narrative # "OB ✅ ";
        } else { narrative := narrative # "OB ❌ " };

        if (criteria.hasFvg) {
            narrative := narrative # "FVG ✅ ";
        } else { narrative := narrative # "FVG ❌ " };

        if (criteria.hasMitigation) {
            narrative := narrative # "Mitigação ✅ ";
        } else { narrative := narrative # "Mitigação ❌ " };

        if (criteria.hasDisplacement) {
            narrative := narrative # "Deslocamento ✅ ";
        } else { narrative := narrative # "Deslocamento ❌ " };

        if (criteria.hasInstitutionalTarget) {
            narrative := narrative # "Alvo Institucional ✅ ";
        } else { narrative := narrative # "Alvo Institucional ❌ " };

        narrative := narrative # "| Explicação Detalhada: ";
        narrative := narrative # "Esta configuração institucional foi identificada com base em oito critérios essenciais para análise profissional de mercado. ";

        if (criteria.hasLiquidity and criteria.hasManipulation and criteria.hasChoch and criteria.hasOb and criteria.hasFvg and criteria.hasMitigation and criteria.hasDisplacement and criteria.hasInstitutionalTarget) {
            narrative := narrative # "Setup completo validado. Todos os critérios atendidos.";
        } else if (criteria.hasLiquidity and criteria.hasManipulation and criteria.hasChoch and criteria.hasOb and criteria.hasFvg and criteria.hasMitigation and not criteria.hasDisplacement) {
            narrative := narrative # "Setup quase completo. Deslocamento institucional pendente de confirmação.";
        } else if (criteria.hasLiquidity and criteria.hasManipulation and criteria.hasChoch and not criteria.hasOb and not criteria.hasFvg and not criteria.hasMitigation and not criteria.hasDisplacement) {
            narrative := narrative # "Configuração parcial. Confirme OB, FVG, mitigação e deslocamento para completar o setup.";
        } else { narrative := narrative # "Setup institucional em análise. Aguarde confirmação adicional."; };

        narrative;
    };

    public query ({ caller }) func getAssetAnalysis(_symbol : Text) : async ?CryptoAsset {
        requirePremiumAccess(caller);
        null;
    };

    public query ({ caller }) func getAssetChartData(_symbol : Text, _interval : Text) : async [Float] {
        requirePremiumAccess(caller);
        [];
    };

    public query ({ caller }) func getDominanceData() : async [DominanceData] {
        requirePremiumAccess(caller);
        dominanceData;
    };

    public query ({ caller }) func getLatestDominanceMetrics() : async ?{
        stablecoinCap : Float;
        bitcoinCap : Float;
        totalCryptoCap : Float;
        usdDominance : Float;
        btcDominance : Float;
        timestamp : Int;
    } {
        requirePremiumAccess(caller);

        if (dominanceData.size() > 0) {
            ?dominanceData[dominanceData.size() - 1];
        } else {
            null;
        };
    };

    public query ({ caller }) func getDominanceComparison() : async ?{
        usdDominance : Float;
        btcDominance : Float;
        dominanceRatio : Float;
        relativeStrength : Text;
    } {
        requirePremiumAccess(caller);

        if (dominanceData.size() > 0) {
            let latest = dominanceData[dominanceData.size() - 1];
            let dominanceRatio = if (latest.btcDominance == 0.0) { 0.0 } else {
                latest.usdDominance / latest.btcDominance;
            };
            let relativeStrength = if (latest.usdDominance > latest.btcDominance) {
                "USD Dominância mais forte";
            } else if (latest.usdDominance < latest.btcDominance) {
                "BTC Dominância mais forte";
            } else { "Dominância equilibrada" };
            ?{
                usdDominance = latest.usdDominance;
                btcDominance = latest.btcDominance;
                dominanceRatio;
                relativeStrength;
            };
        } else {
            null;
        };
    };

    public query ({ caller }) func getDominanceAlerts(_threshold : Float) : async [{
        message : Text;
        dominanceType : Text;
        dominanceValue : Float;
        timestamp : Int;
    }] {
        requirePremiumAccess(caller);

        var alerts : [{
            message : Text;
            dominanceType : Text;
            dominanceValue : Float;
            timestamp : Int;
        }] = [];

        if (dominanceData.size() > 0) {
            let latest = dominanceData[dominanceData.size() - 1];
            if (dominanceData.size() > 1) {
                let previous = dominanceData[dominanceData.size() - 2];
                let usdChange = latest.usdDominance - previous.usdDominance;
                let btcChange = latest.btcDominance - previous.btcDominance;

                if (Float.abs(usdChange) >= _threshold) {
                    alerts := Array.append(alerts, [{
                        message = "Movimentação significativa na dominação USD detectada";
                        dominanceType = "USD";
                        dominanceValue = latest.usdDominance;
                        timestamp = latest.timestamp;
                    }]);
                };

                if (Float.abs(btcChange) >= _threshold) {
                    alerts := Array.append(alerts, [{
                        message = "Movimentação significativa na dominação BTC detectada";
                        dominanceType = "BTC";
                        dominanceValue = latest.btcDominance;
                        timestamp = latest.timestamp;
                    }]);
                };
            };
        };

        alerts;
    };

    type Chapter = {
        number : Nat;
        title : Text;
        content : Text;
    };

    let chapters : [Chapter] = [
        {
            number = 1;
            title = "Fundamentos de Análise Técnica";
            content = "
        # Capítulo 1: Fundamentos de Análise Técnica

        Este capítulo apresenta os princípios fundamentais da análise técnica, abordando tópicos essenciais para a compreensão gráfica dos mercados financeiros.

        - Conceitos básicos de análise técnica
        - Gráficos de velas (candlestick)
        - Identificação de tendências
        - Suportes e resistências iniciais

        Introduz os conceitos essenciais para as próximas etapas de aprendizado técnico.
      ";
        },
        {
            number = 2;
            title = "Estruturas de Mercado e Tendências";
            content = "
        # Capítulo 2: Estruturas de Mercado e Tendências

        Aborda as diferentes estruturas de mercado e como identificar tendências para operar de forma mais eficiente.

        - Tipos de tendências (alta, baixa, lateral)
        - Fases do mercado (acumulação, distribuição)
        - Confirmando tendências com volume

        Essencial para entender o contexto macro dos movimentos de preço.
      ";
        },
        {
            number = 3;
            title = "Indicadores Técnicos Essenciais";
            content = "
        # Capítulo 3: Indicadores Técnicos Essenciais

        Explora indicadores técnicos fundamentais para análise de ativos.

        - Médias Móveis (MA, EMA)
        - RSI (Índice de Força Relativa)
        - MACD
        - Bandas de Bollinger

        Ferramentas para aprimorar a precisão das análises técnicas.
      ";
        },
        {
            number = 4;
            title = "Price Action - Conceitos Fundamentais";
            content = "
        # Capítulo 4: Price Action - Conceitos Fundamentais

        Introdução aos fundamentos da análise de price action, abordando padrões de velas básicos, estrutura de mercado e princípios essenciais para entender o comportamento dos preços sem depender exclusivamente de indicadores técnicos.

        ## O que é Price Action?

        Price action é a análise do movimento puro dos preços sem depender de indicadores técnicos. Baseia-se na leitura direta dos gráficos de velas para identificar padrões, tendências e pontos de reversão.

        ## Padrões de Velas Fundamentais

        - **Velas de alta**: Corpo verde/branco indica fechamento acima da abertura
        - **Velas de baixa**: Corpo vermelho/preto indica fechamento abaixo da abertura
        - **Doji**: Abertura e fechamento praticamente iguais, indica indecisão
        - **Martelo**: Pavio longo inferior, corpo pequeno, indica possível reversão de alta
        - **Estrela cadente**: Pavio longo superior, corpo pequeno, indica possível reversão de baixa

        ## Projeções de Movimento

        A análise de price action permite projetar movimentos futuros baseados em:
        - Padrões históricos de comportamento
        - Níveis de suporte e resistência
        - Estrutura de mercado (topos e fundos)

        ## Mapeamento de Suporte e Resistência

        Identificar zonas de preço onde o ativo historicamente encontrou dificuldade para romper (resistência) ou onde encontrou suporte para não cair mais.

        Price action é a base para todas as análises avançadas de ação do preço.
      ";
        },
        {
            number = 5;
            title = "Padrões de Candlestick e Reversão";
            content = "
        # Capítulo 5: Padrões de Candlestick e Reversão

        Aborda os principais padrões de candlestick utilizados para identificar reversões e confirmações de tendência.

        ## Engolfos (Bullish/Bearish)

        - **Engolfo de alta**: Vela verde que engole completamente a vela vermelha anterior
        - **Engolfo de baixa**: Vela vermelha que engole completamente a vela verde anterior
        - Indica forte reversão de tendência

        ## Pin Bars

        - **Martelo**: Pavio longo inferior, indica rejeição de preços baixos
        - **Estrela cadente**: Pavio longo superior, indica rejeição de preços altos
        - **Shooting star**: Variação da estrela cadente com corpo menor

        ## Doji

        - Abertura e fechamento praticamente iguais
        - Indica indecisão do mercado
        - Pode preceder reversões importantes

        ## Padrões de Três Velas

        - **Três soldados brancos**: Três velas verdes consecutivas, forte alta
        - **Três corvos pretos**: Três velas vermelhas consecutivas, forte baixa
        - **Estrela da manhã**: Padrão de reversão de alta com três velas
        - **Estrela da tarde**: Padrão de reversão de baixa com três velas

        Identificar padrões de velas é fundamental para a análise price action.
      ";
        },
        {
            number = 6;
            title = "Zonas de Suporte e Resistência";
            content = "
        # Capítulo 6: Zonas de Suporte e Resistência

        Explora como identificar e validar zonas de suporte e resistência utilizando técnicas avançadas de price action e análise técnica.

        ## Determinando Zonas de Preço-Chave

        - **Suporte**: Nível de preço onde a demanda é forte o suficiente para impedir quedas
        - **Resistência**: Nível de preço onde a oferta é forte o suficiente para impedir altas
        - Identificar topos e fundos históricos
        - Zonas de consolidação prolongada

        ## Validação com Volume e Price Action

        - Confirmar zonas com aumento de volume
        - Observar rejeições repetidas em níveis específicos
        - Analisar padrões de velas em zonas-chave

        ## Psicologia por Trás de Suportes e Resistências

        - Memória do mercado sobre níveis de preço importantes
        - Ordens pendentes concentradas em níveis-chave
        - Comportamento institucional em zonas estratégicas

        ## Rompimentos e Falsos Rompimentos

        - **Breakout**: Rompimento confirmado com volume
        - **Fakeout**: Falso rompimento que retorna à zona anterior
        - Técnicas para distinguir rompimentos verdadeiros

        É essencial para a construção de estratégias robustas de trading.
      ";
        },
        {
            number = 7;
            title = "Análise de Volume e Open Interest";
            content = "
        # Capítulo 7: Análise de Volume e Open Interest

        Apresenta técnicas de análise de volume e open interest para validar movimentos de preço e identificar oportunidades de trading.

        ## Técnicas de Análise de Volume

        - **Volume crescente**: Confirma tendência em curso
        - **Volume decrescente**: Indica possível reversão ou consolidação
        - **Picos de volume**: Marcam pontos de interesse institucional
        - **Volume em rompimentos**: Valida breakouts verdadeiros

        ## Interpretação de Open Interest

        - **Open Interest crescente**: Novas posições sendo abertas
        - **Open Interest decrescente**: Posições sendo fechadas
        - Correlação entre OI e direção do preço
        - Identificar acumulação e distribuição institucional

        ## Validação de Sinais

        Combinar volume e open interest com price action para:
        - Confirmar tendências
        - Identificar reversões
        - Validar rompimentos
        - Detectar armadilhas de mercado

        ## Divergências

        - **Divergência de volume**: Preço sobe mas volume cai
        - **Divergência de OI**: Preço sobe mas OI cai
        - Indicam possível exaustão de tendência

        Volume e open interest são essenciais para confirmar tendências e identificar reversões.
      ";
        },
        {
            number = 8;
            title = "Gestão de Risco e Capital";
            content = "
        # Capítulo 8: Gestão de Risco e Capital

        Aborda os princípios fundamentais da gestão de risco e capital, essenciais para o sucesso sustentável no trading de criptomoedas.

        ## Conceitos de Risco vs. Retorno

        - **Relação risco-retorno**: Mínimo de 1:2 (arriscar 1 para ganhar 2)
        - **Risco por operação**: Máximo de 1-2% do capital total
        - **Drawdown máximo**: Limite de perda acumulada aceitável

        ## Técnicas de Gestão de Capital

        - **Position sizing**: Calcular tamanho da posição baseado no risco
        - **Diversificação**: Não concentrar capital em um único ativo
        - **Alavancagem responsável**: Usar alavancagem com cautela
        - **Reserva de emergência**: Manter capital fora do mercado

        ## Stop Loss Estratégico

        - **Stop loss técnico**: Baseado em níveis de suporte/resistência
        - **Stop loss percentual**: Baseado em percentual de perda aceitável
        - **Trailing stop**: Stop que acompanha o preço em movimentos favoráveis
        - **Stop loss mental**: Evitar, sempre usar stop automático

        ## Gerenciamento de Lucros

        - **Take profit parcial**: Realizar lucros em etapas
        - **Trailing profit**: Deixar lucros correrem com proteção
        - **Rebalanceamento**: Ajustar posições conforme mercado evolui

        Gestão de risco é o diferencial entre traders de sucesso e amadores.
      ";
        },
        {
            number = 9;
            title = "Psicologia do Trading";
            content = "
        # Capítulo 9: Psicologia do Trading

        Explora os aspectos psicológicos do trading, abordando mindset, controle emocional e disciplina operacional.

        ## Mindset de Sucesso

        - **Mentalidade de longo prazo**: Foco em consistência, não em ganhos rápidos
        - **Aceitação de perdas**: Perdas fazem parte do processo
        - **Aprendizado contínuo**: Sempre buscar evolução
        - **Paciência**: Esperar setups de alta probabilidade

        ## Controle Emocional

        - **Medo**: Pode impedir entradas em boas oportunidades
        - **Ganância**: Pode levar a overtrading e risco excessivo
        - **Vingança**: Evitar operar para recuperar perdas rapidamente
        - **Euforia**: Manter disciplina mesmo após vitórias

        ## Disciplina Operacional

        - **Seguir o plano**: Não improvisar durante operações
        - **Respeitar stop loss**: Nunca mover stop contra você
        - **Registro de operações**: Manter diário de trades
        - **Análise pós-operação**: Revisar acertos e erros

        ## Vieses Cognitivos

        - **Viés de confirmação**: Buscar apenas informações que confirmam sua visão
        - **Efeito manada**: Seguir a multidão sem análise própria
        - **Ancoragem**: Fixar-se em preços passados
        - **Overconfidence**: Excesso de confiança após vitórias

        A psicologia do trading é responsável por 80% do sucesso no mercado.
      ";
        },
        {
            number = 10;
            title = "Estratégias Avançadas de Entrada";
            content = "
        # Capítulo 10: Estratégias Avançadas de Entrada

        Apresenta estratégias avançadas de entrada com base em price action, análise técnica e confluência de sinais.

        ## Estratégias Baseadas em Price Action

        - **Entrada em rompimento**: Entrar após confirmação de breakout
        - **Entrada em reteste**: Aguardar reteste de nível rompido
        - **Entrada em reversão**: Operar reversões em zonas-chave
        - **Entrada em continuação**: Operar pullbacks em tendências

        ## Validação com Análise Técnica

        - Confirmar com indicadores (RSI, MACD, Volume)
        - Verificar confluência de múltiplos sinais
        - Analisar timeframes superiores para contexto
        - Considerar condições de mercado global

        ## Gerenciamento de Risco Avançado

        - **Entrada escalonada**: Dividir entrada em múltiplas ordens
        - **Stop loss dinâmico**: Ajustar stop conforme mercado evolui
        - **Take profit múltiplo**: Realizar lucros em diferentes níveis
        - **Hedge**: Proteger posições com operações contrárias

        ## Timing de Entrada

        - Aguardar confirmação de padrões
        - Evitar entrar em momentos de alta volatilidade
        - Considerar horários de maior liquidez
        - Respeitar zonas de suporte/resistência

        Estratégias avançadas aumentam taxa de acerto e minimizam riscos.
      ";
        },
        {
            number = 11;
            title = "Confluência e Timing de Mercado";
            content = "
        # Capítulo 11: Confluência e Timing de Mercado

        Aborda a importância da confluência de sinais e do timing de mercado para operações de alta performance.

        ## Técnicas de Confluência

        - **Confluência técnica**: Múltiplos indicadores alinhados
        - **Confluência de price action**: Vários padrões confirmando direção
        - **Confluência de timeframes**: Alinhamento entre gráficos diferentes
        - **Confluência fundamental**: Análise técnica + notícias/eventos

        ## Scoring de Confluência

        - Atribuir pontos para cada sinal confirmado
        - Operar apenas com confluência mínima (ex: 3+ sinais)
        - Ajustar tamanho de posição baseado em confluência
        - Maior confluência = maior confiança

        ## Timing de Operações

        - **Sessões de mercado**: Operar em horários de maior liquidez
        - **Eventos econômicos**: Evitar operar durante anúncios importantes
        - **Volatilidade**: Ajustar estratégia conforme volatilidade
        - **Tendência de longo prazo**: Operar a favor da tendência maior

        ## Mapeamento de Oportunidades

        - Identificar zonas de alta probabilidade
        - Aguardar confluência de sinais
        - Validar com múltiplos timeframes
        - Executar com disciplina e gestão de risco

        Confluência e timing corretos aumentam significativamente a probabilidade de sucesso.
      ";
        },
        {
            number = 12;
            title = "Análise Institucional e Fluxo de Capital";
            content = "
        # Capítulo 12: Análise Institucional e Fluxo de Capital

        Explora técnicas de análise institucional, monitoramento de fluxo de capital e estratégias avançadas para identificar movimentos de grandes players do mercado.

        ## Técnicas de Análise Institucional

        - **Order blocks**: Zonas onde instituições acumulam posições
        - **Liquidity sweeps**: Varreduras de liquidez antes de movimentos
        - **Smart money concepts**: Conceitos de dinheiro inteligente
        - **Market structure**: Análise de estrutura de mercado institucional

        ## Estratégias de Fluxo de Capital

        - **Monitoramento de volume institucional**: Identificar grandes ordens
        - **Análise de open interest**: Rastrear posições institucionais
        - **Fluxo de capital entre ativos**: Rotação setorial
        - **Acumulação e distribuição**: Detectar fases institucionais

        ## Monitoramento de Grandes Players

        - **Whale watching**: Rastrear movimentos de grandes carteiras
        - **Exchange flows**: Monitorar entradas/saídas de exchanges
        - **Funding rates**: Analisar taxas de financiamento
        - **Liquidations**: Observar liquidações em massa

        ## Indicadores Institucionais

        - **CVD (Cumulative Volume Delta)**: Delta de volume acumulado
        - **Footprint charts**: Gráficos de pegada institucional
        - **Order flow**: Fluxo de ordens em tempo real
        - **Market profile**: Perfil de mercado e zonas de valor

        ## Estratégias de Acompanhamento

        - Operar na direção do fluxo institucional
        - Aguardar confirmação de movimentos institucionais
        - Evitar operar contra grandes players
        - Aproveitar liquidações em cascata

        Análise institucional e fluxo de capital oferecem vantagem competitiva no mercado de criptomoedas.
      ";
        },
    ];

    public query ({ caller }) func listChapters() : async [{ number : Nat; title : Text }] {
        requirePremiumAccess(caller);

        Array.map<Chapter, { number : Nat; title : Text }>(
            chapters,
            func(chapter) {
                { number = chapter.number; title = chapter.title };
            },
        );
    };

    public query ({ caller }) func getChapter(number : Nat) : async ?Chapter {
        requirePremiumAccess(caller);

        for (chapter in Array.vals(chapters)) {
            if (chapter.number == number) {
                return ?chapter;
            };
        };
        null;
    };

    public query ({ caller }) func searchByKeyword(keyword : Text) : async [Chapter] {
        requirePremiumAccess(caller);

        let matches = Array.filter<Chapter>(
            chapters,
            func(chapter) {
                Text.contains(chapter.title, #text(keyword)) or Text.contains(chapter.content, #text(keyword));
            },
        );

        matches;
    };

    public query ({ caller }) func getThreeMinuteTimeframe() : async Text {
        requireAuthentication(caller);
        "3m";
    };

    public query ({ caller }) func getTopCapitalFlowProportionalToMarketCap(_limit : Nat) : async [{
        symbol : Text;
        marketCap : Float;
        usdInflow : Float;
        proportionalFlow : Float;
    }] {
        requirePremiumAccess(caller);

        var ranking : [{
            symbol : Text;
            marketCap : Float;
            usdInflow : Float;
            proportionalFlow : Float;
        }] = [];

        for (asset in Array.vals(threeMinuteFlowData)) {
            if (asset.marketCap > 0.0) {
                let proportionalFlow = asset.volume / asset.marketCap;
                ranking := Array.append(
                    ranking,
                    [{
                        symbol = asset.symbol;
                        marketCap = asset.marketCap;
                        usdInflow = asset.volume;
                        proportionalFlow;
                    }],
                );
            };
        };

        ranking;
    };

    public func ping() : async Text {
        "Crypto Collie Capital Flow backend está ativo!";
    };
};

