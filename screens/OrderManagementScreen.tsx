import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Order, OrderStatus } from '../types';
import Card from '../components/Card';
import MerchantPageLayout from '../components/merchant/MerchantPageLayout';
import { useLocalization } from '../hooks/useLocalization';
import { ChatBubbleLeftRightIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import VentyButton from '../components/VentyButton';
import { useTranslation } from 'react-i18next';
import HorizontalScroller from '../components/HorizontalScroller';

interface OrderManagementScreenProps {
    user: User;
}

const statusColors: Record<OrderStatus, string> = {
    'pending-payment': 'bg-bg-tertiary text-text-secondary',
    'paid-awaiting-fulfillment': 'bg-feedback-warning/10 text-feedback-warning',
    'shipped': 'bg-feedback-info/10 text-feedback-info',
    'in-transit': 'bg-brand-primary/10 text-brand-primary',
    'completed': 'bg-feedback-success/10 text-feedback-success',
    'cancelled': 'bg-feedback-error/10 text-feedback-error',
    'disputed': 'bg-feedback-error/10 text-feedback-error',
    'refunded': 'bg-bg-tertiary text-text-secondary',
};

const ORDERS_PER_PAGE = 6;

const OrderCard: React.FC<{ 
    order: Order; 
    onUpdate: (id: string, newStatus: OrderStatus, trackingNumber?: string) => void; 
    formatCurrency: (value: number) => string; 
}> = React.memo(({ order, onUpdate, formatCurrency }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [trackingInput, setTrackingInput] = useState(order.trackingNumber || '');

    const handleChatClick = () => {
        const chatId = 'chat_user1_merchant1'; // This would be dynamic
        navigate(`/chat/${chatId}`, { state: { orderId: order.id } });
    };

    const handleMarkAsShipped = () => {
        if (trackingInput.trim()) {
            onUpdate(order.id, 'shipped', trackingInput.trim());
        } else {
            alert('Please enter a tracking number.');
        }
    };

    return (
        <Card>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-lg">Order #{order.id.split('-')[1]}</h3>
                    <p className="text-sm text-text-secondary">{new Date(order.createdAt).toLocaleDateString()} • {order.items.length} item(s)</p>
                    <p className="text-sm text-text-secondary">{order.customerName}</p>
                </div>
                <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}>{t(`orderManagement.statuses.${order.status}`)}</span>
                    <p className="font-bold text-xl mt-1">{formatCurrency(order.total)}</p>
                </div>
            </div>
            <div className="border-t border-bg-tertiary pt-2 text-sm space-y-1">
                {order.items.map(item => (
                     <div key={item.productId} className="flex justify-between">
                        <span>{item.title} x{item.quantity}</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                     </div>
                ))}
            </div>
             <div className="mt-4 flex items-center justify-end">
                 <VentyButton onClick={handleChatClick} variant="ghost" className="!w-auto !p-2 !rounded-full !ml-2" title="Chat about this order">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-brand-primary"/>
                 </VentyButton>
             </div>

             {/* Dynamic Action Section */}
             {order.status === 'paid-awaiting-fulfillment' && (
                 <div className="mt-4 p-3 bg-bg-primary rounded-lg space-y-2 border border-bg-tertiary">
                    <label htmlFor={`tracking-${order.id}`} className="text-sm font-medium block">{t('orderManagement.trackingNumberLabel')}</label>
                    <input id={`tracking-${order.id}`} type="text" value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} placeholder="e.g., AWB123456789" className="w-full p-2 bg-bg-secondary rounded-lg border border-bg-tertiary"/>
                    <VentyButton onClick={handleMarkAsShipped} variant="primary" className="w-full !text-sm !py-2" label={t('orderManagement.markAsShipped')}></VentyButton>
                </div>
             )}
              {order.status === 'in-transit' && (
                 <div className="mt-4 p-3 bg-bg-primary rounded-lg space-y-2 border border-bg-tertiary">
                    <p className="text-sm"><strong>{t('orderManagement.trackingNumberLabel')}:</strong> {order.trackingNumber}</p>
                    <VentyButton onClick={() => onUpdate(order.id, 'completed')} variant="primary" className="w-full !text-sm !py-2" label={t('orderManagement.confirmDelivery')}></VentyButton>
                 </div>
             )}
              {order.status === 'completed' && (
                 <div className="mt-4 p-3 bg-feedback-success/10 rounded-lg space-y-2 border border-feedback-success/20">
                     <h4 className="font-bold flex items-center"><BanknotesIcon className="h-5 w-5 mr-2"/>{t('orderManagement.payoutDetails')}</h4>
                     <div className="text-sm space-y-1">
                        <div className="flex justify-between"><span>{t('orderManagement.orderTotal')}:</span><span>{formatCurrency(order.total)}</span></div>
                        <div className="flex justify-between"><span>{t('orderManagement.commission')}:</span><span className="text-feedback-error">-{formatCurrency(order.commission || 0)}</span></div>
                        <div className="border-t border-feedback-success/20 my-1"></div>
                        <div className="flex justify-between font-bold text-lg"><span>{t('orderManagement.yourPayout')}:</span><span>{formatCurrency(order.merchantPayout || 0)}</span></div>
                     </div>
                 </div>
             )}
        </Card>
    );
});


const OrderManagementScreen: React.FC<OrderManagementScreenProps> = ({ user }) => {
    const { t } = useTranslation();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
    const { formatCurrency } = useLocalization();
    const [visibleCount, setVisibleCount] = useState(ORDERS_PER_PAGE);

    const handleStatusUpdate = (orderId: string, newStatus: OrderStatus, tracking?: string) => {
        setOrders(prev => prev.map(order => {
            if (order.id === orderId) {
                const updatedOrder: Order = { ...order, status: newStatus, updatedAt: new Date().toISOString() };
                
                if (newStatus === 'shipped' && tracking) {
                    updatedOrder.trackingNumber = tracking;
                    setTimeout(() => {
                        setOrders(currentOrders => currentOrders.map(o => o.id === orderId ? { ...o, status: 'in-transit' } : o));
                    }, 2000);
                }
                
                if (newStatus === 'completed') {
                    updatedOrder.commission = order.total * 0.05;
                    updatedOrder.merchantPayout = order.total - updatedOrder.commission;
                }
                
                return updatedOrder;
            }
            return order;
        }));
    };

    const filteredOrders = useMemo(() => {
        const sorted = [...orders].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (filterStatus === 'all') return sorted;
        return sorted.filter(order => order.status === filterStatus);
    }, [orders, filterStatus]);
    
    const visibleOrders = useMemo(() => {
        return filteredOrders.slice(0, visibleCount);
    }, [filteredOrders, visibleCount]);

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + ORDERS_PER_PAGE);
    };

    const relevantStatuses: (OrderStatus | 'all')[] = ['all', 'paid-awaiting-fulfillment', 'in-transit', 'completed', 'cancelled'];

    return (
        <MerchantPageLayout title="Order Management">
            <nav className="top-bar">
                <HorizontalScroller activeId={`filter-${filterStatus}`}>
                    <div className="flex gap-2 px-4 py-3">
                        {relevantStatuses.map(status => (
                            <VentyButton 
                                key={status} 
                                onClick={() => { setFilterStatus(status); setVisibleCount(ORDERS_PER_PAGE); }} 
                                variant="ghost"
                                className={`pill snap-start !px-4 !py-2 ${filterStatus === status ? 'active' : ''}`}
                            >
                               {t(`orderManagement.statuses.${status}`)}
                            </VentyButton>
                        ))}
                    </div>
                </HorizontalScroller>
            </nav>
            <div className="p-4 lg:p-6 space-y-6">
                {visibleOrders.length === 0 ? (
                    <Card className="text-center py-12">
                        <p className="text-text-secondary">No orders found for this status.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {visibleOrders.map(order => (
                            <OrderCard key={order.id} order={order} onUpdate={handleStatusUpdate} formatCurrency={formatCurrency}/>
                        ))}
                    </div>
                )}
                {visibleCount < filteredOrders.length && (
                    <div className="text-center">
                        <VentyButton onClick={handleLoadMore} variant="secondary" className="!w-auto px-6" label="Load More">
                        </VentyButton>
                    </div>
                )}
            </div>
        </MerchantPageLayout>
    );
};

export default OrderManagementScreen;
