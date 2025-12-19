import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ExchangeItem } from '../types';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';
import VentyButton from '../components/VentyButton';
import { PhotoIcon } from '@heroicons/react/24/solid';
import { useLocalization } from '../hooks/useLocalization';

interface ExchangePostScreenProps {
    user: User;
}

const itemTypes: ExchangeItem['type'][] = ['item', 'crypto', 'currency'];
const exchangeCategories = ["Electronics", "Clothing", "Books", "Home", "Sports", "Cars", "Other"];

const ExchangePostScreen: React.FC<ExchangePostScreenProps> = ({ user }) => {
    const navigate = useNavigate();
    const { currency } = useLocalization();
    const [title, setTitle] = useState('');
    const [itemType, setItemType] = useState<ExchangeItem['type']>('item');
    const [quantity, setQuantity] = useState('1');
    const [condition, setCondition] = useState<'New' | 'Like New' | 'Good' | 'Used'>('Good');
    const [description, setDescription] = useState('');
    const [wantedItems, setWantedItems] = useState('');
    const [estValue, setEstValue] = useState('');
    const [category, setCategory] = useState('Electronics');
    const [expiresIn, setExpiresIn] = useState('30'); // in days

    const canPublish = title && quantity && description && wantedItems && estValue && category && expiresIn;

    const handlePublish = () => {
        if (!canPublish) return;
        // In a real app, this would write to a database.
        alert(`Item "${title}" has been published to the exchange market! (Simulation)`);
        navigate('/exchange');
    };

    return (
        <PageLayout title="Post an Item for Exchange">
            <div className="p-4 lg:p-6 space-y-4">
                <Card>
                    <div className="space-y-4">
                        <div>
                            <label className="font-medium block mb-1">Upload Photos</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border-primary border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <PhotoIcon className="mx-auto h-12 w-12 text-text-tertiary" />
                                    <div className="flex text-sm text-text-secondary">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-bg-secondary rounded-md font-medium text-brand-primary hover:text-blue-700">
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-text-tertiary">PNG, JPG up to 10MB</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="title" className="font-medium block mb-1">Title</label>
                                <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Slightly Used Bluetooth Speaker" className="w-full"/>
                            </div>
                            <div>
                                <label htmlFor="itemType" className="font-medium block mb-1">Item Type</label>
                                <select id="itemType" value={itemType} onChange={e => setItemType(e.target.value as ExchangeItem['type'])} className="w-full">
                                    {itemTypes.map(type => <option key={type} value={type} className="capitalize">{type}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="category" className="font-medium block mb-1">Category</label>
                                <select id="category" value={category} onChange={e => setCategory(e.target.value)} className="w-full">
                                    {exchangeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="estValue" className="font-medium block mb-1">Estimated Value ({currency})</label>
                                <input id="estValue" type="number" value={estValue} onChange={e => setEstValue(e.target.value)} placeholder="e.g., 500" className="w-full"/>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="quantity" className="font-medium block mb-1">Quantity</label>
                                <input id="quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="1" className="w-full"/>
                            </div>
                            <div>
                                <label htmlFor="condition" className="font-medium block mb-1">Condition</label>
                                <select id="condition" value={condition} onChange={e => setCondition(e.target.value as any)} className="w-full">
                                    <option>New</option>
                                    <option>Like New</option>
                                    <option>Good</option>
                                    <option>Used</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="font-medium block mb-1">Description</label>
                            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe your item, its condition, and any notable features." className="w-full"></textarea>
                        </div>
                        
                        <div>
                            <label htmlFor="wantedItems" className="font-medium block mb-1">What you want in return</label>
                            <textarea id="wantedItems" value={wantedItems} onChange={e => setWantedItems(e.target.value)} rows={2} placeholder="e.g., A gaming mouse, a collection of books, etc." className="w-full"></textarea>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="expiresIn" className="font-medium block mb-1">Listing Duration</label>
                                <select id="expiresIn" value={expiresIn} onChange={e => setExpiresIn(e.target.value)} className="w-full">
                                    <option value="7">7 Days</option>
                                    <option value="15">15 Days</option>
                                    <option value="30">30 Days</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="location" className="font-medium block mb-1">Your Location</label>
                                <input id="location" type="text" value={user.contactInfo.address} readOnly disabled className="w-full cursor-not-allowed"/>
                            </div>
                        </div>

                        <div className="pt-2">
                             <VentyButton onClick={handlePublish} disabled={!canPublish}>Publish Item</VentyButton>
                        </div>
                    </div>
                </Card>
            </div>
        </PageLayout>
    );
};

export default ExchangePostScreen;
