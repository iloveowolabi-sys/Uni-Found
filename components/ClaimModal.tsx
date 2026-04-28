import React, { useState } from 'react';
import { MapPin, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react';
import Button from './Button';
import { ItemReport } from '../types';
import { toast } from 'sonner';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message?: string) => Promise<void>;
  item: ItemReport | null;
}

const ClaimModal: React.FC<ClaimModalProps> = ({ isOpen, onClose, onConfirm, item }) => {
  const [step, setStep] = useState<'CONFIRM' | 'SUCCESS'>('CONFIRM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen || !item) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(message.trim() || undefined);
      setStep('SUCCESS');
      // Auto-close after 2 seconds so they can see the location but don't get stuck
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error('Failed to claim item. Please check your permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('CONFIRM');
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {step === 'CONFIRM' ? (
          <>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4 mx-auto">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Confirm Ownership</h3>
            <p className="text-center text-slate-600 mb-4">
              Are you sure you are the owner of <strong>{item.title}</strong>? By claiming this item, you confirm that it belongs to you.
            </p>
            
            <div className="mb-6">
              <label htmlFor="claim-message" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                Message to Finder (Optional)
              </label>
              <textarea
                id="claim-message"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                placeholder="E.g., I can pick it up at the main library at 3 PM today."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={isSubmitting}>
                {isSubmitting ? 'Claiming...' : 'Yes, I am the owner'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4 mx-auto">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Item Claimed Successfully!</h3>
            <p className="text-center text-slate-600 mb-4">
              An email notification has been sent. Please pick up your item at the following location:
            </p>
            <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-center gap-2 mb-6 border border-slate-100">
              <MapPin className="w-5 h-5 text-slate-500" />
              <span className="font-medium text-slate-800">{item.location}</span>
            </div>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ClaimModal;
