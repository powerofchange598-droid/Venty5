

import React from 'react';
import VentyButton from '../../../components/VentyButton';
import Card from '../../../components/Card';
import { useToast } from '../../../hooks/useToast';
import { useTranslation } from 'react-i18next';

interface NotificationsEditorProps {
    onSave: () => void;
}

const NotificationsEditor: React.FC<NotificationsEditorProps> = ({ onSave }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const handleSave = () => {
        onSave();
        showToast('Notification settings saved!', 'success');
    };

    return (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
            <Card>
                <h3 className="text-xl font-bold font-serif mb-4">Customer Notifications</h3>
                <p className="text-text-secondary text-sm">Customize the emails sent to your customers for events like order confirmation, shipping updates, and more.</p>
                <div className="mt-4 p-8 bg-bg-secondary rounded-lg text-center text-text-secondary">
                    <p className="mb-2">A list of email templates and customization options would be here.</p>
                    <p className="text-xs">e.g., Order Confirmation, Shipping Update, Welcome Email</p>
                </div>
            </Card>
            <div className="flex justify-end gap-2 mt-4">
                <VentyButton variant="secondary" onClick={() => showToast('Changes discarded.', 'warning')} label="Discard"></VentyButton>
                <VentyButton variant="primary" onClick={handleSave} label="Save Settings"></VentyButton>
            </div>
        </div>
    );
};

export default NotificationsEditor;
