
import React, { useState, useEffect } from 'react';
import { User, SupportTicket } from '../types';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';
import VentyButton from '../components/VentyButton';
import { useToast } from '../hooks/useToast';
import { mockSupportTickets, mockFAQs } from '../data/mockData';
import { QuestionMarkCircleIcon, ChatBubbleLeftRightIcon, ChevronDownIcon, ClockIcon, CheckCircleIcon, ExclamationCircleIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { safeFormatDate } from '../utils/dateUtils';
import { AnimatePresence, motion } from 'framer-motion';

// --- PROPS ---
interface SupportScreenProps {
    user: User;
}

// --- SUB-COMPONENTS ---

const FAQAccordion: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-border-primary last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center py-4 text-left focus:outline-none"
            >
                <span className="font-medium text-text-primary">{question}</span>
                <ChevronDownIcon className={`h-5 w-5 text-text-tertiary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        className="overflow-hidden"
                    >
                        <p className="text-sm text-text-secondary pb-4 leading-relaxed">{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ContactForm: React.FC<{ user: User; onSubmit: (ticket: Partial<SupportTicket>) => void }> = ({ user, onSubmit }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('General');
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validate = () => {
        const newErrors: {[key: string]: string} = {};
        if (!name.trim()) newErrors.name = 'Name is required';
        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
        if (!subject.trim()) newErrors.subject = 'Subject is required';
        if (!message.trim()) newErrors.message = 'Message is required';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        // Simulate API call delay
        setTimeout(() => {
            onSubmit({ 
                userName: name, 
                userEmail: email, 
                subject, 
                category, 
                message,
                status: 'Open' 
            });
            // Reset form
            setSubject('');
            setMessage('');
            setCategory('General');
            setIsSubmitting(false);
        }, 1000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-text-primary block mb-1">Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className={`w-full p-3 bg-bg-secondary border rounded-lg outline-none ${errors.name ? 'border-feedback-error' : 'border-border-primary focus:ring-2 focus:ring-brand-primary'}`}
                    />
                    {errors.name && <p className="text-xs text-feedback-error mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label className="text-sm font-medium text-text-primary block mb-1">Email</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className={`w-full p-3 bg-bg-secondary border rounded-lg outline-none ${errors.email ? 'border-feedback-error' : 'border-border-primary focus:ring-2 focus:ring-brand-primary'}`}
                    />
                    {errors.email && <p className="text-xs text-feedback-error mt-1">{errors.email}</p>}
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-text-primary block mb-1">Topic</label>
                <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    className="w-full p-3 bg-bg-secondary border border-border-primary rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                >
                    <option>General Question</option>
                    <option>Technical Issue</option>
                    <option>Billing & Payments</option>
                    <option>Account Management</option>
                    <option>Feature Request</option>
                </select>
            </div>

            <div>
                <label className="text-sm font-medium text-text-primary block mb-1">Subject</label>
                <input 
                    type="text" 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} 
                    placeholder="Brief summary of the issue" 
                    className={`w-full p-3 bg-bg-secondary border rounded-lg outline-none ${errors.subject ? 'border-feedback-error' : 'border-border-primary focus:ring-2 focus:ring-brand-primary'}`}
                />
                {errors.subject && <p className="text-xs text-feedback-error mt-1">{errors.subject}</p>}
            </div>

            <div>
                <label className="text-sm font-medium text-text-primary block mb-1">Message</label>
                <textarea 
                    value={message} 
                    onChange={e => setMessage(e.target.value)} 
                    rows={5} 
                    placeholder="Describe your issue in detail..." 
                    className={`w-full p-3 bg-bg-secondary border rounded-lg outline-none ${errors.message ? 'border-feedback-error' : 'border-border-primary focus:ring-2 focus:ring-brand-primary'}`}
                />
                {errors.message && <p className="text-xs text-feedback-error mt-1">{errors.message}</p>}
            </div>

            <VentyButton htmlType="submit" className="w-full" disabled={isSubmitting} onClick={() => {}}>
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
            </VentyButton>
        </form>
    );
};

const TicketItem: React.FC<{ ticket: SupportTicket }> = ({ ticket }) => {
    const [expanded, setExpanded] = useState(false);

    const statusConfig = {
        'Open': { color: 'text-blue-500 bg-blue-500/10', icon: ClockIcon },
        'In Progress': { color: 'text-amber-500 bg-amber-500/10', icon: ExclamationCircleIcon },
        'Resolved': { color: 'text-green-500 bg-green-500/10', icon: CheckCircleIcon },
    };
    // Default to Open if status is unknown/pending mapped incorrectly
    const config = statusConfig[ticket.status] || statusConfig['Open'];
    const Icon = config.icon;

    return (
        <Card className="!p-0 overflow-hidden transition-all duration-300">
            <div 
                className="p-4 flex justify-between items-start cursor-pointer hover:bg-bg-tertiary/50"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex-grow pr-4">
                    <h4 className="font-semibold text-sm text-text-primary">{ticket.subject}</h4>
                    <p className="text-xs text-text-secondary mt-1">
                        Ticket #{ticket.id.slice(-6)} • {ticket.category} • {safeFormatDate(ticket.createdAt)}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${config.color}`}>
                        <Icon className="h-3 w-3" /> {ticket.status}
                    </span>
                    <ChevronDownIcon className={`h-4 w-4 text-text-tertiary transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </div>
            </div>
            
            <AnimatePresence>
                {expanded && (
                    <motion.div 
                        initial={{ height: 0 }} 
                        animate={{ height: 'auto' }} 
                        exit={{ height: 0 }} 
                        className="overflow-hidden bg-bg-tertiary/30 border-t border-border-primary"
                    >
                        <div className="p-4 text-sm space-y-4">
                            <div>
                                <p className="font-semibold text-text-primary mb-1">Your Message:</p>
                                <p className="text-text-secondary">{ticket.message}</p>
                            </div>
                            {ticket.adminResponse && (
                                <div className="bg-brand-primary/10 p-3 rounded-lg border border-brand-primary/20">
                                    <p className="font-bold text-brand-primary mb-1 text-xs uppercase tracking-wide">Admin Response</p>
                                    <p className="text-text-primary">{ticket.adminResponse}</p>
                                    <p className="text-xs text-text-secondary mt-2 text-right">Updated: {safeFormatDate(ticket.lastUpdate)}</p>
                                </div>
                            )}
                            {!ticket.adminResponse && ticket.status !== 'Resolved' && (
                                <p className="text-xs text-text-secondary italic">Waiting for support team response...</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
};

// --- MAIN SCREEN ---

const SupportScreen: React.FC<SupportScreenProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'tickets'>('faq');
    const { showToast } = useToast();
    
    // Load tickets from localStorage or mock data
    const [tickets, setTickets] = useState<SupportTicket[]>(() => {
        const saved = localStorage.getItem('venty_support_tickets');
        return saved ? JSON.parse(saved) : mockSupportTickets;
    });

    useEffect(() => {
        localStorage.setItem('venty_support_tickets', JSON.stringify(tickets));
    }, [tickets]);

    const handleTicketSubmit = (data: Partial<SupportTicket>) => {
        const newTicket: SupportTicket = {
            id: `tic_${Date.now()}`,
            userId: user.id,
            userName: data.userName || user.name,
            userEmail: data.userEmail || user.email,
            subject: data.subject || 'No Subject',
            category: data.category || 'General',
            message: data.message || '',
            status: 'Open',
            createdAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
        };
        
        setTickets(prev => [newTicket, ...prev]);
        showToast("Ticket submitted successfully! Check 'My Tickets' for updates.");
        setActiveTab('tickets');

        // SIMULATE ADMIN RESPONSE (Notification requirement)
        setTimeout(() => {
            setTickets(prev => prev.map(t => {
                if (t.id === newTicket.id) {
                    return {
                        ...t,
                        status: 'In Progress',
                        lastUpdate: new Date().toISOString(),
                        adminResponse: "Hello! We have received your request and are currently reviewing it. An agent will get back to you shortly."
                    };
                }
                return t;
            }));
            showToast(`Update on Ticket #${newTicket.id.slice(-6)}: Status changed to In Progress`);
        }, 8000); // 8 seconds delay
    };

    return (
        <PageLayout title="Support Center">
            <div className="p-4 lg:p-6 max-w-3xl mx-auto flex flex-col h-full">
                
                {/* Tabs */}
                <div className="flex p-1 bg-bg-tertiary rounded-lg mb-6 sticky top-0 z-10">
                    <button 
                        onClick={() => setActiveTab('faq')} 
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'faq' ? 'bg-bg-secondary text-brand-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        FAQ
                    </button>
                    <button 
                        onClick={() => setActiveTab('contact')} 
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'contact' ? 'bg-bg-secondary text-brand-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Contact
                    </button>
                    <button 
                        onClick={() => setActiveTab('tickets')} 
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'tickets' ? 'bg-bg-secondary text-brand-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        My Tickets
                        {tickets.length > 0 && <span className="ml-2 bg-bg-tertiary text-text-primary text-[10px] px-1.5 py-0.5 rounded-full">{tickets.length}</span>}
                    </button>
                </div>

                <div className="flex-grow animate-fadeIn">
                    {activeTab === 'faq' && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <QuestionMarkCircleIcon className="h-8 w-8 text-brand-primary" />
                                </div>
                                <h2 className="text-xl font-bold text-text-primary">Frequently Asked Questions</h2>
                                <p className="text-sm text-text-secondary">Quick answers to common questions.</p>
                            </div>
                            <Card className="!px-4 !py-2">
                                {mockFAQs.map(faq => (
                                    <FAQAccordion key={faq.id} question={faq.question} answer={faq.answer} />
                                ))}
                            </Card>
                        </div>
                    )}

                    {activeTab === 'contact' && (
                        <div className="space-y-8">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ChatBubbleLeftRightIcon className="h-8 w-8 text-brand-primary" />
                                </div>
                                <h2 className="text-xl font-bold text-text-primary">Contact Support</h2>
                                <p className="text-sm text-text-secondary">Send us a message and we'll respond within 24 hours.</p>
                            </div>
                            <Card className="!p-6">
                                <ContactForm user={user} onSubmit={handleTicketSubmit} />
                            </Card>
                        </div>
                    )}

                    {activeTab === 'tickets' && (
                        <div className="space-y-6">
                             <div className="text-center mb-4">
                                <h2 className="text-xl font-bold text-text-primary">Support History</h2>
                            </div>
                            <div className="space-y-3">
                                {tickets.length > 0 ? (
                                    tickets.map(ticket => <TicketItem key={ticket.id} ticket={ticket} />)
                                ) : (
                                    <div className="text-center py-12 bg-bg-secondary rounded-xl border border-border-primary">
                                        <ChatBubbleLeftRightIcon className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
                                        <p className="text-text-primary font-medium">No tickets yet</p>
                                        <p className="text-text-secondary text-sm mt-1">Your support history will appear here.</p>
                                        <VentyButton 
                                            variant="secondary" 
                                            className="mt-4 !w-auto"
                                            onClick={() => setActiveTab('contact')}
                                        >
                                            Create Ticket
                                        </VentyButton>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

export default SupportScreen;
