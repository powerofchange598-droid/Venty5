
import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { HashRouter, Routes, Route, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { PerformanceProvider } from './hooks/usePerformance';
import { ToastProvider, useToast } from './hooks/useToast';
import { CartProvider } from './hooks/useCart';
import { FavouritesProvider } from './hooks/useFavourites';
import ErrorBoundary from './components/ErrorBoundary';
import { LocalizationProvider } from './hooks/useLocalization';

// --- Data ---
import { User, BudgetCategory, Goal, MerchantAd, PurchaseRequest, FixedExpense, Order, StoreConfig, Product, AdType, AdPlanId, Transaction } from './types';
import { mockUser, mockMerchantUser, mockBudget, mockFamily, mockAds, mockPurchaseRequests, mockOrders, mockTransactions } from './data/mockData';
import { generateInitialBudget } from './utils/budgetGenerator';
import { api } from './lib/api';

// --- Layout Components ---
import SideNav from './components/SideNav';
import BottomNav from './components/BottomNav';
import MerchantSideNav from './components/merchant/MerchantSideNav';
import MerchantBottomNav from './components/merchant/MerchantBottomNav';
import CookieBanner from './components/CookieBanner';
import Toast from './components/Toast';
import { MerchantLayout } from './components/merchant/MerchantLayout';

// --- Screen Components (Lazy Loaded) ---
const OnboardingScreen = lazy(() => import('./screens/OnboardingScreen'));
import DashboardScreen from './screens/DashboardScreen';
const BudgetScreen = lazy(() => import('./screens/BudgetScreen'));
const GoalsScreen = lazy(() => import('./screens/GoalsScreen'));
const InvestmentScreen = lazy(() => import('./screens/InvestmentScreen'));
const FinancialSnapshotScreen = lazy(() => import('./screens/FinancialSnapshotScreen'));
const MarketplaceScreen = lazy(() => import('./screens/MarketplaceScreen'));
const ProductDetailScreen = lazy(() => import('./screens/ProductDetailScreen'));
const CartScreen = lazy(() => import('./screens/CartScreen'));
const FavouritesScreen = lazy(() => import('./screens/FavouritesScreen'));
const FamilyScreen = lazy(() => import('./screens/FamilyScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));
const OnboardingAISetupScreen = lazy(() => import('./screens/OnboardingAISetupScreen'));
const FamilyChatScreen = lazy(() => import('./screens/FamilyChatScreen'));
const FamilyRequestsScreen = lazy(() => import('./screens/FamilyRequestsScreen'));
const PurchaseRequestScreen = lazy(() => import('./screens/PurchaseRequestScreen'));
const ReferralScreen = lazy(() => import('./screens/ReferralScreen'));
const SupportScreen = lazy(() => import('./screens/SupportScreen'));

// Merchant Screens
const MerchantDashboardScreen = lazy(() => import('./screens/merchant/MerchantDashboardScreen'));
const MerchantOnboardingScreen = lazy(() => import('./screens/merchant/MerchantOnboardingScreen'));
const StoreSetupScreen = lazy(() => import('./screens/merchant/StoreSetupScreen'));
const ProductManagementScreen = lazy(() => import('./screens/merchant/ProductManagementScreen'));
const OrderManagementScreen = lazy(() => import('./screens/merchant/OrderManagementScreen'));
const MarketingDashboard = lazy(() => import('./screens/merchant/MarketingDashboard'));
const MerchantStoreScreen = lazy(() => import('./screens/MerchantStoreScreen'));

// Other Screens
const PaymentScreen = lazy(() => import('./screens/PaymentScreen'));
const PaymentHistoryScreen = lazy(() => import('./screens/PaymentHistoryScreen'));
const ExchangeListScreen = lazy(() => import('./screens/ExchangeListScreen'));
const ExchangePostScreen = lazy(() => import('./screens/ExchangePostScreen'));
const ExchangeChatScreen = lazy(() => import('./screens/ExchangeChatScreen'));
const MessagesScreen = lazy(() => import('./screens/MessagesScreen'));
const UnifiedChatScreen = lazy(() => import('./screens/UnifiedChatScreen'));
const MoreScreen = lazy(() => import('./screens/MoreScreen'));
const MyOrdersScreen = lazy(() => import('./screens/OrdersScreen'));
const PaymentMethodsScreen = lazy(() => import('./screens/PaymentMethodsScreen'));
const TermsScreen = lazy(() => import('./screens/TermsScreen'));
const PrivacyPolicyScreen = lazy(() => import('./screens/PrivacyPolicyScreen'));
const MerchantTermsScreen = lazy(() => import('./screens/merchant/MerchantTermsScreen'));
const AuthScreen = lazy(() => import('./screens/AuthScreen'));


const AppLayout: React.FC<{
    user: User;
    isPremiumUser: boolean;
    budget: BudgetCategory[];
}> = ({ user, isPremiumUser, budget }) => {
    const location = useLocation();
    const isMerchant = user.accountType === 'merchant';
    
    const hideNav = location.pathname.startsWith('/onboarding') || location.pathname.startsWith('/merchant/onboard') || location.pathname.startsWith('/terms') || location.pathname.startsWith('/privacy');
    
    const merchantTermsAccepted = (() => {
        try {
            return localStorage.getItem(`merchantTermsAccepted_${user.id}`) === 'true';
        } catch {
            return false;
        }
    })();
    if (isMerchant && !merchantTermsAccepted && !location.pathname.startsWith('/merchant/terms') && !location.pathname.startsWith('/merchant/onboard')) {
        return <Navigate to="/merchant/terms" replace />;
    }
    
    if (hideNav) {
        return <Outlet />;
    }

    return (
        <div className="flex h-full md:bg-bg-primary dark:md:bg-bg-primary">
            {isMerchant ? <MerchantSideNav /> : <SideNav user={user} isPremiumUser={isPremiumUser} />}
            <div className="flex-1 flex flex-col min-w-0 md:m-4 md:rounded-2xl md:overflow-hidden md:bg-bg-primary md:shadow-xl md:border md:border-border-primary transition-all duration-300">
                <main className="flex-grow overflow-y-auto">
                    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                        <Outlet />
                    </Suspense>
                </main>
            </div>
            {isMerchant ? <MerchantBottomNav user={user} /> : <BottomNav user={user} />}
        </div>
    );
};


const AppContent: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user: authUser, signOut: authSignOut, loading } = useAuth(); // Integrate useAuth
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('ventyUser');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [onboardingComplete, setOnboardingComplete] = useState(() => localStorage.getItem('onboardingComplete') === 'true');

    // Sync AuthUser (from Server/Firebase) with App User State
    useEffect(() => {
        if (authUser) {
            setUser(prev => {
                // Avoid unnecessary updates
                if (prev && prev.id === authUser.uid) return prev;
                
                // Merge authUser into App User structure
                // Preserve existing user data if it matches the ID (e.g. from local storage load)
                const base = (prev && prev.id === authUser.uid) ? prev : mockUser;
                return {
                    ...base,
                    id: authUser.uid,
                    email: authUser.email || base.email,
                    name: authUser.displayName || base.name,
                    profilePictureUrl: authUser.photoURL || base.profilePictureUrl,
                    isGuest: false,
                };
            });
            // If we have a real user, ensure onboarding is considered complete or check a flag
            // For now, we'll assume Google Login implies access, or we could redirect to onboarding if needed.
            // But let's respect the existing 'onboardingComplete' logic if possible, 
            // OR just set it to true to unblock the user as per "Fix... and make it work"
            if (!localStorage.getItem('onboardingComplete')) {
                 setOnboardingComplete(true);
                 localStorage.setItem('onboardingComplete', 'true');
            }
        } else {
            // If authUser is null, but we have a user in state...
            // Check if it's a guest user (which might not be in authProvider)
            // My useAuth changes removed local/guest logic from there.
            // So if useAuth says null, we are effectively logged out from the server/firebase perspective.
            // If the user was a guest, they are local-only.
            // We should only clear user if they were NOT a guest?
            // Or better, let's leave the user alone if they are a guest.
            setUser(prev => (prev?.isGuest ? prev : null));
        }
    }, [authUser]);
    
    // --- User-specific, persisted state ---
    const [budget, setBudget] = useState<BudgetCategory[]>(mockBudget);
    const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(mockPurchaseRequests);
    
    // --- Other state ---
    const [isPremium, setIsPremium] = useState(false);
    const [ads, setAds] = useState<MerchantAd[]>(mockAds);
    const [orders, setOrders] = useState<Order[]>(mockOrders);
    const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);

    // --- DATA PERSISTENCE HOOKS ---

    // Load user data on user change
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (!user) {
                setBudget([]);
                setFixedExpenses([]);
                setGoals([]);
                setPurchaseRequests([]);
                setOrders([]);
                setTransactions([]);
                return;
            }
            try {
                const [bRes, fRes, gRes] = await Promise.all([
                    api.listBudgetCategories(user.id),
                    api.listFixedExpenses(user.id),
                    api.listGoals(user.id),
                ]);
                if (cancelled) return;
                setBudget((bRes.ok && Array.isArray(bRes.data?.items)) ? bRes.data.items : []);
                setFixedExpenses((fRes.ok && Array.isArray(fRes.data?.items)) ? fRes.data.items : []);
                setGoals((gRes.ok && Array.isArray(gRes.data?.items)) ? gRes.data.items : []);
                setPurchaseRequests([]);
                setOrders([]);
                setTransactions([]);
                const dataKey = `ventyUserData_${user.id}`;
                localStorage.setItem(dataKey, JSON.stringify({
                    budget,
                    fixedExpenses,
                    goals,
                    purchaseRequests,
                    orders,
                    transactions
                }));
            } catch {
                if (cancelled) return;
                setBudget([]);
                setFixedExpenses([]);
                setGoals([]);
                setPurchaseRequests([]);
                setOrders([]);
                setTransactions([]);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [user]);

    // Save user data whenever it changes
    useEffect(() => {
        if (user && onboardingComplete && !user.isGuest) { // Skip saving for Guest mode
            const dataKey = `ventyUserData_${user.id}`;
            const dataToSave = {
                budget,
                fixedExpenses,
                goals,
                purchaseRequests,
                orders,
                transactions
            };
            localStorage.setItem(dataKey, JSON.stringify(dataToSave));
        }
    }, [user, budget, fixedExpenses, goals, purchaseRequests, orders, transactions, onboardingComplete]);


    const handleLogin = useCallback((onboardingData: Partial<User>) => {
        const isGuest = !!onboardingData.isGuest;
        const guestId = `guest_${Math.random().toString(36).slice(2, 10)}`;
        const baseId = isGuest ? guestId : (onboardingData.id || `user_${Date.now()}`);
        const fullUser: User = {
            id: baseId,
            name: onboardingData.name || 'User',
            age: onboardingData.age,
            occupation: onboardingData.occupation,
            profilePictureUrl: onboardingData.profilePictureUrl,
            role: 'Parent',
            isFamilyHead: (onboardingData.accountPlan === 'family') ? true : false,
            familyId: onboardingData.familyId,
            salary: Number(onboardingData.salary) || 0,
            familyMembers: Number(onboardingData.familyMembers) || 1,
            priorities: [],
            nonEssentials: [],
            email: onboardingData.email || '',
            accountType: onboardingData.accountType || 'regular',
            accountPlan: onboardingData.accountPlan || 'single',
            merchantProfile: onboardingData.merchantProfile,
            contactInfo: { phone: '', address: '', preferredMeetup: '' },
            inventory: [],
            orderHistory: [],
            termsAcceptedVersion: undefined,
            termsAcceptedAt: undefined,
            isGuest,
            isVerified: false,
            primarySpendingCategory: onboardingData.primarySpendingCategory,
            currency: onboardingData.currency || 'USD',
            langCode: onboardingData.langCode || 'en',
            countryCode: onboardingData.countryCode || 'US',
            referralCode: onboardingData.referralCode,
        };
        setUser(fullUser);
        localStorage.setItem('ventyUser', JSON.stringify(fullUser));
        localStorage.setItem('onboardingComplete', isGuest ? 'true' : 'false');
        setOnboardingComplete(isGuest ? true : false);
    }, []);
    
    const handleOnboardingFinish = useCallback((data: { fixedExpenses: FixedExpense[], newBudget: BudgetCategory[], goals: Goal[], salary?: number }) => {
        let finalUser = user;
        if (data.salary && user) {
            const updatedUser = { ...user, salary: data.salary };
            setUser(updatedUser);
            localStorage.setItem('ventyUser', JSON.stringify(updatedUser));
            finalUser = updatedUser;
        }

        setFixedExpenses(data.fixedExpenses);
        setGoals(data.goals);

        if (data.newBudget && data.newBudget.length > 0) {
            setBudget(data.newBudget);
        } else if (finalUser) {
            const disposableIncome = finalUser.salary - data.fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            setBudget(generateInitialBudget(disposableIncome));
        }

        localStorage.setItem('onboardingComplete', 'true');
        setOnboardingComplete(true);
        Promise.resolve().then(() => {
            showToast("AI Assistant setup complete. Your personal financial dashboard is now ready.");
            navigate('/dashboard');
        });
    }, [user, navigate, showToast]);


    const handleLogout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('ventyUser');
        localStorage.removeItem('onboardingComplete');
        setOnboardingComplete(false);
    }, []);

    const handleSwitchUser = useCallback(() => {
        setUser(prevUser => {
            if (!prevUser) return null;
            const isSwitchingToMerchant = prevUser.accountType !== 'merchant';
            const newUser = isSwitchingToMerchant ? { ...mockMerchantUser, id: prevUser.id } : { ...mockUser, id: prevUser.id };
            document.documentElement.setAttribute('data-account-type', newUser.accountType);
            localStorage.setItem('ventyUser', JSON.stringify(newUser));
            
            Promise.resolve().then(() => {
                showToast(`Switched to ${isSwitchingToMerchant ? 'Merchant' : 'Regular'} mode`, 'info');
                navigate(isSwitchingToMerchant ? '/merchant/dashboard' : '/dashboard');
            });

            return newUser;
        });
    }, [navigate, showToast]);
    
    const handlePaymentSuccess = useCallback((details: any) => {
        if (details.for === 'premium_subscription') setIsPremium(true);
        if (details.for === 'verified_badge' && user) setUser({ ...user, isVerified: true });
        if (details.for === 'merchant_verification' && user?.merchantProfile) {
            setUser({ ...user, merchantProfile: { ...user.merchantProfile, isVerified: true, verificationType: 'paid' } });
        }
        if (details.for === 'ad_subscription' && user?.merchantProfile) {
            const planId = details.planDetails.planId as AdPlanId;
            let activeFeatures: AdType[] = [];
            switch(planId) {
                case 'premium':
                    activeFeatures = ['product', 'banner', 'carousel', 'video', 'store_feature'];
                    break;
                case 'pro':
                    activeFeatures = ['product', 'banner', 'carousel'];
                    break;
                case 'basic':
                    activeFeatures = ['product'];
                    break;
            }

            setUser({ ...user, merchantProfile: { ...user.merchantProfile, subscription: details.planDetails, activeFeatures } });
            showToast("Subscription activated successfully!", 'success');
            navigate('/marketing', { state: { fromPayment: true } });
            return;
        }
        Promise.resolve().then(() => {
            navigate(user?.accountType === 'merchant' ? '/merchant/dashboard' : '/dashboard');
        });
    }, [user, navigate, showToast]);

    const handleReviewRequest = useCallback((requestId: string, decision: 'approved' | 'rejected') => {
        setPurchaseRequests(prev =>
            prev.map(req =>
                req.id === requestId
                    ? { ...req, status: decision, reviewedBy: user?.name, reviewedAt: new Date().toISOString() }
                    : req
            )
        );
        showToast(`Request has been ${decision}.`, decision === 'approved' ? 'success' : 'error');
    }, [user?.name, showToast]);
    
    const handleSendPurchaseRequest = useCallback((product: Product, note: string) => {
        const newRequest: PurchaseRequest = {
            id: `req_${Date.now()}`,
            familyId: user?.familyId || 'fam1',
            guestId: user!.id,
            guestName: user!.name,
            productId: product.id,
            productTitle: product.title,
            productImageUrl: product.imageUrl,
            productPrice: product.price,
            note,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };
        setPurchaseRequests(prev => [newRequest, ...prev]);
        Promise.resolve().then(() => {
            showToast("Your purchase request has been sent to the family head for review.", 'info');
            navigate('/family');
        });
    }, [user, navigate, showToast]);

    const handleCancelOrder = useCallback((orderId: string) => {
        setOrders(prevOrders => prevOrders.map(order => 
            order.id === orderId ? { ...order, status: 'cancelled' } : order
        ));
        showToast(`Order #${orderId.split('-')[1]} has been cancelled.`, 'warning');
    }, [showToast]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-bg-primary">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    if (!authUser) {
        return (
            <Suspense fallback={<div className="flex h-screen items-center justify-center bg-bg-primary"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div></div>}>
                <Routes>
                    <Route path="/auth" element={<AuthScreen />} />
                    <Route path="*" element={<Navigate to="/auth" replace />} />
                </Routes>
            </Suspense>
        );
    }

    return (
        <AnimatePresence mode="wait">
            {!user ? (
                <Routes>
                    <Route path="/terms" element={<TermsScreen />} />
                    <Route path="/privacy" element={<PrivacyPolicyScreen />} />
                    <Route path="*" element={<OnboardingScreen onComplete={handleLogin} onJoinFamily={() => {}} onExploreAsGuest={() => handleLogin({isGuest: true})} />} />
                </Routes>
            ) : !onboardingComplete ? (
                 <Routes>
                    <Route path="*" element={<OnboardingAISetupScreen user={user} budget={budget} onComplete={handleOnboardingFinish} isOnboarding />} />
                </Routes>
            ) : (
                <Routes>
                    <Route path="/" element={<AppLayout user={user} isPremiumUser={isPremium} budget={budget} />}>
                        <Route index element={<Navigate to={user.accountType === 'merchant' ? '/merchant/dashboard' : '/dashboard'} replace />} />
                        <Route path="dashboard" element={<DashboardScreen user={user} isPremiumUser={isPremium} transactions={transactions} budget={budget} fixedExpenses={fixedExpenses} />} />
                        
                        <Route path="budget" element={<BudgetScreen user={user} initialBudget={budget} setGlobalBudget={setBudget} fixedExpenses={fixedExpenses} totalIncomeForBudget={user ? user.salary - fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0) : 0} goals={goals} />} />
                        
                        <Route path="financial-snapshot" element={<FinancialSnapshotScreen user={user} budget={budget} fixedExpenses={fixedExpenses} transactions={transactions} goals={goals} />} />
                        <Route path="goals" element={<GoalsScreen user={user} isPremium={isPremium} onUpgrade={() => navigate('/payment', { state: { for: 'premium_subscription', amount: 22, description: 'Venty Premium Subscription' } })} goals={goals} setGoals={setGoals} />} />
                        <Route path="goals/invest" element={<InvestmentScreen user={user} isPremiumUser={isPremium} />} />
                        <Route path="market" element={<MarketplaceScreen user={user} ads={ads} />} />
                        <Route path="product/:productId" element={<ProductDetailScreen user={user} />} />
                        <Route path="cart" element={<CartScreen user={user} onCheckout={() => navigate('/payment')} />} />
                        <Route path="favourites" element={<FavouritesScreen user={user} />} />
                        <Route path="family" element={<FamilyScreen user={user} family={mockFamily} onUpdateFamily={() => {}} purchaseRequests={purchaseRequests} />} />
                        <Route path="family/coordinate" element={<FamilyChatScreen user={user} family={mockFamily} />} />
                        <Route path="family/review" element={<FamilyRequestsScreen user={user} requests={purchaseRequests} onReview={handleReviewRequest} />} />
                        <Route path="settings" element={<SettingsScreen user={user} setUser={setUser} isPremiumUser={isPremium} onSwitchUser={handleSwitchUser} onLogout={handleLogout} onUpgrade={() => navigate('/payment', { state: { for: 'premium_subscription', amount: 22, description: 'Venty Premium Subscription' } })} />} />
                        <Route path="exchange" element={<ExchangeListScreen user={user} />} />
                        <Route path="exchange/post" element={<ExchangePostScreen user={user} />} />
                        <Route path="exchange/chat/:chatId" element={<ExchangeChatScreen currentUser={user} />} />
                        <Route path="messages" element={<MessagesScreen currentUser={user} />} />
                        <Route path="chat/:chatId" element={<UnifiedChatScreen currentUser={user} />} />
                        <Route path="more" element={<MoreScreen user={user} />} />
                        <Route path="my-orders" element={<MyOrdersScreen user={user} orders={orders} onCancelOrder={handleCancelOrder} />} />
                        <Route path="payment-methods" element={<PaymentMethodsScreen user={user} />} />
                        <Route path="referral" element={<ReferralScreen user={user} />} />
                        <Route path="support" element={<SupportScreen user={user} />} />

                        <Route path="merchant" element={<MerchantLayout user={user} />}>
                            <Route path="dashboard" element={<MerchantDashboardScreen user={user} />} />
                            <Route path="store-setup" element={<StoreSetupScreen user={user} onSave={(config: StoreConfig) => {}} />} />
                            <Route path="products" element={<ProductManagementScreen user={user} />} />
                            <Route path="orders" element={<OrderManagementScreen user={user} />} />
                        </Route>
                        <Route path="merchant/terms" element={<MerchantTermsScreen user={user} />} />
                        <Route path="marketing" element={<MarketingDashboard user={user} ads={ads} onCreateAd={(ad) => setAds(prev => [ad, ...prev])} />} />
                        <Route path="request-purchase" element={<PurchaseRequestScreen user={user} onSendRequest={handleSendPurchaseRequest} />} />
                        <Route path="payment-history" element={<PaymentHistoryScreen user={user} />} />
                        <Route path="shop/:merchantSlug" element={<MerchantStoreScreen user={user} ads={ads} />} />
                        <Route path="*" element={<Navigate to={user.accountType === 'merchant' ? '/merchant/dashboard' : '/dashboard'} replace />} />
                    </Route>
                    <Route path="payment" element={<PaymentScreen user={user} onPaymentSuccess={handlePaymentSuccess} />} />
                    <Route path="merchant/onboard" element={<MerchantOnboardingScreen user={user} onComplete={(profile) => {
                        setUser(u => {
                            if (!u) return u;
                            const updated = { ...u, merchantProfile: profile };
                            try { localStorage.setItem(`merchantTermsAccepted_${u.id}`, 'true'); } catch {}
                            return updated;
                        });
                        navigate('/merchant/dashboard', { replace: true });
                    }} />} />
                    <Route path="/terms" element={<TermsScreen />} />
                    <Route path="/privacy" element={<PrivacyPolicyScreen />} />
                    {/* Fallback for logged-in users to prevent "No route matched" errors */}
                    <Route path="*" element={<Navigate to={user.accountType === 'merchant' ? '/merchant/dashboard' : '/dashboard'} replace />} />
                </Routes>
            )}
        </AnimatePresence>
    );
};


const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <ToastProvider>
                    <PerformanceProvider>
                        <LocalizationProvider>
                            <CartProvider>
                                <FavouritesProvider>
                                    <ErrorBoundary>
                                        <HashRouter>
                                            <AppContent />
                                        </HashRouter>
                                    </ErrorBoundary>
                                    <CookieBanner />
                                    <Toast />
                                </FavouritesProvider>
                            </CartProvider>
                        </LocalizationProvider>
                    </PerformanceProvider>
                </ToastProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
