
import { User, BudgetCategory, Product, InvestmentOption, Family, Goal, AppNotification, Merchant, Order, ChatMessage, MerchantProfile, MerchantAd, PurchaseRequest, InvestmentType, Transaction, PaymentRecord, MerchantInfo, ProductReview, UnifiedChat, UnifiedChatMessage, ExchangeChat, ExchangeChatMessage, ExchangeItem, ExchangeRate, InboxMessage, SimulationResult, ExchangeTransaction, Stock, Referral, SupportTicket, FAQItem } from '../types';
import { themes } from './merchantThemes';

// --- Safe Theme Lookups ---
const defaultTheme = themes[0]; // Fallback to the first theme
const darkTheme = themes.find(t => t.id === 'dark') || defaultTheme;
const monolithTheme = themes.find(t => t.id === 'monolith') || defaultTheme; 
const streetwearTheme = themes.find(t => t.id === 'streetwear') || defaultTheme;


// --- GENERATOR FOR INVESTMENT OPTIONS ---
const generateInvestmentOptions = (): InvestmentOption[] => {
    const options: InvestmentOption[] = [];
    const types: InvestmentType[] = ['Stock', 'ETF', 'Crypto', 'Bond', 'Commodity', 'Real Estate', 'Venture Capital'];
    const risks: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];
    const sectors = ['Technology', 'Healthcare', 'Financials', 'Industrials', 'Energy', 'Real Estate', 'Consumer Staples', 'DeFi', 'Startups'];
    const names = [
        { prefix: 'Quantum', suffix: 'Analytics' }, { prefix: 'Apex', suffix: 'Holdings' },
        { prefix: 'Stellar', suffix: 'Ventures' }, { prefix: 'Momentum', suffix: 'Growth' },
        { prefix: 'Global', suffix: 'Innovators' }, { prefix: 'Future', suffix: 'Tech' },
        { prefix: 'Green', suffix: 'Energy Fund' }, { prefix: 'Crypto', suffix: 'Pioneers' },
        { prefix: 'Blue Chip', suffix: 'Index' }, { prefix: 'Govt', suffix: 'Bonds AAA' },
    ];
    
    for (let i = 1; i <= 120; i++) {
        const risk = risks[i % 3];
        const type = types[i % types.length];
        let estimatedRoi, aiInsight;
        
        switch (risk) {
            case 'Low':
                estimatedRoi = `${(Math.random() * 3 + 2).toFixed(1)}% - ${(Math.random() * 3 + 5).toFixed(1)}%`;
                aiInsight = "Focuses on stable returns and capital preservation.";
                break;
            case 'Medium':
                 estimatedRoi = `${(Math.random() * 5 + 6).toFixed(1)}% - ${(Math.random() * 5 + 11).toFixed(1)}%`;
                 aiInsight = "A balanced approach between growth and stability.";
                 break;
            case 'High':
                 estimatedRoi = `${(Math.random() * 10 + 12).toFixed(1)}% - ${(Math.random() * 20 + 22).toFixed(1)}%`;
                 aiInsight = "Aims for high growth, suitable for long-term investors comfortable with volatility.";
                 break;
        }

        options.push({
            id: `inv${i}`,
            name: `${names[i % names.length].prefix} ${names[i % names.length].suffix}`,
            ticker: `TKR${i}`,
            type: type,
            risk: risk,
            price: parseFloat((Math.random() * 500 + 50).toFixed(2)),
            marketCap: Math.random() * 1e12,
            ytdReturn: parseFloat((Math.random() * 40 - 10).toFixed(1)),
            volatility: parseFloat((Math.random() * 5).toFixed(1)),
            sector: sectors[i % sectors.length],
            description: `A mock investment option in the ${sectors[i % sectors.length]} sector, classified as ${risk} risk.`,
            country: 'US',
            imageUrl: `https://picsum.photos/seed/inv${i}/300/200`,
            recommendationScore: Math.floor(Math.random() * 40 + 60),
            recommendedReason: 'Based on market trends and growth potential.',
            estimatedRoi,
            aiInsight
        });
    }
    return options;
}

export const mockInvestmentOptions: InvestmentOption[] = generateInvestmentOptions();

export const mockStocks: Stock[] = [
  {
    id: 'stock1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 175.25,
    change: 2.15,
    changePercent: 1.24,
    sparkline: [ { value: 168 }, { value: 170 }, { value: 169 }, { value: 172 }, { value: 171 }, { value: 174 }, { value: 175.25 } ]
  },
  {
    id: 'stock2',
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 250.80,
    change: -1.45,
    changePercent: -0.57,
    sparkline: [ { value: 255 }, { value: 253 }, { value: 256 }, { value: 252 }, { value: 251 }, { value: 250 }, { value: 250.80 } ]
  },
  {
    id: 'stock3',
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    price: 140.50,
    change: 1.80,
    changePercent: 1.30,
    sparkline: [ { value: 135 }, { value: 136 }, { value: 138 }, { value: 137 }, { value: 139 }, { value: 141 }, { value: 140.50 } ]
  },
  {
    id: 'stock4',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 470.10,
    change: -5.20,
    changePercent: -1.09,
    sparkline: [ { value: 480 }, { value: 475 }, { value: 478 }, { value: 472 }, { value: 473 }, { value: 469 }, { value: 470.10 } ]
  }
];

// --- Rest of Mock Data ---

export const mockMerchantProfile: MerchantProfile = {
    brandName: 'GadgetZone Store',
    slug: 'gadgetzone',
    phone: '201122334455',
    governorate: 'Cairo',
    address: '45 Kasr El Nil St, Cairo',
    logoUrl: 'https://i.imgur.com/35mPzfe.png',
    isVerified: false, // Initially not verified
    storeConfig: { ...darkTheme.config, branding: { ...darkTheme.config.branding, storeName: 'GadgetZone' } },
    storeDescription: "Your one-stop shop for the latest and greatest in tech. From smartphones to smart home devices, we've got it all at the best prices in Cairo.",
    socialLinks: [
        { platform: 'facebook', url: 'https://facebook.com' },
        { platform: 'instagram', url: 'https://instagram.com' },
    ],
    subscription: undefined,
};

export const mockUser: User = {
    id: '1',
    name: 'Jane Doe',
    age: 34,
    occupation: 'Software Engineer',
    role: 'Parent',
    isFamilyHead: true,
    familyId: 'fam1',
    salary: 10000,
    familyMembers: 4,
    priorities: ['Food', 'Housing', 'Savings', 'Transport'],
    nonEssentials: ['Entertainment', 'Clothes & Devices'],
    email: 'jane.doe@example.com',
    accountType: 'regular',
    accountPlan: 'family',
    profilePictureUrl: 'https://i.pravatar.cc/150?u=janedoe',
    isVerified: false,
    merchantProfile: mockMerchantProfile, // Add full profile for when user switches
    contactInfo: {
        phone: '1234567890',
        address: '123 Main St, Anytown, USA',
        preferredMeetup: 'Weekdays after 5 PM at City Mall',
        deliveryAddress: {
            street: '123 Main St',
            city: 'Anytown',
            governorate: 'CA',
            postalCode: '12345',
        },
    },
    inventory: [],
    orderHistory: [
        { productId: 'p1', orderDate: '2023-09-15T10:00:00Z' },
        { productId: 'e2', orderDate: '2023-09-20T11:00:00Z' },
        { productId: 'p1', orderDate: '2023-10-14T09:30:00Z' },
    ],
    currency: 'USD',
    langCode: 'en',
    countryCode: 'US',
    referralCode: 'VENTY-JANE-123',
};

export const mockOtherUser: User = {
    id: '4',
    name: 'Ahmed',
    role: 'FamilyMember',
    isFamilyHead: false,
    email: 'ahmed.s@example.com',
    salary: 8000, familyMembers: 1, priorities: [], nonEssentials: [], accountType: 'regular', accountPlan: 'family',
    contactInfo: {
        phone: '201098765432',
        address: '456 Tahrir Sq, Alexandria, Egypt',
        preferredMeetup: 'Weekends, Alexandria Sporting Club',
    },
    inventory: [],
    currency: 'USD',
    langCode: 'en',
    countryCode: 'EG',
    referralCode: 'VENTY-AHMED-456',
};

export const mockAnonymousGuestUser: User = {
    id: 'guest',
    name: 'Guest',
    isGuest: true,
    role: 'FamilyMember',
    isFamilyHead: false,
    salary: 2500,
    familyMembers: 1,
    priorities: [],
    nonEssentials: [],
    email: 'guest@venty.app',
    accountType: 'regular',
    accountPlan: 'single',
    contactInfo: { phone: '', address: '', preferredMeetup: '' },
    inventory: [],
    currency: 'USD',
    langCode: 'en',
    countryCode: 'US',
};


export const mockMerchantUser: User = {
    id: 'merchant1',
    name: 'GadgetZone Store',
    role: 'Merchant',
    isFamilyHead: false,
    salary: 0, // Merchants don't have a salary in this context
    familyMembers: 1,
    priorities: [],
    nonEssentials: [],
    email: 'sales@gadgetzone.com',
    accountType: 'merchant',
    accountPlan: 'single',
    merchantProfile: { ...mockMerchantProfile, isVerified: false }, // Set to false by default
    contactInfo: { phone: '201122334455', address: '45 Kasr El Nil St, Cairo, Egypt', preferredMeetup: 'N/A' },
    inventory: [],
    currency: 'USD',
    langCode: 'en',
    countryCode: 'EG',
};


const mockFamilyMembers: User[] = [
    mockUser,
    {
        id: '2',
        name: 'Amina (Spouse)',
        profilePictureUrl: 'https://i.pravatar.cc/150?u=amina',
        role: 'FamilyMember',
        isFamilyHead: false,
        familyId: 'fam1',
        email: 'amina@example.com',
        isVerified: false,
        salary: 0, familyMembers: 0, priorities: [], nonEssentials: [], accountType: 'regular', accountPlan: 'family', contactInfo: mockUser.contactInfo, inventory: [],
        currency: 'USD', langCode: 'en', countryCode: 'US',
    },
    {
        id: '3',
        name: 'Omar (Child)',
        profilePictureUrl: 'https://i.pravatar.cc/150?u=omar',
        role: 'FamilyMember',
        isFamilyHead: false,
        familyId: 'fam1',
        email: 'omar@example.com',
        isVerified: false,
        salary: 0, familyMembers: 0, priorities: [], nonEssentials: [], accountType: 'regular', accountPlan: 'family', contactInfo: mockUser.contactInfo, inventory: [],
        currency: 'USD', langCode: 'en', countryCode: 'US',
    }
];

const mockSharedGoals: Goal[] = [
    { id: 'g1', name: "Family Trip to Dubai", targetAmount: 40000, currentAmount: 8000, investedAmount: 2000, deadline: '2024-12-31', milestonePercentage: 25, monthlyContribution: 1000, deductionDate: '1' },
    { id: 'g2', name: "New Family Car", targetAmount: 250000, currentAmount: 25000, investedAmount: 10000, deadline: '2025-06-30', milestonePercentage: 10, monthlyContribution: 2500, deductionDate: '1' },
];

export const mockFamily: Family = {
    id: 'fam1',
    name: 'The Mohamed Family',
    familyCode: 'Venty-XYZ123',
    password: 'VentyPassword123!',
    members: mockFamilyMembers,
    sharedGoals: mockSharedGoals
};

// Updated budget categories to match user request
export const mockBudget: BudgetCategory[] = [
    { id: '1', name: 'Groceries', icon: '🛒', allocated: 34, spent: 750 },
    { id: '5', name: 'Education', icon: '🎓', allocated: 16, spent: 300 },
    { id: '6', name: 'Clothing', icon: '👕', allocated: 14, spent: 200 },
    { id: '3', name: 'Transport', icon: '🚗', allocated: 11, spent: 200 },
    { id: '8', name: 'Entertainment', icon: '🎬', allocated: 9, spent: 100 },
    { id: '7', name: 'Gym / Fitness', icon: '🏋️‍♂️', allocated: 6, spent: 50 },
    { id: '4', name: 'Health', icon: '🏥', allocated: 5, spent: 50 },
    { id: '9', name: 'Subscriptions', icon: '🧾', allocated: 3, spent: 50 },
    { id: '10', name: 'Miscellaneous', icon: '📦', allocated: 2, spent: 50 },
];

// --- Store & Merchant Data ---
export const mockMerchantInfoGadgetZone: MerchantInfo = {
    id: 'merch1', name: 'GadgetZone', slug: 'gadgetzone',
    logoUrl: 'https://i.imgur.com/35mPzfe.png', city: 'Cairo', rating: 4.8, deliveryDays: 2, isVerified: true,
};

export const mockMerchantInfoTechWorld: MerchantInfo = {
    id: 'merch2', name: 'Tech World', slug: 'tech-world',
    logoUrl: 'https://i.imgur.com/sPTfD4z.png', city: 'Alexandria', rating: 4.6, deliveryDays: 3, isVerified: true,
};

export const mockMerchantInfoStyleHub: MerchantInfo = {
    id: 'merch3', name: 'Style Hub', slug: 'style-hub',
    logoUrl: 'https://i.imgur.com/eXq2843.png', city: 'Giza', rating: 4.5, deliveryDays: 2, isVerified: false,
};

export const mockMerchantInfoAhmedGroceries: MerchantInfo = {
    id: 'merch4', name: 'Ahmed Groceries', slug: 'ahmed-groceries',
    logoUrl: 'https://i.imgur.com/sK21b3S.png', city: 'Cairo', rating: 4.9, deliveryDays: 1, isVerified: true,
};

export const mockProducts: Product[] = [
    { id: 'p1', title: 'Rice 10kg', price: 320, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), merchant: 'Ahmed Groceries', imageUrl: 'https://picsum.photos/seed/rice/300/200', category: 'Food & Beverages', stock: 1, ownerId: '4', ownerName: 'Ahmed', condition: 'New', merchantInfo: mockMerchantInfoAhmedGroceries, description: 'Premium quality long-grain rice, perfect for family meals.' },
    { id: 'p2', title: 'Cooking Oil 3L', price: 200, createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), merchant: 'Ahmed Groceries', imageUrl: 'https://picsum.photos/seed/oil/300/200', category: 'Food & Beverages', stock: 1, ownerId: '4', ownerName: 'Ahmed', condition: 'New', merchantInfo: mockMerchantInfoAhmedGroceries, description: 'Healthy sunflower cooking oil for all your culinary needs.' },
    { id: 'p3', title: 'Chicken 1kg', price: 180, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), merchant: 'Tarek Market', imageUrl: 'https://picsum.photos/seed/chicken/300/200', category: 'Food & Beverages', stock: 1, ownerId: '4', ownerName: 'Ahmed', condition: 'New', merchantInfo: mockMerchantInfoAhmedGroceries, description: 'Fresh, locally sourced chicken, ready for your favorite recipes.' },
    { id: 'e1', title: 'Wireless Headphones', price: 950, originalPrice: 1200, createdAt: new Date().toISOString(), merchant: 'Tech World', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop', category: 'Electronics & Gadgets', stock: 1, ownerId: '4', ownerName: 'Ahmed', condition: 'Like New', merchantInfo: mockMerchantInfoTechWorld, description: 'Immersive sound with noise-cancelling technology. Up to 20 hours battery life.', isHotDeal: true },
    { id: 'e2', title: 'Smartwatch Series 7', price: 2500, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), merchant: 'GadgetZone', imageUrl: 'https://picsum.photos/seed/watch/300/200', category: 'Electronics & Gadgets', stock: 1, ownerId: '4', ownerName: 'Ahmed', condition: 'Good', merchantInfo: mockMerchantInfoGadgetZone, description: 'A sleek and powerful smartwatch with a vibrant AMOLED display, 14-day battery life, and advanced health tracking features including heart rate, SpO2, and sleep monitoring. Compatible with Android and iOS.', images: ['https://picsum.photos/seed/watch/600/400', 'https://picsum.photos/seed/watch2/600/400', 'https://picsum.photos/seed/watch3/600/400'], isTrending: true },
    { id: 'e3', title: 'Power Bank 20000mAh', price: 750, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), merchant: 'Tech World', imageUrl: 'https://picsum.photos/seed/powerbank/300/200', category: 'Electronics & Gadgets', stock: 1, ownerId: '4', ownerName: 'Ahmed', condition: 'Used', merchantInfo: mockMerchantInfoTechWorld, description: 'Charge your devices on the go with this high-capacity power bank.' },
    { id: 'c1', title: 'Classic Cotton T-Shirt', price: 350, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), merchant: 'Style Hub', imageUrl: 'https://picsum.photos/seed/tshirt/300/200', category: 'Fashion & Apparel', stock: 1, ownerId: '4', ownerName: 'Ahmed', condition: 'New', merchantInfo: mockMerchantInfoStyleHub, description: 'A timeless wardrobe staple made from 100% premium cotton.', isTrending: true },
    { id: 'c2', title: 'Slim-Fit Denim Jeans', price: 720, originalPrice: 800, createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), merchant: 'Fashion Forward', imageUrl: 'https://picsum.photos/seed/jeans/300/200', category: 'Fashion & Apparel', stock: 1, ownerId: '4', ownerName: 'Ahmed', condition: 'Good', merchantInfo: mockMerchantInfoStyleHub, description: 'Modern slim-fit jeans with a comfortable stretch fabric.', isHotDeal: true },
    { id: 'a1', title: 'Smart Air Fryer', price: 1850, originalPrice: 2200, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), merchant: 'GadgetZone', imageUrl: 'https://picsum.photos/seed/airfryer/300/200', category: 'Home & Living', stock: 15, ownerId: 'merchant1', ownerName: 'GadgetZone Store', condition: 'New', merchantInfo: mockMerchantInfoGadgetZone, description: 'Cook healthier meals with less oil. Features multiple presets and smart controls.', isHotDeal: true, isTrending: true },
    // New products for expanded categories
    { id: 'bs1', title: 'Organic Vitamin C Serum', price: 450, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), merchant: 'Style Hub', imageUrl: 'https://picsum.photos/seed/serum/300/200', category: 'Beauty & Skincare', stock: 30, ownerId: 'merch3', ownerName: 'Style Hub', condition: 'New', merchantInfo: mockMerchantInfoStyleHub, description: 'Brighten and rejuvenate your skin with our best-selling serum.' },
    { id: 'hw1', title: 'Vegan Protein Powder', price: 800, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), merchant: 'Tech World', imageUrl: 'https://picsum.photos/seed/protein/300/200', category: 'Health & Wellness', stock: 50, ownerId: 'merch2', ownerName: 'Tech World', condition: 'New', merchantInfo: mockMerchantInfoTechWorld, description: 'Premium plant-based protein for muscle recovery and growth.' },
    { id: 'gf1', title: 'Eco-Friendly Yoga Mat', price: 650, createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), merchant: 'GadgetZone', imageUrl: 'https://picsum.photos/seed/yogamat/300/200', category: 'Gym & Fitness', stock: 25, ownerId: 'merch1', ownerName: 'GadgetZone Store', condition: 'New', merchantInfo: mockMerchantInfoGadgetZone, description: 'Non-slip, eco-friendly mat for your daily yoga practice.', isTrending: true },
    { id: 'sd1', title: 'Streaming 1-Year Plan', price: 1200, createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), merchant: 'GadgetZone', imageUrl: 'https://picsum.photos/seed/subscription/300/200', category: 'Subscriptions & Digital', stock: 999, ownerId: 'merch1', ownerName: 'GadgetZone Store', condition: 'New', merchantInfo: mockMerchantInfoGadgetZone, description: 'Access thousands of movies and shows for a full year.' },
    { id: 'kt1', title: 'Plush Teddy Bear', price: 400, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), merchant: 'Style Hub', imageUrl: 'https://images.unsplash.com/photo-1596799326442-c6258942946a?w=300&auto=format&fit=crop', category: 'Kids & Toys', stock: 40, ownerId: 'merch3', ownerName: 'Style Hub', condition: 'New', merchantInfo: mockMerchantInfoStyleHub, description: 'A soft and cuddly companion for children of all ages.' },
    { id: 'sp1', title: 'Holiday Ornament Set', price: 250, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), merchant: 'Style Hub', imageUrl: 'https://picsum.photos/seed/ornaments/300/200', category: 'Seasonal Picks', stock: 100, ownerId: 'merch3', ownerName: 'Style Hub', condition: 'New', merchantInfo: mockMerchantInfoStyleHub, description: 'Decorate your home with this beautiful set of holiday ornaments.' },
];

// --- Merchant Mock Data ---

export const mockOrders: Order[] = [
    { 
        id: 'ORD-001', customerName: 'Ali Hassan', customerEmail: 'ali.h@example.com', 
        items: [{ productId: 'e2', title: 'Smartwatch', quantity: 1, price: 2500 }], 
        total: 2500, status: 'completed', 
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), 
        trackingNumber: 'AWB123456789', commission: 125, merchantPayout: 2375,
        estimatedDeliveryAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        deliveryAddress: { street: '123 Nile St', city: 'Cairo', governorate: 'Cairo Governorate', postalCode: '11511' },
        statusHistory: [
            { status: 'paid-awaiting-fulfillment', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), note: 'Order placed' },
            { status: 'shipped', timestamp: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString(), note: 'Shipped from Cairo Hub' },
            { status: 'in-transit', timestamp: new Date(Date.now() - 4.2 * 24 * 60 * 60 * 1000).toISOString(), note: 'Out for delivery' },
            { status: 'completed', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), note: 'Delivered' }
        ]
    },
    { 
        id: 'ORD-002', customerName: 'Fatima Ahmed', customerEmail: 'fatima.a@example.com', 
        items: [{ productId: 'imported-ali-e1', title: 'Premium Sound Wireless Earbuds', quantity: 1, price: 850 }], 
        total: 850, status: 'in-transit', 
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        trackingNumber: 'AWB987654321', isDropshipped: true,
        estimatedDeliveryAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        deliveryAddress: { street: '456 Sea St', city: 'Alexandria', governorate: 'Alexandria Governorate', postalCode: '21500' },
        statusHistory: [
            { status: 'paid-awaiting-fulfillment', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), note: 'Order placed' },
            { status: 'shipped', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), note: 'Shipped from Cairo Hub' },
            { status: 'in-transit', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), note: 'Out for delivery' }
        ]
    },
    { 
        id: 'ORD-003', customerName: 'Youssef Ibrahim', customerEmail: 'youssef.i@example.com', 
        items: [{ productId: 'e3', title: 'Power Bank', quantity: 1, price: 750 }, { productId: 'e2', title: 'Smartwatch', quantity: 1, price: 2500 }], 
        total: 3250, status: 'paid-awaiting-fulfillment', 
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), 
        updatedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        estimatedDeliveryAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        deliveryAddress: { street: '789 Desert Rd', city: 'Giza', governorate: 'Giza Governorate', postalCode: '12511' },
         statusHistory: [
            { status: 'paid-awaiting-fulfillment', timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), note: 'Order placed' }
        ]
    },
    { id: 'ORD-004', customerName: 'Sara Adel', customerEmail: 'sara.a@example.com', items: [{ productId: 'e1', title: 'Wireless Headphones', quantity: 1, price: 950 }], total: 950, status: 'pending-payment', createdAt: '2023-10-30T14:20:00Z', updatedAt: '2023-10-30T14:20:00Z' },
    { id: 'ORD-005', customerName: 'Omar Khaled', customerEmail: 'omar.k@example.com', items: [{ productId: 'e2', title: 'Smartwatch', quantity: 1, price: 2500 }], total: 2500, status: 'cancelled', createdAt: '2023-10-27T15:00:00Z', updatedAt: '2023-10-27T16:00:00Z' },
];

export const mockPaymentHistory: PaymentRecord[] = [
    {
        id: 'pay_hist_1',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 22.00,
        type: 'Subscription',
        status: 'Completed',
        description: 'Venty Premium Subscription',
        referenceId: 'sub_123',
        paymentMethod: 'Visa **** 4242'
    },
    {
        id: 'pay_hist_2',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 7.00,
        type: 'Verification',
        status: 'Completed',
        description: 'User Verification Fee',
        referenceId: 'verify_abc',
        paymentMethod: 'Visa **** 4242'
    },
    {
        id: 'pay_hist_3',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 2500,
        type: 'Order',
        status: 'Completed',
        description: 'Order #ORD-001',
        referenceId: 'ORD-001',
        paymentMethod: 'Mastercard **** 5678'
    },
    {
        id: 'pay_hist_4',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 50.00,
        type: 'Ad Campaign',
        status: 'Pending',
        description: 'Banner Ad Campaign',
        referenceId: 'ad_xyz',
        paymentMethod: 'PayPal'
    },
     {
        id: 'pay_hist_5',
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 22.00,
        type: 'Subscription',
        status: 'Failed',
        description: 'Venty Premium Subscription',
        referenceId: 'sub_122',
        paymentMethod: 'Visa **** 4242'
    }
];

export const mockExchangeHistory: ExchangeTransaction[] = [
  { id: 'exh1', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), fromCurrency: 'USD', toCurrency: 'EGP', fromAmount: 200, toAmount: 9480, fee: 1.50 },
  { id: 'exh2', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), fromCurrency: 'EUR', toCurrency: 'USD', fromAmount: 150, toAmount: 162.5, fee: 1.20 },
  { id: 'exh3', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), fromCurrency: 'USD', toCurrency: 'GBP', fromAmount: 500, toAmount: 395, fee: 2.50 },
  { id: 'exh4', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), fromCurrency: 'EGP', toCurrency: 'USD', fromAmount: 10000, toAmount: 205, fee: 5.00 },
];

const importedAndEditedProduct: Product = {
    id: 'imported-ali-e1',
    title: 'Premium Sound Wireless Earbuds', // Customized Title
    price: 850, // Customized Price
    originalPrice: 1100,
    createdAt: new Date().toISOString(),
    merchant: 'GadgetZone',
    imageUrl: 'https://picsum.photos/seed/earbuds/300/200',
    category: 'Electronics & Gadgets', // Customized Category
    stock: 999, // Stock is high for dropshipped items
    ownerId: 'merchant1',
    ownerName: 'GadgetZone Store',
    condition: 'New',
    isDropshipped: true,
    source: 'aliexpress',
    sourcePrice: 250, // Original source price
    merchantInfo: mockMerchantInfoGadgetZone,
    description: "Experience crystal-clear audio with these top-of-the-line wireless earbuds. Featuring active noise cancellation and a long-lasting battery, they are perfect for music lovers and professionals on the go. Edited and curated by GadgetZone." // Customized description
};


export const mockMerchant: Merchant = {
    id: 'merch1',
    userId: 'merchant1',
    storeName: 'GadgetZone',
    businessType: 'Electronics',
    products: [
        ...mockProducts.filter(p => p.merchant === 'GadgetZone' || p.merchant === 'Tech World'),
        importedAndEditedProduct
    ],
    orders: mockOrders,
    slug: 'gadgetzone',
    logoUrl: 'https://i.imgur.com/35mPzfe.png',
    coverUrl: 'https://picsum.photos/seed/storecover/1200/400',
    city: 'Cairo',
    rating: 4.8,
    followersCount: 1250,
    isVerified: true,
    faqSheet: [
        { question: 'What is the warranty period?', answer: 'All our products come with a 1-year manufacturer warranty.' },
        { question: 'Do you offer cash on delivery?', answer: 'Yes, we offer cash on delivery in Cairo and Giza.' },
    ],
    settings: {
        autoReplyOn: true,
    },
    storeConfig: { ...darkTheme.config, branding: { ...darkTheme.config.branding, storeName: 'GadgetZone' } },
    storeDescription: "Your one-stop shop for the latest and greatest in tech. From smartphones to smart home devices, we've got it all at the best prices in Cairo.",
    socialLinks: [
        { platform: 'facebook', url: 'https://facebook.com' },
        { platform: 'instagram', url: 'https://instagram.com' },
    ]
};

export const mockAllMerchants: Merchant[] = [
    mockMerchant,
    {
        id: 'merch2', userId: 'merchant2', storeName: 'Tech World', businessType: 'Electronics', products: [], orders: [],
        slug: 'tech-world', logoUrl: 'https://i.imgur.com/sPTfD4z.png', coverUrl: 'https://picsum.photos/seed/techcover/1200/400',
        city: 'Alexandria', rating: 4.6, followersCount: 890, isVerified: true,
        storeConfig: monolithTheme.config,
    },
     {
        id: 'merch3', userId: 'merchant3', storeName: 'Style Hub', businessType: 'Apparel', products: [], orders: [],
        slug: 'style-hub', logoUrl: 'https://i.imgur.com/eXq2843.png', coverUrl: 'https://picsum.photos/seed/stylecover/1200/400',
        city: 'Giza', rating: 4.5, followersCount: 2400, isVerified: false,
        storeConfig: streetwearTheme.config,
    }
];


export const mockAliExpressProducts: Product[] = [
    { id: 'ali-e1', title: 'High-Fidelity Wireless Earbuds', price: 600, createdAt: new Date().toISOString(), merchant: 'AliExpress Global', imageUrl: 'https://picsum.photos/seed/earbuds/300/200', category: 'Electronics & Gadgets', stock: 999, isDropshipped: true, source: 'aliexpress', sourcePrice: 250, ownerId: 'aliexpress', ownerName: 'AliExpress', condition: 'New' },
    { id: 'ali-e2', title: 'Pro Gaming Mechanical Keyboard', price: 1100, createdAt: new Date().toISOString(), merchant: 'AliExpress Global', imageUrl: 'https://picsum.photos/seed/keyboard/300/200', category: 'Electronics & Gadgets', stock: 999, isDropshipped: true, source: 'aliexpress', sourcePrice: 550, ownerId: 'aliexpress', ownerName: 'AliExpress', condition: 'New' },
    { id: 'ali-h1', title: 'Smart LED Ambiance Light Strip', price: 450, createdAt: new Date().toISOString(), merchant: 'AliExpress Global', imageUrl: 'https://picsum.photos/seed/ledstrip/300/200', category: 'Home & Living', stock: 999, isDropshipped: true, source: 'aliexpress', sourcePrice: 180, ownerId: 'aliexpress', ownerName: 'AliExpress', condition: 'New' },
    { id: 'ali-c1', title: 'Vintage Graphic Print Hoodie', price: 700, createdAt: new Date().toISOString(), merchant: 'AliExpress Global', imageUrl: 'https://picsum.photos/seed/hoodie/300/200', category: 'Fashion & Apparel', stock: 999, isDropshipped: true, source: 'aliexpress', sourcePrice: 300, ownerId: 'aliexpress', ownerName: 'AliExpress', condition: 'New' },
    { id: 'ali-e3', title: 'Portable Mini Projector 1080p', price: 1800, createdAt: new Date().toISOString(), merchant: 'AliExpress Global', imageUrl: 'https://picsum.photos/seed/projector/300/200', category: 'Electronics & Gadgets', stock: 999, isDropshipped: true, source: 'aliexpress', sourcePrice: 950, ownerId: 'aliexpress', ownerName: 'AliExpress', condition: 'New' },
];

// --- Family Chat Mock Data ---
export const mockChatMessages: ChatMessage[] = [
    { id: 'msg1', userId: '1', userName: 'Mohamed', message: "Hey everyone, just a reminder that the electricity bill is due this week.", timestamp: '10:30 AM', lang: 'en' },
    { id: 'msg2', userId: '2', userName: 'Amina', message: "Thanks for the reminder! I've already paid it from the joint account.", timestamp: '10:32 AM', lang: 'en' },
    { id: 'msg3', userId: '1', userName: 'Mohamed', message: "Perfect, thank you! Also, how are we looking on the grocery budget for this month?", timestamp: '10:33 AM', lang: 'en' },
    { id: 'msg4', userId: '2', userName: 'Amina', message: "We've spent about 60% of it. We should be fine if we stick to the list for the next shopping trip. 😊", timestamp: '10:35 AM', lang: 'en' },
    { id: 'msg5', userId: '3', userName: 'Omar', message: "Can we add some ice cream to the list? 🍦", timestamp: '11:05 AM', lang: 'en' },
    { id: 'msg6', userId: '1', userName: 'Mohamed', message: "Haha, if we have enough left at the end of the week, we'll see!", timestamp: '11:06 AM', lang: 'en' },
];

// --- Marketplace Ads Mock Data ---
export const mockAds: MerchantAd[] = [
    {
        id: 'ad1', merchantId: 'merch2', adType: 'banner', status: 'active',
        createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        content: { 
            imageUrl: 'https://images.unsplash.com/photo-1543465077-67923e18374f?w=1200&h=300&fit=crop&auto=format', 
            link: '/shop/tech-world',
            caption: 'Tech World: Your Destination for Cutting-Edge Gadgets'
        },
        budget: 25, durationDays: 5, clicks: 150, impressions: 12000, ctr: 1.25, conversions: 5,
        engagementScore: 0.85,
    },
    {
        id: 'ad2', merchantId: 'merch1', adType: 'product', status: 'active',
        createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        content: { productId: 'e2', link: '/product/e2' },
        budget: 30, durationDays: 10, clicks: 250, impressions: 20000, ctr: 1.25, conversions: 12, reachEstimate: 30000,
        engagementScore: 0.92,
    },
    {
        id: 'ad3', merchantId: 'merch1', adType: 'video', status: 'active',
        createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        content: { videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', caption: 'Experience gaming like never before with our new arrivals.', link: '/shop/gadgetzone' },
        budget: 50, durationDays: 7, clicks: 530, impressions: 45000, ctr: 1.18, conversions: 25, reachEstimate: 60000,
        engagementScore: 0.78,
    },
    {
        id: 'ad4', merchantId: 'merch1', adType: 'carousel', status: 'active',
        createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        content: {
            carouselImages: [ 'https://picsum.photos/seed/carousel1/600/400', 'https://picsum.photos/seed/carousel2/600/400', 'https://picsum.photos/seed/carousel3/600/400' ],
            caption: 'Our top sellers this week. Don\'t miss out!', link: '/shop/gadgetzone'
        },
        budget: 100, durationDays: 14, clicks: 980, impressions: 80000, ctr: 1.22, conversions: 45,
        engagementScore: 0.90,
    },
    {
        id: 'ad5', merchantId: 'merch1', adType: 'store_feature', status: 'active',
        createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        content: { link: '/shop/gadgetzone' },
        budget: 150, durationDays: 30, clicks: 2200, impressions: 250000, ctr: 0.88, conversions: 95,
        engagementScore: 0.65,
    }
];

// --- Family Purchase Requests Mock Data ---
export const mockPurchaseRequests: PurchaseRequest[] = [
  {
    id: 'req1',
    familyId: 'fam1',
    guestId: '2',
    guestName: 'Amina (Spouse)',
    productId: 'e2',
    productTitle: 'Smartwatch Series 7',
    productImageUrl: 'https://picsum.photos/seed/watch/300/200',
    productPrice: 2500,
    note: 'My old watch broke, I need a new one for my morning runs!',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: 'req2',
    familyId: 'fam1',
    guestId: '3',
    guestName: 'Omar (Child)',
    productId: 'kt1',
    productTitle: 'Plush Teddy Bear',
    productImageUrl: 'https://images.unsplash.com/photo-1596799326442-c6258942946a?w=300&auto=format&fit=crop',
    productPrice: 400,
    note: 'For my friend\'s birthday party this weekend. Please?',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: 'req5',
    familyId: 'fam1',
    guestId: '3',
    guestName: 'Omar (Child)',
    productId: 'gf1',
    productTitle: 'Eco-Friendly Yoga Mat',
    productImageUrl: 'https://picsum.photos/seed/yogamat/300/200',
    productPrice: 650,
    note: 'The school is starting a new yoga class and I need a mat.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  {
    id: 'req3',
    familyId: 'fam1',
    guestId: '3',
    guestName: 'Omar (Child)',
    productId: 'e1',
    productTitle: 'Wireless Headphones',
    productImageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop',
    productPrice: 950,
    note: 'For school online classes.',
    status: 'approved',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    reviewedBy: 'Jane Doe',
    reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req4',
    familyId: 'fam1',
    guestId: '2',
    guestName: 'Amina (Spouse)',
    productId: 'bs1',
    productTitle: 'Organic Vitamin C Serum',
    productImageUrl: 'https://picsum.photos/seed/serum/300/200',
    productPrice: 450,
    note: '',
    status: 'rejected',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    reviewedBy: 'Jane Doe',
    reviewedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// --- New Dashboard Mock Data ---
export const mockTransactions: Transaction[] = [
    { id: 'txn2', description: 'Grocery Shopping', amount: -75.50, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), category: 'Groceries', icon: '🛒', type: 'expense' },
    { id: 'txn3', description: 'Netflix Subscription', amount: -15.99, date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), category: 'Subscriptions', icon: '🧾', type: 'subscription' },
    { id: 'txn4', description: 'Dinner with friends', amount: -42.80, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), category: 'Entertainment', icon: '🎬', type: 'expense' },
    { id: 'txn5', description: 'Gasoline', amount: -50.00, date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), category: 'Transport', icon: '🚗', type: 'expense' },
    { id: 'txn6', description: 'Freelance Project Payment', amount: 500, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), category: 'Income', icon: '💻', type: 'income' },
    { id: 'txn7', description: 'Spotify Subscription', amount: -9.99, date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), category: 'Subscriptions', icon: '🎵', type: 'subscription' },
    { id: 'txn8', description: 'Transfer to Savings', amount: -500, date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), category: 'Savings', icon: '💰', type: 'transfer' },
];

// --- Newly added mock data to fix errors ---
export const mockProductReviews: ProductReview[] = [
    { id: 'rev1', productId: 'e2', reviewerId: '1', reviewerName: 'Jane Doe', rating: 5, title: 'Best watch ever!', commentClean: 'Absolutely love this smartwatch. The battery life is amazing and it looks great.', commentRaw: 'Absolutely love this smartwatch. The battery life is amazing and it looks great.', helpful: 12, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'visible' },
    { id: 'rev2', productId: 'e2', reviewerId: '4', reviewerName: 'Ahmed', rating: 4, title: 'Great value', commentClean: 'For the price, this is a fantastic watch. The screen is bright and clear.', commentRaw: 'For the price, this is a fantastic watch. The screen is bright and clear.', helpful: 5, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'visible', reply: { merchantName: 'GadgetZone', comment: 'Thank you for your feedback, Ahmed! We are glad you are enjoying your new watch.', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() } },
];

export const mockUnifiedChats: UnifiedChat[] = [
    { id: 'uc1', userId: '1', merchantId: 'merchant1', productId: 'e2', userAgreed: false, merchantAgreed: false, status: 'negotiating' },
];

export const mockUnifiedChatMessages: UnifiedChatMessage[] = [
    { id: 'uc_msg1', chatId: 'uc1', senderRole: 'user', senderId: '1', senderName: 'Jane Doe', textRaw: 'Hello, is the Smartwatch Series 7 still available?', textClean: 'Hello, is the Smartwatch Series 7 still available?', lang: 'en', timestamp: '10:30 AM' },
    { id: 'uc_msg2', chatId: 'uc1', senderRole: 'merchant', senderId: 'merchant1', senderName: 'GadgetZone Store', textRaw: 'Hi Jane, yes it is! We have a few left in stock.', textClean: 'Hi Jane, yes it is! We have a few left in stock.', lang: 'en', timestamp: '10:31 AM' },
];

export const mockExchangeChats: ExchangeChat[] = [
    { id: 'chat1', itemId: 'e1', memberIds: ['1', '4'], memberAgreements: { '1': null, '4': null }, status: 'negotiating' },
];

export const mockExchangeChatMessages: ExchangeChatMessage[] = [
    { id: 'bmsg1', chatId: 'chat1', senderId: '4', senderName: 'Ahmed', textRaw: 'Hi Jane, I am interested in your headphones. Would you be open to a trade?', textClean: 'Hi Jane, I am interested in your headphones. Would you be open to a trade?', timestamp: '11:00 AM', isAgreementMessage: false, lang: 'en' },
    { id: 'bmsg2', chatId: 'chat1', senderId: '1', senderName: 'Jane Doe', textRaw: 'Hi Ahmed! Sure, what do you have in mind?', textClean: 'Hi Ahmed! Sure, what do you have in mind?', timestamp: '11:01 AM', isAgreementMessage: false, lang: 'en' },
];

export const mockExchangeItems: ExchangeItem[] = [
    { id: 'ex1', ownerId: '4', ownerName: 'Ahmed', title: 'Professional Camera Lens', imageUrl: 'https://picsum.photos/seed/lens/300/200', quantity: 1, condition: 'Like New', description: '24-70mm f/2.8 lens, barely used.', wantedItems: 'A good quality drone or smartwatch.', location: 'Alexandria, Egypt', ownerCountryCode: 'EG', ownerCountryFlag: '🇪🇬', est_value: 1200, category: 'Electronics', expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), type: 'item', popularityScore: 88 },
    { id: 'ex2', ownerId: '1', ownerName: 'Jane Doe', title: 'Designer Handbag', imageUrl: 'https://picsum.photos/seed/handbag/300/200', quantity: 1, condition: 'Good', description: 'Authentic leather handbag.', wantedItems: 'Electronics, specifically a new tablet.', location: 'Anytown, USA', ownerCountryCode: 'US', ownerCountryFlag: '🇺🇸', est_value: 800, category: 'Clothing', expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), type: 'item', popularityScore: 75 },
];

export const mockExchangeRates: ExchangeRate[] = [
  { currency: 'EGP', rate: 47.5, trend: 'up' },
  { currency: 'EUR', rate: 0.92, trend: 'down' },
  { currency: 'GBP', rate: 0.79, trend: 'up' },
];

export const mockInboxMessages: InboxMessage[] = [
    { id: 'inbox1', type: 'system', title: 'Welcome to Venty!', body: 'Your financial journey starts now. Set up your budget to get started.', isRead: true, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), deepLink: '/budget' },
    { id: 'inbox2', type: 'order', title: 'Your Order #ORD-002 has shipped!', body: 'Your order for Premium Sound Wireless Earbuds is on its way.', isRead: false, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), deepLink: '/orders' },
];

export const mockMerchantInboxMessages: InboxMessage[] = [
    { id: 'minbox1', type: 'order', title: 'New Order #ORD-003', body: 'You have a new order from Youssef Ibrahim.', isRead: false, createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), deepLink: '/merchant/orders' },
    { id: 'minbox2', type: 'chat', title: 'Question about Smartwatch', body: 'From: Ali Hassan - "Is there a warranty?"', isRead: true, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), deepLink: '/messages/chat/uc1' },
];

export const mockSimulationResult: SimulationResult = {
  scenarios: [ { name: 'Worst Case', endingValue: 580 }, { name: 'Average', endingValue: 720 }, { name: 'Best Case', endingValue: 950 } ],
  percentiles: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, p5: 500 + i * 5, p50: 500 + i * 15, p95: 500 + i * 30 })),
};

// --- Referral Data ---
export const mockReferrals: Referral[] = [
    { id: 'ref1', refereeName: 'Sarah Smith', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'Completed', rewardAmount: 10 },
    { id: 'ref2', refereeName: 'Mike Jones', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'Pending', rewardAmount: 0 },
    { id: 'ref3', refereeName: 'Emily Davis', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), status: 'Completed', rewardAmount: 10 },
];

// --- Support Data ---
export const mockSupportTickets: SupportTicket[] = [
    { 
        id: 'tic1', 
        userId: '1',
        userName: 'Jane Doe',
        userEmail: 'jane.doe@example.com',
        subject: 'Login Issue', 
        category: 'Technical', 
        message: 'I cannot login to my account on the web portal.',
        status: 'Resolved', 
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), 
        lastUpdate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        adminResponse: 'The issue was related to browser cache. It should be resolved now.'
    },
    { 
        id: 'tic2', 
        userId: '1',
        userName: 'Jane Doe',
        userEmail: 'jane.doe@example.com',
        subject: 'Refund Request', 
        category: 'Billing', 
        message: 'I would like to request a refund for my last subscription charge.',
        status: 'In Progress', 
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 
        lastUpdate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() 
    },
];

export const mockFAQs: FAQItem[] = [
    { id: 'faq1', question: 'How do I reset my password?', answer: 'Go to Settings > Account > Change Password.', category: 'Account' },
    { id: 'faq2', question: 'How do I contact support?', answer: 'You can submit a ticket in the Support Center or email us at support@venty.app.', category: 'General' },
    { id: 'faq3', question: 'What payment methods are accepted?', answer: 'We accept credit cards, PayPal, and various local payment gateways.', category: 'Payments' },
    { id: 'faq4', question: 'Is Venty free to use?', answer: 'Yes, the core features are free. We also offer a Premium plan with advanced features.', category: 'General' },
];
