import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Family, ChatMessage } from '../types';
import Card from '../components/Card';
import VentyButton from '../components/VentyButton';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import PageLayout from '../components/PageLayout';

interface FamilyChatScreenProps {
    user: User;
    family: Family;
}

const FamilyChatScreen: React.FC<FamilyChatScreenProps> = ({ user, family }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        const text = newMessage.trim();
        if (!text) return;
        
        const newMsg: ChatMessage = {
            id: `msg${messages.length + 1}`,
            userId: user.id,
            userName: user.name,
            message: text,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            lang: 'en',
        };
        setMessages([...messages, newMsg]);
        setNewMessage('');
    };

    return (
        <PageLayout title="Family Hub">
            <div className="flex h-full">
                <aside className="w-64 border-r border-border-primary p-4 hidden md:block">
                    <h3 className="font-bold text-lg mb-4">Family Members</h3>
                    <div className="space-y-3">
                        {family.members.map(m => (
                            <div key={m.id} className="p-3 rounded-lg bg-bg-secondary">
                                <p className="font-semibold">{m.name}</p>
                                <p className="text-xs text-text-secondary">{m.isFamilyHead ? 'Head' : 'Member'}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 space-y-2">
                        <VentyButton onClick={() => navigate('/family/review')} className="!w-full">
                            {user.isFamilyHead ? 'Review Requests' : 'My Requests'}
                        </VentyButton>
                        <VentyButton onClick={() => navigate('/family')} variant="secondary" className="!w-full">
                            Back to Family Overview
                        </VentyButton>
                    </div>
                </aside>
                <main className="flex-1 flex flex-col">
                    <header className="p-4 border-b border-border-primary">
                        <h2 className="text-xl font-bold text-center">Family Chat</h2>
                    </header>
                    <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
                        {messages.map((msg) => {
                            const isCurrentUser = msg.userId === user.id;
                            const sender = family.members.find(m => m.id === msg.userId);
                            return (
                                <div key={msg.id} className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${isCurrentUser ? 'bg-brand-primary text-white rounded-br-none' : 'bg-bg-secondary rounded-bl-none'}`}>
                                        {!isCurrentUser && <p className="font-bold text-sm mb-1">{sender?.name}</p>}
                                        <p>{msg.message}</p>
                                        <p className={`text-xs mt-1 text-right ${isCurrentUser ? 'text-gray-300' : 'text-text-secondary'}`}>{msg.timestamp}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="p-4 border-t border-border-primary">
                        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                            <input
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder="Request item (e.g., 'Buy milk $5')"
                                className="w-full"
                            />
                            <VentyButton htmlType="submit" onClick={() => {}} className="!p-3 !w-auto"><PaperAirplaneIcon className="h-5 w-5"/></VentyButton>
                        </form>
                    </div>
                </main>
            </div>
        </PageLayout>
    );
}

export default FamilyChatScreen;
