import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Timeline } from '../components/Timeline';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldAlert, CheckCircle, PackageOpen, HelpCircle, UserCheck } from 'lucide-react';

export const ItemDetailsPage: React.FC = () => {
  const {
    items,
    selectedItemId,
    setPage,
    activeStudent,
    submitClaim,
    claims
  } = useApp();

  const [isClaiming, setIsClaiming] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [formError, setFormError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Find item
  const item = items.find(i => i.id === selectedItemId);

  if (!item) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-[#FFF8F9]">
        <div className="text-center p-8 bg-white border border-borderMain rounded-2xl shadow-soft">
          <ShieldAlert className="text-primary mx-auto mb-3" size={24} />
          <p className="text-sm font-bold text-textMain">Item details not found</p>
          <button onClick={() => setPage('dashboard')} className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Find active claim for this item
  const activeClaim = claims.find(c => c.item_id === item.id && c.approval_status !== 'rejected');

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      setFormError('Please describe the unique identifying details of the item.');
      return;
    }
    if (!activeStudent) {
      setFormError('You must be logged in as a student to file a claim.');
      return;
    }

    const success = await submitClaim(item.id, activeStudent.roll_number, remarks);
    if (success) {
      setSubmitSuccess(true);
      setRemarks('');
      setFormError('');
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsClaiming(false);
      }, 3000);
    } else {
      setFormError('Failed to submit claim request. Please check if another claim is active.');
    }
  };

  const getTimelineStatus = () => {
    switch (item.status) {
      case 'Waiting for Owner': return 'reported';
      case 'Claim Requested': return 'claiming';
      case 'Claimed & Collected': return 'returned';
      default: return 'reported';
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-[#FFF8F9]">
      <div className="max-w-4xl mx-auto space-y-8 text-left">
        {/* Navigation back */}
        <button
          onClick={() => {
            setPage('dashboard');
            window.scrollTo(0, 0);
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-textMuted hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>

        {/* 2-COLUMN MAIN PANEL */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Image display (Left) */}
          <div className="md:col-span-5 bg-white border border-borderMain rounded-2xl overflow-hidden shadow-soft">
            <div className="aspect-square bg-borderMain/10">
              <img src={item.images[0]} alt={item.item_name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 text-center border-t border-borderMain/50">
              <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-primary-light text-primary">
                LOST CATALOG ITEM
              </span>
            </div>
          </div>

          {/* Item details card (Right) */}
          <div className="md:col-span-7 bg-white border border-borderMain/60 rounded-2xl p-6 md:p-8 shadow-soft space-y-6">
            <div className="space-y-1.5">
              <span className="text-[10px] font-sans font-extrabold text-primary uppercase tracking-wider">
                {item.category}
              </span>
              <h2 className="text-xl md:text-2xl font-sans font-extrabold text-textMain tracking-tight">
                {item.item_name}
              </h2>
              <div className="flex gap-4 text-[10px] text-textMuted font-medium">
                <span>Location: <strong>{item.found_location}</strong></span>
                <span>•</span>
                <span>Date Logged: <strong>{item.found_date}</strong></span>
              </div>
            </div>

            <div className="space-y-2 border-t border-borderMain/50 pt-4">
              <h4 className="text-xs font-bold text-textMain uppercase tracking-wider">Identifiers & Details</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-textMuted block">Brand</span>
                  <span className="font-semibold text-textMain">{item.brand || 'Generic'}</span>
                </div>
                <div>
                  <span className="text-textMuted block">Color</span>
                  <span className="font-semibold text-textMain">{item.color || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-textMuted block">Building</span>
                  <span className="font-semibold text-textMain">{item.building || 'Campus'}</span>
                </div>
                <div>
                  <span className="text-textMuted block">Floor / Room</span>
                  <span className="font-semibold text-textMain">
                    {item.floor ? `${item.floor}F` : ''} {item.room ? `Rm ${item.room}` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-borderMain/50 pt-4">
              <h4 className="text-xs font-bold text-textMain uppercase tracking-wider">Item Description</h4>
              <p className="text-xs text-textMuted leading-relaxed bg-[#FFF8F9] p-4 rounded-xl border border-borderMain/30">
                {item.description}
              </p>
            </div>

            {/* ACTION TRIGGERS */}
            <div className="border-t border-borderMain/50 pt-6">
              <AnimatePresence mode="wait">
                {item.status === 'Claimed & Collected' ? (
                  <motion.div
                    key="returned-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-emerald-50 border border-emerald-250 rounded-xl flex items-start gap-3"
                  >
                    <CheckCircle className="text-emerald-500 shrink-0" size={18} />
                    <div className="space-y-1 text-left">
                      <p className="text-xs font-bold text-emerald-800">Claimed & Collected</p>
                      <p className="text-[10px] text-emerald-700 leading-relaxed">
                        This item was successfully returned and collected by claimant student. Receipt verification code: <strong>{activeClaim?.receipt_code || 'REC-887413'}</strong>
                      </p>
                    </div>
                  </motion.div>
                ) : item.status === 'Claim Requested' ? (
                  <motion.div
                    key="claiming-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3"
                  >
                    <HelpCircle className="text-amber-500 shrink-0" size={18} />
                    <div className="space-y-1 text-left">
                      <p className="text-xs font-bold text-amber-800">Claim Requested (Awaiting Verification)</p>
                      <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                        A claimant has filed ownership. The safety office requires the claimant to visit the campus office within <strong>2 working days</strong> for physical collection.
                      </p>
                    </div>
                  </motion.div>
                ) : isClaiming ? (
                  <motion.form
                    key="claiming-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleClaimSubmit}
                    className="space-y-4 text-xs text-left"
                  >
                    {submitSuccess ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-500" />
                        <span className="text-emerald-800 font-bold">Claim submitted successfully!</span>
                      </div>
                    ) : (
                      <>
                        <div className="bg-primary-light/40 p-4 rounded-xl border border-primary/10 space-y-2">
                          <p className="text-[11px] text-primary font-bold flex items-center gap-1.5">
                            <UserCheck size={14} />
                            <span>Claimant Credentials (Auto-Populated)</span>
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-textMuted">
                            <span>Name: <strong className="text-textMain">{activeStudent?.full_name}</strong></span>
                            <span>Roll Number: <strong className="text-textMain">{activeStudent?.roll_number}</strong></span>
                            <span>Department: <strong className="text-textMain">{activeStudent?.department}</strong></span>
                            <span>Year / Sec: <strong className="text-textMain">{activeStudent?.year} ({activeStudent?.section})</strong></span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-textMain">Ownership Verification Details</label>
                          <textarea
                            rows={3}
                            placeholder="Describe any unique stickers, casing features, scratches, purchase details, or contents inside/on the item to verify ownership..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                          />
                        </div>

                        {formError && <p className="text-[10px] text-red-500 font-bold">{formError}</p>}

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                          >
                            Submit Claim Details
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsClaiming(false)}
                            className="px-4 py-2 bg-white border border-borderMain rounded-xl text-textMain text-xs font-semibold hover:bg-bgMain"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </motion.form>
                ) : (
                  <motion.div key="claim-trigger" className="space-y-3">
                    <button
                      onClick={() => {
                        if (!activeStudent) {
                          setPage('landing');
                          window.scrollTo(0, 0);
                        } else {
                          setIsClaiming(true);
                        }
                      }}
                      className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 hover:scale-102"
                    >
                      <PackageOpen size={16} />
                      Claim Ownership of Item
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* TIMELINE COMPONENT PANEL */}
        <div className="bg-white border border-borderMain/60 rounded-2xl p-6 shadow-soft space-y-4">
          <h3 className="font-sans font-bold text-sm text-textMain uppercase tracking-wider">Retrieval Timeline</h3>
          <Timeline status={getTimelineStatus()} />
        </div>
      </div>
    </div>
  );
};
export default ItemDetailsPage;
