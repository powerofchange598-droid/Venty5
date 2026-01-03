import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Family, AppNotification, Goal, PurchaseRequest, SmartNotification } from '../types';
import Card from './Card';
import VentyButton from './VentyButton';
import { UsersIcon, UserMinusIcon, DocumentDuplicateIcon, LightBulbIcon, BellAlertIcon, CheckCircleIcon, ChatBubbleLeftRightIcon, PencilIcon, CheckIcon, XMarkIcon, ShoppingCartIcon, ShieldCheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import PageLayout from './PageLayout';
import { useLocalization } from '../hooks/useLocalization';
import { generateSmartNotifications } from '../utils/notificationGenerator';
import VerifiedBadge from './VerifiedBadge';
import { safeFormatDate } from '../utils/dateUtils';

interface FamilyScreenProps {
    user: User;
    family: Family;
    onUpdateFamily: (family: Family) => void;
    purchaseRequests: PurchaseRequest[];
}

const getTomorrowISO = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
};

interface GoalCardProps {
    goal: Goal;
    onUpdate: (updatedGoal: Goal) => void;
    isFamilyHead: boolean;
    formatCurrency: (value: number) => string;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onUpdate, isFamilyHead, formatCurrency }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContribution, setEditedContribution] = useState(goal.monthlyContribution || 0);
    const [editedDeadline, setEditedDeadline] = useState(goal.deadline || getTomorrowISO());

    const handleSave = () => {
        onUpdate({
            ...goal,
            monthlyContribution: editedContribution,
            deadline: editedDeadline,
        });
        setIsEditing(false);
    };

    const totalAchieved = goal.currentAmount + (goal.investedAmount || 0);
    const percentage = Math.round((totalAchieved / goal.targetAmount) * 100);
    
    return (
        <Card>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className="font-semibold text-md sm:text-lg">{goal.name}</h4>
                    {isEditing ? (
                         <input type="date" value={editedDeadline} onChange={(e) => setEditedDeadline(e.target.value)} className="w-full mt-1 p-1 text-sm"/>
                    ) : (
                        goal.deadline && <p className="text-xs text-text-secondary">Deadline: {safeFormatDate(goal.deadline, 'en-US')}</p>
                    )}
                </div>
                {isFamilyHead && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="p-2 -mt-2 -mr-2 text-text-secondary hover:text-text-primary rounded-full"><PencilIcon className="h-5 w-5"/></button>
                )}
            </div>
            
            <div className="relative w-full bg-bg-tertiary rounded-full h-4 mt-2">
                <div className="bg-feedback-success h-4 rounded-full text-bg-primary text-xs flex items-center justify-center transition-all duration-500" style={{ width: `${percentage}%` }}>
                    {percentage > 10 ? `${percentage}%` : ''}
                </div>
            </div>
            <div className="flex justify-between text-xs font-semibold mt-1">
                <span>{formatCurrency(totalAchieved)}</span>
                <span>{formatCurrency(goal.targetAmount)}</span>
            </div>

            <div className="mt-4 pt-3 border-t border-border-primary text-sm space-y-2">
                <div className="flex justify-between">
                    <span className="text-text-secondary">Total Saved:</span>
                    <span className="font-semibold">{formatCurrency(goal.currentAmount)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-text-secondary">Invested Amount:</span>
                    <span className="font-semibold">{formatCurrency(goal.investedAmount || 0)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-text-secondary">Monthly Contribution:</span>
                     {isEditing ? (
                        <input type="number" value={editedContribution} onChange={e => setEditedContribution(Number(e.target.value))} className="w-24 p-1 text-right"/>
                    ) : (
                        <span className="font-semibold">{formatCurrency(goal.monthlyContribution || 0)}</span>
                    )}
                </div>
            </div>
             {isFamilyHead && isEditing && (
                <div className="flex justify-end space-x-2 mt-4">
                    <VentyButton onClick={() => setIsEditing(false)} variant="secondary" className="!w-auto !py-1 !px-3 !text-sm"><XMarkIcon className="h-4 w-4"/></VentyButton>
                    <VentyButton onClick={handleSave} className="!w-auto !py-1 !px-3 !text-sm"><CheckIcon className="h-4 w-4"/></VentyButton>
                </div>
            )}
        </Card>
    );
};

const FamilySecurityCard: React.FC<{ family: Family; onUpdate: (updatedFamily: Family) => void; }> = ({ family, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [newPassword, setNewPassword] = useState(family.password || '');

    const handleSave = () => {
        onUpdate({ ...family, password: newPassword });
        setIsEditing(false);
    };

    return (
        <Card>
            <h2 className="text-xl font-bold mb-3 flex items-center space-x-2">
                <ShieldCheckIcon className="h-6 w-6 text-feedback-info" />
                <span>Family Security</span>
            </h2>
            <div className="space-y-3">
                <div>
                    <label className="font-medium text-sm">Family Invite Code</label>
                    <div className="flex items-center space-x-2 p-3 bg-bg-primary rounded-lg mt-1">
                        <span className="font-mono text-base sm:text-lg flex-grow">{family.familyCode}</span>
                        <button onClick={() => navigator.clipboard.writeText(family.familyCode)} className="p-2 hover:bg-bg-tertiary rounded-full">
                            <DocumentDuplicateIcon className="h-5 w-5"/>
                        </button>
                    </div>
                </div>
                <div>
                    <label className="font-medium text-sm">Family Password</label>
                    {isEditing ? (
                        <div className="mt-1">
                             <input 
                                type="text"
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full p-2"
                            />
                            <div className="flex space-x-2 mt-2">
                                <VentyButton onClick={() => setIsEditing(false)} variant="secondary" className="!w-full !py-1 !text-sm" label="Cancel"></VentyButton>
                                <VentyButton onClick={handleSave} className="!w-full !py-1 !text-sm" label="Save"></VentyButton>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-bg-primary rounded-lg mt-1">
                            <span className="font-mono text-base sm:text-lg">{showPassword ? family.password : '••••••••••••'}</span>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => setShowPassword(!showPassword)} className="p-2 hover:bg-bg-tertiary rounded-full">
                                    {showPassword ? <EyeSlashIcon className="h-5 w-5 text-text-secondary"/> : <EyeIcon className="h-5 w-5 text-text-secondary"/>}
                                </button>
                                <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-bg-tertiary rounded-full">
                                    <PencilIcon className="h-5 w-5 text-text-secondary"/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};


const FamilyScreen: React.FC<FamilyScreenProps> = ({ user, family: initialFamily, onUpdateFamily, purchaseRequests }) => {
    const [family, setFamily] = useState<Family>(initialFamily);
    const { formatCurrency } = useLocalization();
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        setFamily(initialFamily);
    }, [initialFamily]);

    const notifications: SmartNotification[] = useMemo(() => {
        return [];
    }, [user]);

    const pendingRequestsCount = purchaseRequests.filter(r => r.status === 'pending').length;

    const removeMember = (memberId: string) => {
        if (window.confirm("Are you sure you want to remove this family member?")) {
            onUpdateFamily({ ...family, members: family.members.filter(m => m.id !== memberId) });
        }
    };

    const handleUpdateGoal = (updatedGoal: Goal) => {
        onUpdateFamily({
            ...family,
            sharedGoals: family.sharedGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g),
        });
    };
    
    return (
        <PageLayout title={family.name}>
            <div className="py-6 space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card
                        className="!p-4 cursor-pointer"
                        onClick={() => navigate('/family/coordinate')}
                    >
                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                                <ChatBubbleLeftRightIcon className="h-7 w-7 text-brand-primary"/>
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-bold text-base md:text-lg text-text-primary">Family Chat</h3>
                                <p className="text-sm text-text-secondary mt-1">Coordinate & discuss finances</p>
                            </div>
                        </div>
                    </Card>
                     <Card
                        className="!p-4 relative cursor-pointer"
                        onClick={() => navigate('/family/review')}
                    >
                        {pendingRequestsCount > 0 && (
                            <span className="absolute top-4 right-4 h-6 w-6 text-sm rounded-full bg-feedback-error text-white flex items-center justify-center font-bold z-10">
                                {pendingRequestsCount}
                            </span>
                        )}
                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                                <ShoppingCartIcon className="h-7 w-7 text-brand-primary"/>
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-bold text-base md:text-lg text-text-primary">Purchase Requests</h3>
                                <p className="text-sm text-text-secondary mt-1">Review member requests</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card>
                    <h2 className="text-lg md:text-xl font-bold mb-3 flex items-center space-x-2">
                        <UsersIcon className="h-6 w-6 text-text-primary"/>
                        <span>Family Members ({family.members.length})</span>
                    </h2>
                    <div className="space-y-2">
                        {family.members.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-2 bg-bg-primary rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center font-bold text-text-primary">{member.name.charAt(0)}</div>
                                    <div>
                                        <p className="font-semibold flex items-center space-x-1">{member.name} <VerifiedBadge user={member}/></p>
                                        <p className="text-xs text-text-secondary">{member.isFamilyHead ? 'Head' : 'Member'}</p>
                                    </div>
                                </div>
                                {user.isFamilyHead && !member.isFamilyHead && (
                                    <button onClick={() => removeMember(member.id)} className="p-2 hover:bg-bg-tertiary rounded-full"><UserMinusIcon className="h-5 w-5 text-feedback-error"/></button>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                {user.isFamilyHead && <FamilySecurityCard family={family} onUpdate={onUpdateFamily} />}

                <div>
                    <h2 className="text-lg md:text-xl font-bold mb-3">{t('family.sharedGoals')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {family.sharedGoals.map(goal => (
                            <GoalCard key={goal.id} goal={goal} onUpdate={handleUpdateGoal} isFamilyHead={user.isFamilyHead} formatCurrency={formatCurrency} />
                        ))}
                    </div>
                </div>

            </div>
        </PageLayout>
    );
};

export default FamilyScreen;
