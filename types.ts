
// --- General App Types ---

export interface MerchantProfile {
    brandName: string;
    slug: string;
    phone: string;
    governorate: string;
    address: string;
    logoUrl: string;
    isVerified?: boolean;
    verificationType?: 'sales' | 'paid';
    storeConfig?: StoreConfig;
    storeDescription?: string;
    socialLinks?: { platform: 'facebook' | 'twitter' | 'instagram'; url: string }[];
    subscription?: AdSubscription;
    activeFeatures?: AdType[];
    countryCode?: string;
}

export interface User {
    id: string;
    name: string;
    age?: number;
    occupation?: string;
    profilePictureUrl?: string;
    role: 'Parent' | 'FamilyMember' | 'Merchant';
    isFamilyHead: boolean;
    familyId?: string;
    salary: number;
    familyMembers: number;
    priorities: string[];
    nonEssentials: string[];
    email: string;
    accountType: 'regular' | 'merchant';
    accountPlan: 'single' | 'family';
    merchantProfile?: MerchantProfile;
    contactInfo: {
        phone: string;
        address: string;
        preferredMeetup: string;
        deliveryAddress?: {
            street: string;
            city: string;
            governorate: string;
            postalCode: string;
        };
    };
    inventory: ExchangeItem[];
    orderHistory?: { productId: string; orderDate: string; }[];
    termsAcceptedVersion?: string;
    termsAcceptedAt?: string; // ISO String
    isGuest?: boolean;
    isVerified?: boolean;
    primarySpendingCategory?: string;
    currency: string;
    langCode: string;
    countryCode: string;
    referralCode?: string;
}

export interface Goal {
    id: string;
    name:string;
    targetAmount: number;
    currentAmount: number;
    investedAmount?: number;
    deadline?: string; // ISO Date string
    milestonePercentage?: number; // 0-100
    monthlyContribution?: number;
    deductionDate?: string; // Day of the month, e.g., "5"
}

export interface Family {
    id: string;
    name: string;
    members: User[];
    familyCode: string;
    password?: string;
    sharedGoals: Goal[];
}

export interface AppNotification {
    id: string;
    category: 'spending' | 'family' | 'goals' | 'investments' | 'ads';
    icon: string; // Emoji
    messageKey: string; // for i18n
    messageValues?: { [key: string]: string | number | undefined };
    timestamp: string;
}

export interface SmartNotification {
    id: string;
    title: string;
    message: string;
    type: "alert" | "tip" | "goal" | "security" | "ai_suggestion";
    date: string; // ISO string
    read: boolean;
    icon: string; // Emoji or Heroicon name
}


export interface BudgetCategory {
    id: string;
    name: string;
    icon: string;
    allocated: number; // percentage
    spent: number; // amount
}

export interface MerchantInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  city: string;
  rating: number;
  deliveryDays: number;
  isVerified: boolean;
}

export interface Product {
    id: string;
    title: string;
    price: number;
    originalPrice?: number;
    status?: 'published' | 'draft';
    createdAt: string; // ISO String
    merchant: string;
    imageUrl: string;
    category: string;
    stock: number;
    ownerId: string;
    ownerName: string;
    condition: 'New' | 'Like New' | 'Good' | 'Used';
    isDropshipped?: boolean;
    source?: 'aliexpress';
    sourcePrice?: number;
    merchantInfo?: MerchantInfo;
    description?: string; // Optional detailed description
    images?: string[]; // Optional additional images
    isFeatured?: boolean; // For highlighted ads
    publishDate?: string; // For scheduling
    endDate?: string;     // For scheduling
    isTrending?: boolean;
    isHotDeal?: boolean;
}

export type InvestmentType = 'Stock' | 'ETF' | 'Crypto' | 'Bond' | 'Commodity' | 'Real Estate' | 'Venture Capital';

export interface InvestmentOption {
    id: string;
    name: string;
    ticker: string;
    type: InvestmentType;
    risk: 'Low' | 'Medium' | 'High';
    price: number;
    marketCap: number;
    ytdReturn: number; // as a percentage, e.g., 15.5 for 15.5%
    volatility: number; // as a percentage, e.g., 2.3 for 2.3%
    sector: string;
    description: string;
    country: string;
    imageUrl: string;
    recommendationScore: number; // A score from 0-100 for sorting
    recommendedReason: string;
    estimatedRoi: string;
    aiInsight: string;
}


export type OrderStatus = 'pending-payment' | 'paid-awaiting-fulfillment' | 'shipped' | 'in-transit' | 'completed' | 'cancelled' | 'disputed' | 'refunded';

export interface Order {
    id: string;
    customerName: string;
    customerEmail: string;
    items: { productId: string, title: string, quantity: number, price: number }[];
    total: number;
    status: OrderStatus;
    createdAt: string;
    updatedAt: string;
    trackingNumber?: string;
    commission?: number;
    merchantPayout?: number;
    isDropshipped?: boolean;
    estimatedDeliveryAt?: string; // ISO Date String
    statusHistory?: { status: OrderStatus; timestamp: string; note?: string }[];
    deliveryAddress?: { street: string; city: string; governorate: string; postalCode: string; };
}

export type PaymentRecordType = 'Subscription' | 'Verification' | 'Ad Campaign' | 'Order' | 'Goal Contribution';
export type PaymentStatus = 'Completed' | 'Pending' | 'Failed';

export interface PaymentRecord {
    id: string;
    date: string; // ISO string
    amount: number;
    type: PaymentRecordType;
    status: PaymentStatus;
    description: string;
    referenceId?: string; // e.g., orderId, subscriptionId
    paymentMethod?: string;
}


export interface Merchant {
    id: string;
    userId: string;
    storeName: string;
    businessType: string;
    storeStatus?: 'active' | 'inactive';
    products: Product[];
    orders: Order[];
    slug: string;
    logoUrl: string;
    coverUrl: string;
    city: string;
    rating: number;
    followersCount: number;
    isVerified: boolean;
    faqSheet?: { question: string; answer: string }[];
    settings?: {
        autoReplyOn: boolean;
    };
    storeConfig?: StoreConfig;
    storeDescription?: string;
    socialLinks?: { platform: 'facebook' | 'twitter' | 'instagram'; url: string }[];
}

export interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: string;
    lang: string;
}

export interface ExchangeItem {
    id: string;
    ownerId: string;
    ownerName: string;
    title: string;
    imageUrl: string;
    quantity: number;
    condition: 'New' | 'Like New' | 'Good' | 'Used';
    description: string;
    wantedItems: string;
    location: string;
    ownerCountryCode: string;
    ownerCountryFlag: string;
    est_value: number;
    category: string;
    expiresAt: string; // ISO String
    type: 'item' | 'crypto' | 'currency';
    popularityScore: number;
}

// --- Cart & Favourites ---
export interface CartItem {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    quantity: number;
}

export interface FavouriteItem {
    productId: string;
    name: string;
    price: number;
    imageUrl: string;
    addedAt: string;
}

// --- Marketplace Ads ---
export type AdType = 'banner' | 'product' | 'video' | 'carousel' | 'store_feature';
export type AdStatus = 'active' | 'expired' | 'paused';
export type AdPlanId = 'basic' | 'pro' | 'premium';

export interface AdSubscription {
    planId: AdPlanId;
    name: string;
    price: number;
    startDate: string; // ISO Date
    endDate: string; // ISO Date
    autoRenews: boolean;
}

export interface MerchantAd {
    id: string;
    merchantId: string;
    adType: AdType;
    status: AdStatus;
    createdAt: string; // ISO Date
    expiresAt: string; // ISO Date
    content: {
        productId?: string;
        imageUrl?: string;
        videoUrl?: string;
        carouselImages?: string[];
        caption?: string;
        link: string;
    };
    budget: number; // USD
    durationDays?: number; // 1, 7, 30
    // Analytics
    clicks: number;
    impressions: number;
    ctr: number;
    conversions: number;
    reachEstimate?: number;
    engagementScore: number;
}

// --- Family Purchase Requests ---
export interface PurchaseRequest {
  id: string;
  familyId: string;
  guestId: string;
  guestName: string;
  productId: string;
  productTitle: string;
  productImageUrl: string;
  productPrice: number;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // ISO String
  reviewedBy?: string; // parent's name
  reviewedAt?: string; // ISO String
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'one-time';
  icon: string;
}

// --- Dashboard Transactions ---
export interface Transaction {
  id: string;
  description: string;
  amount: number; // positive for income, negative for expense
  date: string; // ISO string
  category: string;
  categoryId?: string;
  icon: string;
  type: 'income' | 'expense' | 'subscription' | 'transfer';
}

// --- Merchant Store Themes ---
export interface Section {
    id: string;
    type: 'featured-products' | 'new-arrivals' | 'best-sellers' | 'collections' | 'about-store' | 'text-banner' | 'image-with-text' | 'testimonials';
}

export interface StoreConfig {
    branding: {
        storeName: string;
        tagline?: string;
        palette: {
            primary: string;
            secondary: string;
            accent: string;
            background: string;
            text: string;
        };
        fontPair: 'Modern' | 'Classic' | 'Playful';
    };
    hero: {
        isEnabled: boolean;
        imageUrl: string;
        headline: string;
        subtitle: string;
        ctaText: string;
    };
    layout: {
        cardStyle: 'hard-shadow' | 'soft-shadow' | 'border';
        spacing: 'tight' | 'normal' | 'loose';
        gridStyle: '2x2' | '3x3' | 'list' | 'masonry';
        cardBorderRadius: 'sharp' | 'rounded' | 'very-rounded';
    };
    sections: Section[];
}

export interface Theme {
    id: string;
    name: string;
    previewUrl: string;
    config: StoreConfig;
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  nameEn: string;
}

// --- Chat & Messaging Types ---
export type UnifiedChatSenderRole = 'user' | 'merchant' | 'system';

export interface UnifiedChatMessage {
    id: string;
    chatId: string;
    senderRole: UnifiedChatSenderRole;
    senderId: string;
    senderName: string;
    textRaw: string;
    textClean: string;
    timestamp: string;
    lang: string;
}

export interface UnifiedChat {
  id: string;
  userId: string;
  merchantId: string;
  productId: string;
  userAgreed: boolean;
  merchantAgreed: boolean;
  status: 'negotiating' | 'agreed' | 'closed';
  agreedAt?: string; // ISO String
}

export interface ExchangeChatMessage {
    id: string;
    chatId: string;
    senderId: string;
    senderName: string;
    textRaw: string;
    textClean: string;
    timestamp: string;
    isAgreementMessage: boolean;
    lang: string;
}

export interface ExchangeChat {
    id: string;
    itemId: string;
    memberIds: string[];
    memberAgreements: { [userId: string]: string | null }; // messageId or null
    status: 'negotiating' | 'agreed' | 'cancelled';
}

export interface ExchangeTransaction {
  id: string;
  date: string; // ISO string
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  fee: number;
}

export interface InboxMessage {
  id: string;
  type: 'chat' | 'order' | 'promo' | 'system';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string; // ISO String
  deepLink: string; // e.g., '/chat/chat123'
}

// For TomChatWidget.tsx and ChatMessage.tsx
export interface Message {
  role: 'user' | 'model';
  content: string;
}

// --- Payment Types ---
export interface PaymentGateway {
    id: string;
    name: string;
    type: 'Credit Card' | 'Online Gateway' | 'Mobile Wallet' | 'Bank Transfer';
    logoUrl: string;
    description: string;
    isLocal: boolean;
    comingSoon?: boolean;
}

export interface UserPaymentMethod {
    gatewayId: string;
    isEnabled: boolean;
    details?: { [key: string]: string }; // e.g., last4 digits for card
}

// --- AI & Tips Types ---
export interface DailyTip {
    id: string;
    icon: string;
    titleKey: string;
    bodyKey: string;
    bodyValues?: { [key: string]: string | number };
}

export interface Recommendation {
    id: string;
    reason: string;
    product: Product;
    savings: string;
    category: string;
}

export interface SavingsTip {
    id: string;
    category: string;
    behavior: string;
    suggestion: string;
    saving: string;
    productId?: string;
}

// --- Localization Types ---
export interface Lang {
  code: string;
  nameEn: string;
  nameAr: string;
  rtl: boolean;
}

// --- Goals & Investment Types ---
export interface SimulationResult {
    scenarios: { name: string; endingValue: number; }[];
    percentiles: { month: number; p5: number; p50: number; p95: number; }[];
}

// --- Quick Actions ---
export interface ExpenseData {
    amount: number;
    categoryId?: string;
    category?: string;
    date: string;
    notes: string;
    expType: 'fixed' | 'variable';
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  user_id: string;
  is_default: boolean;
}

export interface IncomeData {
    amount: number;
    source: string;
    date: string;
    notes: string;
    recurring: boolean;
}

// --- Exchange Market ---
export interface ExchangeRate {
    currency: string;
    rate: number; // vs USD
    trend: 'up' | 'down';
}

// --- Product Reviews ---
export interface ProductReview {
  id: string;
  productId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number; // 1-5
  title: string;
  commentClean: string; // Sanitized
  commentRaw: string;   // Original
  helpful: number;
  createdAt: string; // ISO String
  status: 'visible' | 'flagged'; // for moderation
  reply?: {
      merchantName: string;
      comment: string;
      createdAt: string;
  };
}

// --- Trader Mode ---
export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: { value: number }[];
}

// --- Referral & Support Types ---
export interface Referral {
    id: string;
    refereeName: string;
    date: string;
    status: 'Pending' | 'Completed';
    rewardAmount: number;
}

export interface SupportTicket {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    subject: string;
    category: string;
    message: string;
    status: 'Open' | 'In Progress' | 'Resolved';
    createdAt: string;
    lastUpdate: string;
    adminResponse?: string;
}

export interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category: string;
}
