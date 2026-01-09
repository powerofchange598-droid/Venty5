
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
import { mockFamily, mockAds, mockPurchaseRequests } from './data/mockData';
import { api } from './lib/api';
import { generateInitialBudget } from './utils/budgetGenerator';

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
    const { user, loading, logout, updateUser, loginAsGuest, signUpWithEmail } = useAuth();
    
    // Track if we are in the middle of a signup flow (to show Terms/Biometrics)
    const [isSignupFlow, setIsSignupFlow] = useState(false);
    
    const [onboardingComplete, setOnboardingComplete] = useState(() => localStorage.getItem('onboardingComplete') === 'true');
    
    // --- User-specific, persisted state ---
    const [budget, setBudget] = useState<BudgetCategory[]>([]);
    const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(mockPurchaseRequests);
    
    // --- Other state ---
    const [isPremium, setIsPremium] = useState(false);
    const [ads, setAds] = useState<MerchantAd[]>(mockAds);
    const [orders, setOrders] = useState<Order[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    // Load user data on user change
    useEffect(() => {
        let canceled = false;
        const load = async () => {
            if (!user) {
                setBudget([]);
                setFixedExpenses([]);
                setGoals([]);
                setPurchaseRequests(mockPurchaseRequests);
                setOrders([]);
                setTransactions([]);
                return;
            }
            try {
                const res = await api.getUserData(user.id);
                if (canceled) return;
                const data = (res as any)?.data?.data || {};
                setBudget(Array.isArray(data.budget) ? data.budget : []);
                setFixedExpenses(Array.isArray(data.fixedExpenses) ? data.fixedExpenses : []);
                setGoals(Array.isArray(data.goals) ? data.goals : []);
                const txRes = await api.listTransactions(user.id);
                if (!canceled) {
                    const txItems = (txRes as any)?.data?.items || [];
                    setTransactions(Array.isArray(txItems) ? txItems : []);
                }
                const isCompleted = localStorage.getItem('onboardingComplete') === 'true';
                setOnboardingComplete(isCompleted);
            } catch {
                // Fallback: keep minimal local state without mock data
                setBudget([]);
                setFixedExpenses([]);
                setGoals([]);
                setTransactions([]);
            }
        };
        load();
        return () => { canceled = true; };
    }, [user]);

    // Save user data whenever it changes
    useEffect(() => {
        if (user && onboardingComplete && !user.isGuest) {
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

    const handleSignupWrapper = useCallback(async (email: string, pass: string) => {
        setIsSignupFlow(true);
        return await signUpWithEmail(email, pass);
    }, [signUpWithEmail]);

    const handleLogin = useCallback((onboardingData?: Partial<User>) => {
        if (onboardingData?.isGuest) {
            loginAsGuest();
        } else {
            // Finished signup flow (Terms/Biometrics)
            setIsSignupFlow(false);
        }
    }, [loginAsGuest]);
    
    const handleOnboardingFinish = useCallback((data: { fixedExpenses: FixedExpense[], newBudget: BudgetCategory[], goals: Goal[], salary?: number }) => {
        let finalUser = user;
        if (data.salary && user) {
            updateUser({ salary: data.salary });
            finalUser = { ...user, salary: data.salary } as User;
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
    }, [user, navigate, showToast, updateUser]);


    const handleLogout = useCallback(() => {
        logout();
        localStorage.removeItem('onboardingComplete');
        setOnboardingComplete(false);
        setIsSignupFlow(false);
        navigate('/');
    }, [logout, navigate]);

    const handleSwitchUser = useCallback(() => {
        if (!user) return;
        const isCurrentlyMerchant = user.accountType === 'merchant';
        const newType = isCurrentlyMerchant ? 'regular' : 'merchant';
        
        updateUser({ accountType: newType });
        document.documentElement.setAttribute('data-account-type', newType);
        
        showToast(`Switched to ${newType === 'merchant' ? 'Merchant' : 'Regular'} mode`, 'info');
        navigate(newType === 'merchant' ? '/merchant/dashboard' : '/dashboard');
    }, [user, navigate, showToast, updateUser]);
    
    const handlePaymentSuccess = useCallback((details: any) => {
        if (details.for === 'premium_subscription') setIsPremium(true);
        if (details.for === 'verified_badge' && user) updateUser({ isVerified: true });
        if (details.for === 'merchant_verification' && user?.merchantProfile) {
            updateUser({ merchantProfile: { ...user.merchantProfile, isVerified: true, verificationType: 'paid' } });
        }
        if (details.for === 'ad_subscription' && user?.merchantProfile) {
            const planDetails = details.planDetails;
            const planId = planDetails.planId as AdPlanId;
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

            updateUser({ merchantProfile: { ...user.merchantProfile, subscription: planDetails, activeFeatures } });
            showToast("Subscription activated successfully!", 'success');
            navigate('/marketing', { state: { fromPayment: true } });
            return;
        }
        Promise.resolve().then(() => {
            navigate(user?.accountType === 'merchant' ? '/merchant/dashboard' : '/dashboard');
        });
    }, [user, navigate, showToast, updateUser]);

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
    
    const handleDeleteAccount = useCallback(async () => {
        if (!user) return;
        try {
            await fetch(`/api/users/${encodeURIComponent(user.id)}`, { method: 'DELETE' });
            showToast('Your account has been deleted.', 'warning');
            handleLogout();
        } catch {
            showToast('Failed to delete account. Please try again.', 'error');
        }
    }, [user, showToast, handleLogout]);

    return (
        <AnimatePresence mode="wait">
            {!user || isSignupFlow ? (
                <Routes>
                    <Route path="/terms" element={<TermsScreen />} />
                    <Route path="/privacy" element={<PrivacyPolicyScreen />} />
                    <Route path="*" element={<OnboardingScreen onComplete={handleLogin} onJoinFamily={() => {}} onExploreAsGuest={() => handleLogin({isGuest: true})} onSignUp={handleSignupWrapper} />} />
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
                        <Route path="family" element={<FamilyScreen user={user} family={mockFamily} onUpdateFamily={() => {}} purchaseRequests={purchaseRequests} transactions={transactions} />} />
                        <Route path="family/coordinate" element={<FamilyChatScreen user={user} family={mockFamily} />} />
                        <Route path="family/review" element={<FamilyRequestsScreen user={user} requests={purchaseRequests} onReview={handleReviewRequest} />} />
                        <Route path="settings" element={<SettingsScreen user={user} setUser={(u: User) => updateUser(u)} isPremiumUser={isPremium} onSwitchUser={handleSwitchUser} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} onUpgrade={() => navigate('/payment', { state: { for: 'premium_subscription', amount: 22, description: 'Venty Premium Subscription' } })} />} />
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
                        updateUser({ merchantProfile: profile });
                        try { localStorage.setItem(`merchantTermsAccepted_${user.id}`, 'true'); } catch {}
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
