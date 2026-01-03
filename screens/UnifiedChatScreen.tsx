import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, UnifiedChat, UnifiedChatMessage, Product } from '../types';
import { applyChatFilters, getSuggestedReplies, detectOffPlatformAttempt } from '../utils/chatHelper';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';
import { PaperAirplaneIcon, ShieldCheckIcon, EllipsisVerticalIcon, FlagIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import VerifiedBadge from '../components/VerifiedBadge';
import VentyButton from '../components/VentyButton';

interface UnifiedChatScreenProps {
    currentUser: User;
}

const getUserColor = (_userId: string) => 'text-gray-500';

const UnifiedChatScreen: React.FC<UnifiedChatScreenProps> = ({ currentUser }) => {
    const { chatId } = useParams<{ chatId: string }>();
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const { i18n } = useTranslation();

    // --- State ---
    const [chat, setChat] = useState<UnifiedChat | null>(null);
    const [messages, setMessages] = useState<UnifiedChatMessage[]>([]);
    const [productContext, setProductContext] = useState<Product | null>(null);
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [showMenuForMessage, setShowMenuForMessage] = useState<string | null>(null);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [inputError, setInputError] = useState('');
    const [isChatDisabled, setIsChatDisabled] = useState(false);
    const VIOLATION_KEY = `chat_violations_${currentUser.id}`;
    
    const isMerchant = currentUser.accountType === 'merchant';
    const isAgreed = chat?.status === 'agreed';

    // --- Effects ---
    useEffect(() => {
        setChat(null);
        setProductContext(null);
        setOtherUser(null);
        setMessages([]);
    }, [chatId, isMerchant]);

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
    
    const fetchAiSuggestions = (_currentMessages: UnifiedChatMessage[]) => {
        setAiSuggestions([]);
    };
    
    useEffect(() => {
        fetchAiSuggestions(messages);
    }, [messages, isMerchant, productContext]);

    // --- Handlers ---
    const handleSendMessage = (text: string) => {
        const textRaw = text.trim();
        if (!textRaw || !chat || isChatDisabled) return;

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

        const newMsg: UnifiedChatMessage = {
            id: `uc_msg${messages.length + 1}`,
            chatId: chat.id,
            senderRole: isMerchant ? 'merchant' : 'user',
            senderId: currentUser.id,
            senderName: currentUser.name,
            textRaw: textRaw,
            textClean: applyChatFilters(textRaw),
            lang: i18n.language.split('-')[0],
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
        
        const updatedMessages = [...messages, newMsg];
        setMessages(updatedMessages);
        setNewMessage('');
        fetchAiSuggestions(updatedMessages); // Fetch new suggestions
    };

    const handleAgreeToggle = () => {
        if (!chat) return;
        const updatedChat = { ...chat };
        if (isMerchant) updatedChat.merchantAgreed = !updatedChat.merchantAgreed;
        else updatedChat.userAgreed = !updatedChat.userAgreed;

        if (updatedChat.userAgreed && updatedChat.merchantAgreed) {
            updatedChat.status = 'agreed';
            updatedChat.agreedAt = new Date().toISOString();
            const systemMessage: UnifiedChatMessage = {
                id: `uc_msg_system_${Date.now()}`,
                chatId: chat.id,
                senderRole: 'system',
                senderId: 'system',
                senderName: 'System',
                textRaw: `✅ Contact details shared!\nUser: ${currentUser.contactInfo?.phone || 'Add your phone in Settings'}\nMerchant: ${otherUser?.contactInfo?.phone || 'Merchant has not provided a phone'}`,
                textClean: `✅ Contact details shared!\nUser: ${currentUser.contactInfo?.phone || 'Add your phone in Settings'}\nMerchant: ${otherUser?.contactInfo?.phone || 'Merchant has not provided a phone'}`,
                lang: 'en',
                timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, systemMessage]);
        }
        setChat(updatedChat);
    };

    const handleReport = (messageId: string) => {
        alert(`Message ${messageId} reported. (Simulation)`);
        setShowMenuForMessage(null);
    };

    if (!chat || !otherUser) return <PageLayout title="Chat"><div className="p-8 text-center text-text-secondary">No chat found. Start a conversation from the product or messages page.</div></PageLayout>;

    const participants = [currentUser, otherUser];

    return (
        <PageLayout title={`Chat with ${otherUser.name}`}>
            <div className="flex flex-col h-[calc(100vh-120px)] lg:h-[calc(100vh-80px)] bg-ui-card/50">
                {productContext && (
                    <div className="p-2 border-b border-ui-border flex items-center space-x-3 bg-ui-card">
                        <img src={productContext.imageUrl} alt={productContext.title} className="w-10 h-10 rounded-md object-cover"/>
                        <div>
                            <p className="text-xs text-ui-secondary">Regarding</p>
                            <p className="font-semibold leading-tight">{productContext.title}</p>
                        </div>
                    </div>
                )}
                <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {messages.map((msg) => {
                        const isCurrentUser = msg.senderId === currentUser.id;
                        const sender = participants.find(p => p?.id === msg.senderId);

                        if (msg.senderRole === 'system') {
                            return (
                                <div key={msg.id} className="text-center text-xs text-ui-secondary my-2 p-2 bg-ui-border rounded-lg mx-auto max-w-sm whitespace-pre-wrap">{msg.textClean}</div>
                            );
                        }
                        return (
                            <div key={msg.id} className={`group flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${isCurrentUser ? 'bg-brand-primary text-white rounded-br-none' : 'bg-ui-card rounded-bl-none'}`}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-1">
                                            {sender && (
                                                <p className={`text-xs font-bold mb-1 flex items-center space-x-1 ${isCurrentUser ? 'text-blue-200' : getUserColor(msg.senderId)}`}>
                                                    <span>{sender.name}</span>
                                                    <VerifiedBadge user={sender} />
                                                </p>
                                            )}
                                        </div>
                                        <span className={`text-xs uppercase ml-2 ${isCurrentUser ? 'text-blue-200' : 'text-ui-secondary'}`}>{msg.lang}</span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{msg.textRaw}</p>
                                    <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-ui-secondary'} text-right`}>{msg.timestamp}</p>
                                </div>
                                <div className="relative self-center">
                                    <button onClick={() => setShowMenuForMessage(showMenuForMessage === msg.id ? null : msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <EllipsisVerticalIcon className="h-5 w-5 text-ui-secondary" />
                                    </button>
                                    {showMenuForMessage === msg.id && (
                                        <div className="absolute bottom-6 right-0 bg-ui-card border border-ui-border rounded-md shadow-lg z-10 w-28">
                                            <button onClick={() => handleReport(msg.id)} className="flex items-center space-x-2 text-sm px-3 py-2 hover:bg-ui-background w-full">
                                                <FlagIcon className="h-4 w-4 text-feedback-error"/><span>Report</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-ui-border bg-ui-background">
                    {!isAgreed && (
                         <Card className="!p-2 mb-2">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <ShieldCheckIcon className="h-5 w-5 text-feedback-success"/>
                                    <span className="text-sm font-medium">Agree to share contact info?</span>
                                </div>
                                <button onClick={handleAgreeToggle} className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${ (isMerchant ? chat.merchantAgreed : chat.userAgreed) ? 'bg-feedback-success/20 text-feedback-success' : 'bg-ui-border'}`}>
                                    {(isMerchant ? chat.merchantAgreed : chat.userAgreed) && <CheckCircleIcon className="h-4 w-4"/>}
                                    <span>{ (isMerchant ? chat.merchantAgreed : chat.userAgreed) ? 'Agreed' : 'Agree'}</span>
                                </button>
                             </div>
                         </Card>
                    )}
                    
                    {isMerchant && !isAgreed && aiSuggestions.length > 0 && (
                        <div className="flex space-x-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                             {aiSuggestions.map((prompt, i) => (
                                <VentyButton key={i} onClick={() => handleSendMessage(prompt)} variant="secondary" className="!w-auto !px-3 !py-1 !text-sm whitespace-nowrap !flex !items-center !space-x-1">
                                    <SparklesIcon className="h-4 w-4 text-brand-primary"/>
                                    <span>{prompt}</span>
                                </VentyButton>
                             ))}
                        </div>
                    )}

                    {!isAgreed ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(newMessage); }} className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => { setNewMessage(e.target.value); setInputError(''); }}
                                    placeholder={isChatDisabled ? "Chat disabled" : "Type a message..."}
                                    disabled={isChatDisabled}
                                    className="w-full p-3 bg-ui-card rounded-lg border border-ui-border focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-ui-border disabled:cursor-not-allowed"
                                />
                                <VentyButton htmlType="submit" variant="primary" onClick={() => {}} className="!w-auto !p-3" disabled={!newMessage.trim() || isChatDisabled}><PaperAirplaneIcon className="h-6 w-6" /></VentyButton>
                            </div>
                            {inputError && <p className="text-feedback-error text-sm text-center">{inputError}</p>}
                        </form>
                    ) : (
                        <div className="text-center p-2 bg-ui-card rounded-lg"><p className="text-sm font-semibold text-ui-secondary">Chat is locked. Contact details have been shared.</p></div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

export default UnifiedChatScreen;
