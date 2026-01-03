import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, animate } from 'framer-motion';
import { User, InboxMessage } from '../types';
import PageLayout from '../components/PageLayout';
import { ChatBubbleLeftRightIcon, ShoppingBagIcon, SparklesIcon, ShieldCheckIcon, ArchiveBoxIcon, TrashIcon } from '@heroicons/react/24/solid';
import HorizontalScroller from '../components/HorizontalScroller';
import { safeFormatDate } from '../utils/dateUtils';

type MessageFilter = 'all' | 'chat' | 'order' | 'promo' | 'system';

interface MessagesScreenProps {
    currentUser: User;
}

const MessageTypeIcon: React.FC<{ type: InboxMessage['type'] }> = ({ type }) => {
    const icons = {
        chat: <ChatBubbleLeftRightIcon className="h-6 w-6 text-brand-primary" />,
        order: <ShoppingBagIcon className="h-6 w-6 text-text-primary" />,
        promo: <SparklesIcon className="h-6 w-6 text-feedback-warning" />,
        system: <ShieldCheckIcon className="h-6 w-6 text-feedback-error" />,
    };
    return <div className="w-12 h-12 rounded-full flex items-center justify-center bg-bg-secondary flex-shrink-0">{icons[type]}</div>;
};

const MessageItem: React.FC<{
    message: InboxMessage;
    onClick: (message: InboxMessage) => void;
    onArchive: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ message, onClick, onArchive, onDelete }) => {
    const x = useMotionValue(0);
    const ACTION_WIDTH = 80;

    const getStatus = (m: InboxMessage): 'success' | 'error' | 'warning' | 'info' => {
        const t = m.title.toLowerCase();
        if (m.type === 'order') {
            if (t.includes('shipped') || t.includes('delivered') || t.includes('completed')) return 'success';
            if (t.includes('cancel') || t.includes('failed') || t.includes('disputed') || t.includes('refunded')) return 'error';
            return 'info';
        }
        if (m.type === 'promo') return 'warning';
        if (m.type === 'system') return 'info';
        return 'info';
    };
    const status = getStatus(message);
    const accentBorder = status === 'success' ? 'border-l-4 border-feedback-success' : status === 'error' ? 'border-l-4 border-feedback-error' : status === 'warning' ? 'border-l-4 border-feedback-warning' : 'border-l-4 border-border-primary';
    const statusChip = status === 'success' ? 'text-feedback-success bg-feedback-success/10' : status === 'error' ? 'text-feedback-error bg-feedback-error/10' : status === 'warning' ? 'text-feedback-warning bg-feedback-warning/10' : 'text-text-secondary bg-bg-tertiary';

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: any) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        if (offset < -ACTION_WIDTH || velocity < -500) {
            animate(x, -ACTION_WIDTH * 2, { type: 'spring', stiffness: 400, damping: 40 });
        } else {
            animate(x, 0, { type: 'spring', stiffness: 400, damping: 40 });
        }
    };

    return (
        <div className="relative w-full">
            <div className="absolute inset-0 rounded-xl flex items-center justify-end bg-bg-tertiary overflow-hidden">
                <button onClick={() => onArchive(message.id)} className="w-20 h-full flex items-center justify-center bg-feedback-info text-white hover:bg-blue-600 transition-colors">
                    <ArchiveBoxIcon className="h-6 w-6" />
                </button>
                <button onClick={() => onDelete(message.id)} className="w-20 h-full flex items-center justify-center bg-feedback-error text-white hover:bg-red-700 transition-colors">
                    <TrashIcon className="h-6 w-6" />
                </button>
            </div>

            <motion.div
                drag="x"
                dragConstraints={{ left: -ACTION_WIDTH * 2, right: 0 }}
                dragElastic={0.1}
                style={{ x }}
                onDragEnd={handleDragEnd}
                className={`relative bg-bg-secondary rounded-xl shadow cursor-grab active:cursor-grabbing ${accentBorder}`}
            >
                <div onClick={() => onClick(message)} className="flex items-center space-x-4 p-4">
                    <MessageTypeIcon type={message.type} />
                    <div className="flex-grow overflow-hidden">
                        <div className="flex justify-between items-start">
                            <p className="font-bold truncate">{message.title}</p>
                            <p className="text-xs text-text-secondary flex-shrink-0 ml-2">{safeFormatDate(message.createdAt, 'en-US')}</p>
                        </div>
                        <p className="text-sm text-text-secondary truncate">{message.body}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusChip}`}>
                        {status === 'success' ? 'Success' : status === 'error' ? 'Alert' : status === 'warning' ? 'Promo' : 'Info'}
                    </span>
                    {!message.isRead && (
                        <div className="w-3 h-3 bg-brand-primary rounded-full flex-shrink-0 ml-2" title="Unread"></div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const MessagesScreen: React.FC<MessagesScreenProps> = ({ currentUser }) => {
    const [messages, setMessages] = useState<InboxMessage[]>([]);
    const [activeFilter, setActiveFilter] = useState<MessageFilter>('all');
    const navigate = useNavigate();

    const filteredMessages = useMemo(() => {
        const sorted = [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (activeFilter === 'all') {
            return sorted;
        }
        return sorted.filter(m => m.type === activeFilter);
    }, [messages, activeFilter]);

    const markAsRead = (id: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    };
    
    const handleMessageClick = (message: InboxMessage) => {
        markAsRead(message.id);
        navigate(message.deepLink);
    };

    const archiveMessage = (id: string) => {
        setMessages(prev => prev.filter(m => m.id !== id));
    };

    const deleteMessage = (id: string) => {
        if (window.confirm("Are you sure you want to permanently delete this message?")) {
            setMessages(prev => prev.filter(m => m.id !== id));
        }
    };
    
    const filters: { label: string; value: MessageFilter }[] = [
        { label: 'All', value: 'all' },
        { label: 'Chats', value: 'chat' },
        { label: 'Orders', value: 'order' },
        { label: 'Promos', value: 'promo' },
        { label: 'System', value: 'system' },
    ];
    
    const pageTitle = 'Messages';
    const emptyStateText = 'No messages yet';

    return (
        <PageLayout title={pageTitle}>
            <nav className="top-bar">
                 <HorizontalScroller activeId={`filter-${activeFilter}`}>
                    <div className="flex gap-2 px-4 py-3">
                        {filters.map(filter => {
                            const isActive = activeFilter === filter.value;
                            return (
                                <button
                                    id={`filter-${filter.value}`}
                                    key={filter.value}
                                    onClick={() => setActiveFilter(filter.value)}
                                    className={`pill snap-start ${isActive ? 'active' : ''}`}
                                >
                                    {filter.label}
                                </button>
                            );
                        })}
                    </div>
                </HorizontalScroller>
            </nav>
            <div className="p-4 lg:p-6">
                 <div className="max-w-4xl mx-auto space-y-4">
                    {filteredMessages.length === 0 ? (
                        <div className="bg-bg-secondary rounded-xl text-center py-20">
                            <p className="text-text-secondary">{emptyStateText}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredMessages.map(message => (
                                <MessageItem
                                    key={message.id}
                                    message={message}
                                    onClick={handleMessageClick}
                                    onArchive={archiveMessage}
                                    onDelete={deleteMessage}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

export default MessagesScreen;
