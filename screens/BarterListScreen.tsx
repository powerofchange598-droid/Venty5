import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import VentyButton from '../components/VentyButton';
import { User, ExchangeItem } from '../types';
import { mockExchangeItems } from '../data/mockData';
import { PlusIcon, ChatBubbleOvalLeftEllipsisIcon, XMarkIcon, CheckCircleIcon, ArrowsRightLeftIcon, GlobeAltIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import PageLayout from '../components/PageLayout';
import { useNavigate } from 'react-router-dom';
import { TOP_100_COUNTRIES } from '../data/TOP_100_COUNTRIES';
import { useLocalization } from '../hooks/useLocalization';

interface ExchangeModalProps {
    item: ExchangeItem;
    user: User;
    onClose: () => void;
}

const ExchangeModal: React.FC<ExchangeModalProps> = ({ item, user, onClose }) => {
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [cashAdjustment, setCashAdjustment] = useState(0);
    const [offerType, setOfferType] = useState<'offer' | 'request'>('offer');
    const navigate = useNavigate();
    const { formatCurrency } = useLocalization();
    
    const toggleItemSelection = (itemId: string) => {
        setSelectedItems(prev => 
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleSendOffer = () => {
        let offerText = `You offered ${selectedItems.length} item(s)`;
        const finalCash = offerType === 'offer' ? cashAdjustment : -cashAdjustment;
        if (finalCash > 0) {
            offerText += ` and an extra ${formatCurrency(finalCash)}`;
        } else if (finalCash < 0) {
            offerText += ` and requested an extra ${formatCurrency(Math.abs(finalCash))}`;
        }
        offerText += ` for ${item.title}.`;
        alert(`Offer sent! (Simulation)\n\n${offerText}`);
        onClose();
    };
    
    if (item.ownerCountryCode !== user.countryCode) {
        const itemCountry = TOP_100_COUNTRIES.find(c => c.code === item.ownerCountryCode);
        return (
            <div className="fixed inset-0 modal-backdrop backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={onClose}>
                <div className="bg-bg-secondary rounded-xl shadow-lg max-w-md w-full animate-cinematic-enter" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 border-b border-bg-tertiary flex justify-between items-center">
                        <h2 className="text-xl font-bold">Exchange Unavailable</h2>
                        <button onClick={onClose}><XMarkIcon className="h-6 w-6" /></button>
                    </div>
                    <div className="p-6 text-center space-y-3">
                        <p className="text-lg">This item is located in a different country ({itemCountry?.en} {item.ownerCountryFlag}).</p>
                        <p className="text-text-secondary">To ensure fair and easy trades, exchanging is only available between users in the same country.</p>
                        <VentyButton onClick={() => { onClose(); navigate('/settings'); }} variant="secondary" label="Change My Country"></VentyButton>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 modal-backdrop backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={onClose}>
            <div className="bg-bg-secondary rounded-xl shadow-lg max-w-md w-full animate-cinematic-enter flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-bg-tertiary flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold">Propose Exchange</h2>
                    <button onClick={onClose}><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <p className="text-sm text-text-secondary">You are making an offer for:</p>
                        <div className="flex items-center space-x-3 p-2 rounded-lg bg-bg-primary mt-1">
                            <img src={item.imageUrl} alt={item.title} className="w-12 h-12 rounded-md object-cover" loading="lazy" />
                            <div>
                                <p className="font-semibold">{item.title}</p>
                                <p className="text-xs text-text-secondary">Est. Value: {formatCurrency(item.est_value)}</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="font-medium">1. Select item(s) from your inventory to offer:</p>
                        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-2">
                             {user.inventory.map(invItem => {
                                const isSelected = selectedItems.includes(invItem.id);
                                return (
                                    <div 
                                        key={invItem.id} 
                                        onClick={() => toggleItemSelection(invItem.id)}
                                        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer border-2 ${isSelected ? 'border-brand-primary bg-brand-primary/10' : 'border-transparent bg-bg-primary'}`}
                                    >
                                        <img src={invItem.imageUrl} alt={invItem.title} className="w-10 h-10 rounded-md object-cover" loading="lazy" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-sm">{invItem.title}</p>
                                            <p className="text-xs text-text-secondary">Est. Value: {formatCurrency(invItem.est_value)}</p>
                                        </div>
                                        {isSelected && <CheckCircleIcon className="h-6 w-6 text-brand-primary" />}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div>
                        <p className="font-medium">2. Add cash adjustment (optional):</p>
                        <div className="flex items-center space-x-2 mt-1">
                            <select value={offerType} onChange={e => setOfferType(e.target.value as 'offer' | 'request')} className="p-2 bg-bg-primary rounded-lg border border-bg-tertiary">
                                <option value="offer">I will add</option>
                                <option value="request">I will request</option>
                            </select>
                            <input type="number" value={cashAdjustment} onChange={e => setCashAdjustment(parseInt(e.target.value) || 0)} className="w-full p-2 bg-bg-primary rounded-lg border border-bg-tertiary" />
                            <span className="font-semibold">{user.currency}</span>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-bg-secondary mt-auto flex-shrink-0">
                    <VentyButton onClick={handleSendOffer} variant="primary" disabled={selectedItems.length === 0} label="Send Offer"></VentyButton>
                </div>
            </div>
        </div>
    );
};

const exchangeCategories = ["All", "Electronics", "Clothing", "Books", "Home", "Sports", "Cars", "Other"];

const ExchangeListScreen: React.FC<{ user: User }> = ({ user }) => {
    const [exchangeItemForModal, setExchangeItemForModal] = useState<ExchangeItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const navigate = useNavigate();

    const localizedExchangeItems = useMemo(() => {
        return mockExchangeItems.filter(p => p.ownerId !== user.id && p.ownerCountryCode === user.countryCode);
    }, [user.id, user.countryCode]);
    
    const filteredListings = useMemo(() => {
        let items = [...localizedExchangeItems];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            items = items.filter(p => 
                p.title.toLowerCase().includes(term) || 
                p.description.toLowerCase().includes(term) || 
                p.wantedItems.toLowerCase().includes(term)
            );
        }

        if (activeCategory !== 'All') {
            items = items.filter(p => p.category === activeCategory);
        }
        
        // Default sorting (e.g., by popularity or expiration date)
        items.sort((a, b) => b.popularityScore - a.popularityScore);

        return items;
    }, [localizedExchangeItems, searchTerm, activeCategory]);
    
    const userCountry = useMemo(() => TOP_100_COUNTRIES.find(c => c.code === user.countryCode), [user.countryCode]);

    const handleChat = (item: ExchangeItem) => {
        const chatId = `chat1`; 
        navigate(`/exchange/chat/${chatId}`);
    };
    
    return (
        <PageLayout title="Exchange Market">
            <div className="p-4 lg:p-6 space-y-4">
                <Card className="!p-3 bg-brand-primary/10 flex items-center space-x-3 border-l-4 border-brand-primary">
                    <GlobeAltIcon className="h-6 w-6 text-brand-primary flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-text-primary">Showing listings from {userCountry?.en} {userCountry?.flag}</p>
                        <p className="text-sm text-text-secondary">The Exchange is localized to your country for easier trades.</p>
                    </div>
                </Card>

                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary"/>
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search for items..." className="w-full p-3 pl-10 bg-bg-secondary rounded-lg border border-bg-tertiary"/>
                </div>
                
                <div className="swipe-scroller -mx-4 px-4">
                    {exchangeCategories.map(cat => (
                        <VentyButton 
                            key={cat} 
                            onClick={() => setActiveCategory(cat)} 
                            variant="ghost"
                            className={`pill snap-start !px-4 !py-2 ${activeCategory === cat ? 'active' : ''}`}
                        >
                            {cat}
                        </VentyButton>
                    ))}
                </div>

                {filteredListings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                        {filteredListings.map(item => (
                            <Card key={item.id} className="flex flex-col">
                                <img src={item.imageUrl} alt={item.title} className="w-full h-40 rounded-lg object-cover" loading="lazy" />
                                <div className="flex-grow mt-4">
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary capitalize">{item.type}</span>
                                    <h3 className="font-bold text-lg mt-1">{item.title}</h3>
                                    <p className="text-sm text-text-secondary">by {item.ownerName}</p>
                                    <p className="text-sm text-text-secondary mt-1">Wants: {item.wantedItems}</p>
                                </div>
                                <div className="flex justify-end items-center mt-4 space-x-2">
                                    <VentyButton onClick={() => handleChat(item)} variant="secondary" className="!w-auto !py-2 !px-4 !text-sm !font-semibold">
                                        <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" onClick={() => {}}/>
                                    </VentyButton>
                                    <VentyButton onClick={() => setExchangeItemForModal(item)} variant="primary" className="!w-auto !py-2 !px-4 !text-sm !font-semibold flex items-center space-x-2">
                                        <ArrowsRightLeftIcon className="h-5 w-5" onClick={() => {}}/>
                                        <span>Make Offer</span>
                                    </VentyButton>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-12">
                        <p className="text-text-secondary">No exchange items found matching your criteria.</p>
                    </Card>
                )}
                
                {exchangeItemForModal && <ExchangeModal item={exchangeItemForModal} user={user} onClose={() => setExchangeItemForModal(null)} />}
            </div>
             <VentyButton
                onClick={() => navigate('/exchange/post')}
                variant="primary"
                className="!fixed !bottom-24 lg:!bottom-8 !right-4 lg:!right-8 !p-4 !rounded-full !shadow-lg"
                aria-label="Post new exchange item"
            >
                <PlusIcon className="h-6 w-6" />
            </VentyButton>
        </PageLayout>
    );
};

export default ExchangeListScreen;
