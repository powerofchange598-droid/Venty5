import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User, ExchangeChat, ExchangeChatMessage, Product } from '../types';
import { mockExchangeChats, mockExchangeChatMessages, mockOtherUser, mockProducts, mockUser } from '../data/mockData';
import PageLayout from '../components/PageLayout';
import { PaperAirplaneIcon, CheckCircleIcon, ShieldCheckIcon, EllipsisVerticalIcon, FlagIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { applyChatFilters, detectOffPlatformAttempt } from '../utils/chatHelper';
import { useParams } from 'react-router-dom';
import Card from '../components/Card';
import VerifiedBadge from '../components/VerifiedBadge';
import { useLocalization } from '../hooks/useLocalization';

interface ExchangeChatScreenProps {
    currentUser: User;
}

const ExchangeChatScreen: React.FC<ExchangeChatScreenProps> = ({ currentUser }) => {
    const { chatId } = useParams<{ chatId: string }>();
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const { i18n } = useTranslation();
    const { formatCurrency } = useLocalization();

    // --- State Management ---
    const [chat, setChat] = useState<ExchangeChat | null>(null);
    const [messages, setMessages] = useState<ExchangeChatMessage[]>([]);
    const [item, setItem] = useState<Product | null>(null);
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [showMenuForMessage, setShowMenuForMessage] = useState<string | null>(null);
    const [inputError, setInputError] = useState('');
    const [isChatDisabled, setIsChatDisabled] = useState(false);
    const VIOLATION_KEY = `chat_violations_${currentUser.id}`;


    // --- Effects to load mock data based on route ---
    useEffect(() => {
        const foundChat = mockExchangeChats.find(c => c.id === chatId);
        if (foundChat) {
            setChat(foundChat);
            const foundItem = mockProducts.find(p => p.id === foundChat.itemId);
            setItem(foundItem || null);

            const otherUserId = foundChat.memberIds.find(id => id !== currentUser.id);
            const foundOtherUser = [mockUser, mockOtherUser].find(u => u.id === otherUserId);
            setOtherUser(foundOtherUser || null);

            setMessages(mockExchangeChatMessages.filter(m => m.chatId === chatId));
        }
    }, [chatId, currentUser.id]);
    
    useEffect(() => {
        const violations = parseInt(localStorage.getItem(VIOLATION_KEY) || '0', 10);
        if (violations > 1) {
            setIsChatDisabled(true);
        }
    }, [VIOLATION_KEY]);

    const scrollToBottom = () => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    };
    useEffect(scrollToBottom, [messages]);
    
    // --- Event Handlers ---
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        const textRaw = newMessage.trim();
        if (!textRaw || isChatDisabled) return;

        const securityCheck = detectOffPlatformAttempt(textRaw);
        if (securityCheck.blocked) {
            let violations = parseInt(localStorage.getItem(VIOLATION_KEY) || '0', 10);
            violations++;
            localStorage.setItem(VIOLATION_KEY, violations.toString());
            
            console.log(`Security Violation: User ${currentUser.id} attempted to send '${securityCheck.detectedTerm}'. Violation count: ${violations}`);

            if (violations > 1) {
                setInputError("Your ability to send messages has been permanently restricted due to repeated policy violations.");
                setIsChatDisabled(true);
            } else {
                setInputError("🚫 التواصل خارج التطبيق غير مسموح. This is your first warning.");
            }
            return;
        }
        setInputError('');

        const newMsg: ExchangeChatMessage = {
            id: `bmsg${messages.length + 1}`,
            chatId: chat!.id,
            senderId: currentUser.id,
            senderName: currentUser.name,
            textRaw: textRaw,
            textClean: applyChatFilters(textRaw),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAgreementMessage: false, // This would be determined by more complex logic
            lang: i18n.language.split('-')[0],
        };
        setMessages([...messages, newMsg]);
        setNewMessage('');
    };

    const handleToggleAgreement = (messageId: string) => {
        if (!chat) return;

        const currentUserAgreement = chat.memberAgreements[currentUser.id];
        const newAgreementId = currentUserAgreement === messageId ? null : messageId;

        const updatedAgreements = {
            ...chat.memberAgreements,
            [currentUser.id]: newAgreementId
        };
        
        // Check for mutual agreement
        const otherUserId = chat.memberIds.find(id => id !== currentUser.id)!;
        const otherUserAgreementId = updatedAgreements[otherUserId];
        const status = (newAgreementId && newAgreementId === otherUserAgreementId) ? 'agreed' : 'negotiating';

        setChat({ ...chat, memberAgreements: updatedAgreements, status });
    };

    const handleReport = (messageId: string) => {
        alert(`Message ${messageId} reported. (Simulation)`);
        setShowMenuForMessage(null);
    };

    if (!chat || !item || !otherUser) {
        return <PageLayout title="Loading Chat..."><div className="text-center p-8">Loading...</div></PageLayout>;
    }
    
    const isDealAgreed = chat.status === 'agreed';
    const participants = [currentUser, otherUser];
    
    return (
        <PageLayout title={`Chat with ${otherUser.name}`}>
            <div className="flex flex-col h-[calc(100vh-120px)] lg:h-[calc(100vh-80px)] bg-bg-secondary">
                
                {/* --- Item Header --- */}
                <div className="p-2 border-b border-bg-tertiary flex items-center space-x-3 bg-bg-secondary">
                    <img src={item.imageUrl} alt={item.title} className="w-10 h-10 rounded-md object-cover"/>
                    <div>
                        <p className="text-xs text-text-secondary">Trading for</p>
                        <p className="font-semibold leading-tight">{item.title}</p>
                    </div>
                </div>

                {/* --- Deal Agreed Banner --- */}
                {isDealAgreed && (
                    <div className="p-4 bg-bg-tertiary text-text-primary text-center animate-fadeIn">
                        <h3 className="font-bold text-lg">✅ Deal Locked!</h3>
                        <p className="text-sm">Contact details have been shared below.</p>
                    </div>
                )}
                
                {/* --- Messages Area --- */}
                <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {messages.map((msg) => {
                        const isCurrentUser = msg.senderId === currentUser.id;
                        const sender = participants.find(p => p?.id === msg.senderId);
                        return (
                            <div key={msg.id} className={`group flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                {!isCurrentUser && sender && (
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 self-start bg-text-secondary text-bg-primary flex items-center justify-center font-bold`}>
                                        {sender.name.charAt(0)}
                                    </div>
                                )}
                                <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${isCurrentUser ? 'bg-text-primary text-bg-primary rounded-br-none' : 'bg-bg-primary rounded-bl-none'}`}>
                                     <div className="flex justify-between items-center">
                                        {!isCurrentUser && sender && (
                                            <p className={`text-xs font-bold mb-1 flex items-center space-x-1 text-text-secondary`}>
                                                <span>{sender.name}</span>
                                                <VerifiedBadge user={sender} />
                                            </p>
                                        )}
                                        <span className={`text-xs uppercase ml-2 ${isCurrentUser ? 'text-bg-tertiary' : 'text-text-secondary'}`}>{msg.lang}</span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{isDealAgreed ? msg.textRaw : msg.textClean}</p>
                                    <p className={`text-xs mt-1 ${isCurrentUser ? 'text-bg-tertiary' : 'text-text-secondary'} text-right`}>{msg.timestamp}</p>
                                </div>
                                <div className="self-center flex flex-col items-center space-y-1">
                                    {/* Agreement Checkbox */}
                                    {!isDealAgreed && (
                                        <button onClick={() => handleToggleAgreement(msg.id)} title="Agree to this deal">
                                            <CheckCircleIcon className={`h-6 w-6 transition-colors ${chat.memberAgreements[currentUser.id] === msg.id ? 'text-feedback-success' : 'text-text-tertiary hover:text-text-secondary'}`} />
                                        </button>
                                    )}
                                    {/* Report Menu Button */}
                                    <div className="relative">
                                        <button onClick={() => setShowMenuForMessage(showMenuForMessage === msg.id ? null : msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <EllipsisVerticalIcon className="h-5 w-5 text-text-secondary" />
                                        </button>
                                        {showMenuForMessage === msg.id && (
                                            <div className="absolute bottom-6 right-0 bg-bg-primary border border-bg-tertiary rounded-md shadow-lg z-10">
                                                <button onClick={() => handleReport(msg.id)} className="flex items-center space-x-2 text-sm px-4 py-2 hover:bg-bg-secondary w-full">
                                                    <FlagIcon className="h-4 w-4 text-text-primary"/>
                                                    <span>Report</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* --- Shared Contact Info --- */}
                {isDealAgreed && (
                    <div className="p-4 border-t border-bg-tertiary animate-fadeIn">
                        <h3 className="font-bold mb-2">Shared Contact Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <Card className="!p-3"><p className="font-semibold">{currentUser.name}</p><p>{currentUser.contactInfo.phone}</p><p>{currentUser.contactInfo.address}</p></Card>
                            <Card className="!p-3"><p className="font-semibold">{otherUser.name}</p><p>{otherUser.contactInfo.phone}</p><p>{otherUser.contactInfo.address}</p></Card>
                        </div>
                    </div>
                )}

                {/* --- Message Input --- */}
                <div className="p-4 border-t border-bg-tertiary bg-bg-primary">
                    {!isDealAgreed ? (
                        <form onSubmit={handleSendMessage} className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => { setNewMessage(e.target.value); setInputError(''); }}
                                    placeholder={isChatDisabled ? "Chat disabled" : "Type a message..."}
                                    className="w-full p-3 bg-bg-secondary rounded-lg border border-bg-tertiary focus:outline-none focus:ring-2 focus:ring-text-primary disabled:bg-bg-tertiary disabled:cursor-not-allowed"
                                    disabled={isChatDisabled}
                                />
                                <button type="submit" className="p-3 bg-text-primary text-bg-primary rounded-lg disabled:opacity-50 transition-colors hover:bg-text-secondary" disabled={!newMessage.trim() || isChatDisabled}>
                                    <PaperAirplaneIcon className="h-6 w-6" />
                                </button>
                            </div>
                            {inputError && <p className="text-feedback-error text-sm text-center">{inputError}</p>}
                        </form>
                     ) : (
                         <div className="text-center p-2 bg-bg-secondary rounded-lg">
                            <p className="text-sm font-semibold text-text-secondary">Chat is locked as the deal has been agreed upon.</p>
                        </div>
                     )}
                </div>
            </div>
        </PageLayout>
    );
};

export default ExchangeChatScreen;
