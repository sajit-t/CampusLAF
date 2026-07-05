import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Timeline } from '../components/Timeline';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ShieldAlert, CheckCircle, PackageOpen, HelpCircle,
  ChevronLeft, ChevronRight, Maximize2, X, Trash2, Edit, Loader2, MapPin
} from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';
import { predefinedLocations } from './AdminDashboardPage';

export const ItemDetailsPage: React.FC = () => {
  const {
    items,
    selectedItemId,
    setPage,
    claims,
    currentUser,
    editItem,
    deleteItem
  } = useApp();

  // Gallery states
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Edit/Delete mode states
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit fields state
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Electronics');
  const [editBrand, setEditBrand] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editVal, setEditVal] = useState('');
  const [editLoc, setEditLoc] = useState('');
  const [editBldg, setEditBldg] = useState('');
  const [editFloor, setEditFloor] = useState('1');
  const [editRoom, setEditRoom] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<'Waiting for Owner' | 'Claim Requested' | 'Claimed & Collected' | 'Archived'>('Waiting for Owner');
  
  const [editExistingImages, setEditExistingImages] = useState<string[]>([]);
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);
  const [selectedLocOpt, setSelectedLocOpt] = useState('');
  const [customLocText, setCustomLocText] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Find item
  const item = items.find(i => i.id === selectedItemId);

  // Setup edit form fields when entering editing mode
  useEffect(() => {
    if (isEditing && item) {
      setEditName(item.item_name);
      setEditCategory(item.category);
      setEditBrand(item.brand || '');
      setEditColor(item.color || '');
      setEditDesc(item.description);
      setEditVal(item.estimated_value.toString());
      setEditLoc(item.found_location);
      setEditBldg(item.building || '');
      setEditFloor(item.floor?.toString() || '');
      setEditRoom(item.room || '');
      setEditDate(item.found_date);
      setEditTime(item.found_time || '');
      setEditNotes(item.notes || '');
      setEditStatus(item.status);
      setEditExistingImages(item.images || []);
      setEditNewFiles([]);

      // Predefined location dropdown sync
      if (predefinedLocations.includes(item.found_location)) {
        setSelectedLocOpt(item.found_location);
        setCustomLocText('');
      } else {
        setSelectedLocOpt('Other');
        setCustomLocText(item.found_location);
      }
    }
  }, [isEditing, item]);

  // Gallery keyboard controls
  useEffect(() => {
    if (!isFullscreen || !item || !item.images || item.images.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
      if (e.key === 'ArrowLeft') {
        setCurrentImgIndex(prev => (prev === 0 ? item.images.length - 1 : prev - 1));
      }
      if (e.key === 'ArrowRight') {
        setCurrentImgIndex(prev => (prev === item.images.length - 1 ? 0 : prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, item]);

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

  const imagesList = item.images && item.images.length > 0 ? item.images : ['/uploads/placeholder.jpg'];
  const hasMultipleImages = imagesList.length > 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex(prev => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex(prev => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  // Active claim for this item
  const activeClaim = claims.find(c => c.item_id === item.id && c.approval_status !== 'rejected');

  const handleDeleteItem = async () => {
    setDeleteLoading(true);
    const success = await deleteItem(item.id);
    setDeleteLoading(false);
    if (success) {
      setPage('dashboard');
      window.scrollTo(0, 0);
    } else {
      alert('Failed to delete item.');
    }
  };

  const handleEditItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editName || !editDesc || !editLoc) {
      setEditError('Please fill item name, description and location.');
      return;
    }

    if (editExistingImages.length + editNewFiles.length > 5) {
      setEditError('Maximum of 5 images total is allowed.');
      return;
    }

    setEditLoading(true);

    try {
      let finalImages = [...editExistingImages];

      // 1. Upload new files if present
      if (editNewFiles.length > 0) {
        const token = localStorage.getItem('cr_token');
        const formData = new FormData();
        editNewFiles.forEach(file => formData.append('files', file));
        
        const res = await fetch('/api/items/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload new images');
        
        finalImages = [...finalImages, ...data.urls];
      }

      // If no images at all, default to empty array
      if (finalImages.length === 0) {
        finalImages = ['/uploads/placeholder.jpg'];
      }

      const payload = {
        category: editCategory,
        item_name: editName,
        brand: editBrand,
        color: editColor,
        description: editDesc,
        estimated_value: parseFloat(editVal) || 0,
        found_location: editLoc,
        building: editBldg,
        floor: parseInt(editFloor) || undefined,
        room: editRoom,
        found_date: editDate,
        found_time: editTime || undefined,
        notes: editNotes,
        status: editStatus,
        images: finalImages
      };

      const success = await editItem(item.id, payload);
      if (success) {
        setIsEditing(false);
        setCurrentImgIndex(0);
      } else {
        setEditError('Failed to modify item database record.');
      }
    } catch (err: any) {
      setEditError(err.message || 'Error saving changes.');
    } finally {
      setEditLoading(false);
    }
  };

  const getTimelineStatus = () => {
    switch (item.status) {
      case 'Waiting for Owner': {
        const hasApprovedClaim = claims.some(c => c.item_id === item.id && c.approval_status === 'approved');
        return hasApprovedClaim ? 'verified' : 'reported';
      }
      case 'Claim Requested': {
        const hasApprovedClaim = claims.some(c => c.item_id === item.id && c.approval_status === 'approved');
        return hasApprovedClaim ? 'verified' : 'claiming';
      }
      case 'Claimed & Collected': return 'returned';
      default: return 'reported';
    }
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-[#FFF8F9]">
      <div className="max-w-4xl mx-auto space-y-6 text-left">
        
        {/* TOP CONTROLS & BACK LINK */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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

          {/* Admin Command Buttons */}
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 bg-white border border-borderMain hover:border-primary text-textMain hover:text-primary text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <Edit size={13} /> Edit Item
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-1.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-100 hover:border-red-500 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <Trash2 size={13} /> Delete Record
              </button>
            </div>
          )}
        </div>

        {/* 2-COLUMN MAIN PANEL */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Image Gallery Carousel */}
          <div className="md:col-span-5 bg-white border border-borderMain rounded-2xl overflow-hidden shadow-soft flex flex-col justify-between">
            <div className="relative aspect-square bg-borderMain/10 group cursor-zoom-in overflow-hidden">
              <img
                src={imagesList[currentImgIndex]}
                alt={item.item_name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onClick={() => {
                  if (imagesList[0] !== '/uploads/placeholder.jpg') {
                    setIsFullscreen(true);
                  }
                }}
              />

              {/* Zoom trigger indicator */}
              {imagesList[0] !== '/uploads/placeholder.jpg' && (
                <div className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 size={12} />
                </div>
              )}

              {/* Image index counter */}
              {hasMultipleImages && (
                <span className="absolute top-3 left-3 text-[9px] font-extrabold px-2 py-1 rounded-lg bg-black/60 text-white backdrop-blur-sm">
                  {currentImgIndex + 1} / {imagesList.length}
                </span>
              )}

              {/* Status Banner */}
              <span className={`absolute top-3 right-3 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-sm ${
                item.status === 'Waiting for Owner' 
                  ? 'bg-primary-light text-primary border-primary/10'
                  : item.status === 'Claim Requested'
                  ? 'bg-amber-50 text-amber-600 border-amber-100'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>
                {item.status.toUpperCase()}
              </span>

              {/* Navigation overlays */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-black/50 hover:bg-black/75 text-white transition-all scale-95 hover:scale-100"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-black/50 hover:bg-black/75 text-white transition-all scale-95 hover:scale-100"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail dots */}
            {hasMultipleImages && (
              <div className="p-3 border-t border-borderMain/50 bg-bgMain/30 flex justify-center gap-1.5">
                {imagesList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImgIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === currentImgIndex ? 'bg-primary w-4' : 'bg-textMuted/40 hover:bg-textMuted/70'
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="p-4 text-center border-t border-borderMain/50">
              <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-primary-light text-primary">
                LOST CATALOG ITEM
              </span>
            </div>
          </div>

          {/* Right Column: Item details card */}
          <div className="md:col-span-7 bg-white border border-borderMain/60 rounded-2xl p-6 md:p-8 shadow-soft space-y-6">
            <div className="space-y-1.5">
              <span className="text-[10px] font-sans font-extrabold text-primary uppercase tracking-wider">
                {item.category}
              </span>
              <h2 className="text-xl md:text-2xl font-sans font-extrabold text-textMain tracking-tight">
                {item.item_name}
              </h2>
              <div className="flex gap-4 text-[10px] text-textMuted font-medium">
                <span className="flex items-center gap-1"><MapPin size={11} /> {item.found_location}</span>
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

            {/* Notes Section (Visible to everyone if set, else internal only) */}
            {item.notes && (
              <div className="space-y-2 border-t border-borderMain/50 pt-4">
                <h4 className="text-xs font-bold text-textMain uppercase tracking-wider">Additional Information</h4>
                <p className="text-xs text-textMuted leading-relaxed bg-bgMain/40 p-4 rounded-xl border border-borderMain/20">
                  {item.notes}
                </p>
              </div>
            )}            {/* ACTION TRIGGERS */}
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
                ) : item.type === 'lost' ? (
                  <motion.div
                    key="lost-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3"
                  >
                    <HelpCircle className="text-rose-500 shrink-0" size={18} />
                    <div className="space-y-1 text-left">
                      <p className="text-xs font-bold text-rose-800">Lost Report Active</p>
                      <p className="text-[10px] text-rose-700 leading-relaxed">
                        This lost item report is active. If someone submits a matching item to the physical Safety Office, the staff will register it and update this record.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="collection-instructions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-primary-light/35 border border-primary/20 rounded-xl flex items-start gap-3"
                  >
                    <PackageOpen className="text-primary shrink-0 animate-pulse" size={18} />
                    <div className="space-y-1 text-left">
                      <p className="text-xs font-bold text-primary">In-Person Retrieval Required</p>
                      <p className="text-[10px] text-textMuted leading-relaxed">
                        To claim and retrieve this item, please visit the <strong>Campus Safety & Lost & Found Office (Room 102)</strong> physically.
                      </p>
                      <p className="text-[10px] text-textMuted leading-relaxed mt-1 font-semibold">
                        Make sure to bring your Student ID Card. You will be asked to verify details, keys, passwords, or markings to prove ownership before checkout.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RETRIEVAL TIMELINE PANEL */}
        <div className="bg-white border border-borderMain/60 rounded-2xl p-6 shadow-soft space-y-4">
          <h3 className="font-sans font-bold text-sm text-textMain uppercase tracking-wider">Retrieval Timeline</h3>
          <Timeline status={getTimelineStatus()} />
        </div>
      </div>

      {/* FULLSCREEN ZOOM MODAL OVERLAY */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setIsFullscreen(false)}
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors shadow"
            >
              <X size={20} />
            </button>

            {hasMultipleImages && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            <img
              src={imagesList[currentImgIndex]}
              alt={item.item_name}
              className="max-w-full max-h-[90vh] object-contain rounded-lg select-none"
              onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking on the image itself
            />

            {/* Fullscreen count */}
            {hasMultipleImages && (
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold text-white/60">
                {currentImgIndex + 1} of {imagesList.length}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white border border-borderMain rounded-3xl p-6 md:p-8 max-w-sm w-full text-center space-y-4 shadow-xl"
            >
              <div className="p-3 bg-red-50 text-red-500 rounded-full w-fit mx-auto border border-red-100">
                <Trash2 size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-base text-textMain">Delete Catalog Record?</h4>
                <p className="text-xs text-textMuted leading-relaxed">
                  This action is permanent. All images stored in Supabase Storage and database claims for this item will be deleted.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={deleteLoading}
                  onClick={handleDeleteItem}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  {deleteLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    'Confirm Delete'
                  )}
                </button>
                <button
                  disabled={deleteLoading}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2.5 bg-white border border-borderMain text-textMain text-xs font-semibold rounded-xl hover:bg-bgMain transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT ITEM MODAL */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border border-borderMain rounded-3xl p-6 md:p-8 max-w-2xl w-full text-left space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsEditing(false)}
                className="absolute top-6 right-6 p-2 border border-borderMain/50 hover:bg-bgMain text-textMuted hover:text-textMain rounded-xl transition-all"
              >
                <X size={16} />
              </button>

              <div className="space-y-1">
                <h3 className="font-sans font-bold text-lg text-textMain flex items-center gap-1.5">
                  <Edit size={18} className="text-primary" /> Edit Lost Catalog Record
                </h3>
                <p className="text-xs text-textMuted">Modify item logging, parameters, locations, and attachment files.</p>
              </div>

              {editError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800 font-bold flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-red-500 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleEditItemSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Item Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Item Name *</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Category *</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Personal Items">Personal Items</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Keys">Keys</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Brand */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Brand</label>
                    <input
                      type="text"
                      value={editBrand}
                      onChange={(e) => setEditBrand(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none"
                    />
                  </div>

                  {/* Color */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Color</label>
                    <input
                      type="text"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none"
                    />
                  </div>

                  {/* Predefined Location */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Found Location *</label>
                    <select
                      value={selectedLocOpt}
                      onChange={(e) => {
                        setSelectedLocOpt(e.target.value);
                        if (e.target.value !== 'Other') {
                          setEditLoc(e.target.value);
                        } else {
                          setEditLoc('');
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none"
                      required
                    >
                      <option value="" disabled>Select predefined location...</option>
                      {predefinedLocations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                      <option value="Other">Other (Specify Custom Location)</option>
                    </select>

                    {selectedLocOpt === 'Other' && (
                      <input
                        type="text"
                        placeholder="Specify Custom Location *"
                        value={customLocText}
                        onChange={(e) => {
                          setCustomLocText(e.target.value);
                          setEditLoc(e.target.value);
                        }}
                        className="mt-2 w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none"
                        required
                      />
                    )}
                  </div>

                  {/* Building */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Building</label>
                    <input
                      type="text"
                      value={editBldg}
                      onChange={(e) => setEditBldg(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none"
                    />
                  </div>

                  {/* Floor / Room */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Floor</label>
                      <input
                        type="number"
                        value={editFloor}
                        onChange={(e) => setEditFloor(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Room</label>
                      <input
                        type="text"
                        value={editRoom}
                        onChange={(e) => setEditRoom(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Date / Time */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Date *</label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Time</label>
                      <input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Estimated Value */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Estimated Value ($)</label>
                    <input
                      type="number"
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none"
                    />
                  </div>

                  {/* Item Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Status *</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none"
                      required
                    >
                      <option value="Waiting for Owner">Found (Available)</option>
                      <option value="Claim Requested">Claim Pending / Approved</option>
                      <option value="Claimed & Collected">Collected</option>
                      <option value="Archived">Expired</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Description *</label>
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none resize-none"
                    required
                  />
                </div>

                {/* Internal Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Office Notes (Internal)</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none"
                  />
                </div>

                {/* File Upload Component */}
                <div className="pt-2 border-t border-borderMain/50">
                  <ImageUpload
                    existingImages={editExistingImages}
                    onRemoveExisting={(url) => setEditExistingImages(prev => prev.filter(u => u !== url))}
                    files={editNewFiles}
                    onChange={setEditNewFiles}
                    maxFiles={5}
                    maxSizeMB={5}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2 border-t border-borderMain/50">
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-primary/70 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    {editLoading ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={editLoading}
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 bg-white border border-borderMain text-textMain text-xs font-semibold rounded-xl hover:bg-bgMain transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default ItemDetailsPage;
