import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Item } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { predefinedLocations } from './AdminDashboardPage';
import {
  LayoutDashboard,
  Search,
  Settings,
  Bookmark,
  User,
  FileCheck,
  MapPin,
  Sparkles,
  Phone,
  Mail,
  Camera
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    items,
    claims,
    currentUser,
    activeStudent,
    setPage,
    setSelectedItemId,
    fetchItems,
    editStudent,
    logout
  } = useApp();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'lost' | 'claims' | 'profile' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');

  const filteredCatalogItems = items.filter(item => {
    const categoryMatch = categoryFilter === 'All' || item.category === categoryFilter;
    let locationMatch = false;
    if (locationFilter === 'All') {
      locationMatch = true;
    } else if (locationFilter === 'Custom') {
      locationMatch = !predefinedLocations.includes(item.found_location);
    } else {
      locationMatch = item.found_location === locationFilter;
    }
    return categoryMatch && locationMatch;
  });
  
  // Profile Form States
  const [emailInput, setEmailInput] = useState(activeStudent?.college_email || '');
  const [phoneInput, setPhoneInput] = useState(activeStudent?.phone_number || '');
  const [photoInput, setPhotoInput] = useState(activeStudent?.profile_photo || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (activeStudent) {
      setEmailInput(activeStudent.college_email);
      setPhoneInput(activeStudent.phone_number);
      setPhotoInput(activeStudent.profile_photo);
    }
  }, [activeStudent]);

  // Hook up intelligent search API with debounce/simple change trigger
  useEffect(() => {
    fetchItems(searchQuery);
  }, [searchQuery]);

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setPage('item-details');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;
    setProfileSuccess('');
    setProfileError('');
    
    const success = await editStudent(activeStudent.roll_number, {
      college_email: emailInput,
      phone_number: phoneInput,
      profile_photo: photoInput
    });

    if (success) {
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } else {
      setProfileError('Failed to update profile.');
    }
  };

  // Helper to calculate collection badge / text
  const getClaimedBadge = (item: Item) => {
    if (item.status !== 'Claimed & Collected') return null;

    // Find claim approval date
    const claim = claims.find(c => c.item_id === item.id && c.approval_status === 'approved');
    if (!claim || !claim.claimed_date) return 'Claimed';

    const claimDate = new Date(claim.claimed_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - claimDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Claimed Today';
    if (diffDays === 1) return 'Claimed Yesterday';
    return `Claimed ${diffDays} Days Ago`;
  };

  const myClaimsCount = claims.length;
  const waitingItems = items.filter(i => i.status === 'Waiting for Owner');
  const claimRequestedItems = items.filter(i => i.status === 'Claim Requested');
  const claimedItems = items.filter(i => i.status === 'Claimed & Collected');

  interface MenuItem {
    id: 'dashboard' | 'lost' | 'claims' | 'profile' | 'settings';
    label: string;
    icon: any;
    badge?: number;
  }

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'lost', label: 'Lost Items Directory', icon: Bookmark, badge: waitingItems.length + claimRequestedItems.length },
    { id: 'claims', label: 'My Claims History', icon: FileCheck, badge: myClaimsCount > 0 ? myClaimsCount : undefined },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Portal Configs', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex pt-16 bg-[#FFF8F9]">
      {/* LEFT SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-borderMain/60 py-6 px-4 shrink-0 justify-between select-none">
        <div className="space-y-6">
          {/* User profile capsule */}
          <div className="flex items-center gap-3 p-2 bg-bgMain rounded-xl border border-borderMain/50">
            {activeStudent && activeStudent.profile_photo ? (
              <img
                src={activeStudent.profile_photo}
                alt={activeStudent.full_name}
                className="w-9 h-9 rounded-full object-cover border border-primary/20"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                {currentUser?.name[0] || 'U'}
              </div>
            )}
            <div className="text-left overflow-hidden">
              <p className="font-sans font-bold text-xs text-textMain truncate leading-tight">
                {currentUser?.name}
              </p>
              <p className="text-[10px] text-textMuted font-medium truncate mt-0.5">
                Roll: {activeStudent?.roll_number}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-light text-primary font-bold'
                      : 'text-textMuted hover:text-textMain hover:bg-bgMain'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={isActive ? 'text-primary' : 'text-textMuted'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-primary text-white' : 'bg-borderMain text-textMuted'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="border-t border-borderMain/50 pt-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] text-textMuted px-2 font-medium">
            <span>Server: Campus-01</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="text-left">
            <h2 className="text-2xl md:text-3xl font-sans font-extrabold text-textMain tracking-tight">
              Good Morning, {activeStudent?.full_name || currentUser?.name || 'Sajit'} 👋
            </h2>
            <p className="text-xs text-textMuted mt-1 font-medium">
              Browse lost reports, claim items, or track status of your verification queues.
            </p>
          </div>

          {/* Quick Search */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted" size={14} />
              <input
                type="text"
                placeholder="Intelligent fuzzy search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-80 pl-9 pr-4 py-2.5 text-xs bg-white border border-borderMain rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Dynamic sub-view switching */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-8"
            >
              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: 'Lost Items logged', val: waitingItems.length + claimRequestedItems.length, border: 'border-l-primary' },
                  { label: 'Claim Requested', val: claimRequestedItems.length, border: 'border-l-yellow-400' },
                  { label: 'Claimed & Collected', val: claimedItems.length, border: 'border-l-emerald-500' },
                  { label: 'My Claims History', val: myClaimsCount, border: 'border-l-indigo-500' },
                ].map(stat => (
                  <div key={stat.label} className={`bg-white p-4 md:p-5 rounded-2xl border border-borderMain/60 shadow-soft border-l-4 ${stat.border} text-left`}>
                    <p className="text-[10px] text-textMuted uppercase font-bold tracking-wider">{stat.label}</p>
                    <p className="text-2xl md:text-3xl font-sans font-extrabold text-textMain mt-1.5">{stat.val}</p>
                  </div>
                ))}
              </div>

              {/* Grid split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Recent Items */}
                <div className="lg:col-span-8 space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <h3 className="font-sans font-bold text-base text-textMain">Active Lost Items in Office</h3>
                    <button onClick={() => setActiveTab('lost')} className="text-xs text-primary font-bold hover:underline">View All</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.slice(0, 4).map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className="bg-white border border-borderMain rounded-2xl overflow-hidden shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="relative h-36 bg-borderMain/10">
                          <img src={item.images[0]} alt={item.item_name} className="w-full h-full object-cover" />
                          <span className={`absolute top-2.5 right-2.5 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            item.status === 'Claimed & Collected'
                              ? 'bg-emerald-100 text-emerald-600'
                              : item.status === 'Claim Requested'
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-primary-light text-primary'
                          }`}>
                            {item.status === 'Claimed & Collected' ? getClaimedBadge(item) : item.status.toUpperCase()}
                          </span>

                          {item.matchScore && (
                            <span className="absolute bottom-2.5 left-2.5 text-[9px] font-extrabold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                              <Sparkles size={8} />
                              {item.matchScore}% Match
                            </span>
                          )}
                        </div>
                        <div className="p-4 space-y-2">
                          <span className="text-[9px] font-bold text-accent uppercase tracking-wider">{item.category}</span>
                          <h4 className="font-sans font-bold text-xs text-textMain truncate">{item.item_name}</h4>
                          <div className="flex justify-between items-center text-[10px] text-textMuted pt-2 border-t border-borderMain/50">
                            <span className="flex items-center gap-1"><MapPin size={10} /> {item.found_location}</span>
                            <span>{item.found_date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="col-span-2 py-10 text-center text-xs text-textMuted bg-white border border-borderMain/50 rounded-2xl">
                        No active lost items reported.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Claims summary feed */}
                <div className="lg:col-span-4 space-y-6 text-left">
                  <h3 className="font-sans font-bold text-base text-textMain">Claims Status Feed</h3>

                  <div className="bg-white border border-borderMain/60 rounded-2xl p-5 shadow-soft space-y-4">
                    {claims.slice(0, 3).map(claim => (
                      <div key={claim.id} className="flex items-start gap-3 border-b border-borderMain/50 pb-3 last:border-0 last:pb-0">
                        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                          claim.approval_status === 'approved' ? 'bg-emerald-500' :
                          claim.approval_status === 'rejected' ? 'bg-red-400' :
                          claim.approval_status === 'expired' ? 'bg-neutral-400' : 'bg-yellow-400'
                        }`} />
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className="text-xs font-bold text-textMain truncate">
                            {claim.lost_items ? claim.lost_items.item_name : 'Lost Item'}
                          </p>
                          <p className="text-[10px] text-textMuted leading-relaxed">
                            Status: <span className="font-semibold">{claim.approval_status.toUpperCase()}</span>
                          </p>
                          {claim.approval_status === 'approved' && (
                            <span className="text-[9px] font-mono text-emerald-600 block">Code: {claim.receipt_code}</span>
                          )}
                          <span className="text-[9px] text-textMuted block">
                            Requested: {new Date(claim.claim_request_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {claims.length === 0 && (
                      <div className="py-8 text-center text-xs text-textMuted font-medium">
                        You have no submitted claims in record.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'lost' && (
            <motion.div
              key="lost-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 text-left"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-sans font-bold text-lg text-textMain">Campus Lost Items Catalog</h3>
                <span className="text-xs text-textMuted">{filteredCatalogItems.length} items active</span>
              </div>

              {/* Filtering Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-borderMain p-4 rounded-2xl shadow-soft text-left w-full">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-textMuted uppercase tracking-wider">Filter by Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="All">All Categories</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Personal Items">Personal Items</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Keys">Keys</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-textMuted uppercase tracking-wider">Filter by Campus Location</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="All">All Campus Locations</option>
                    {predefinedLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                    <option value="Custom">Custom / Other Locations</option>
                  </select>
                </div>
              </div>

              {filteredCatalogItems.length === 0 ? (
                <div className="py-20 bg-white border border-borderMain/60 rounded-2xl text-center text-xs text-textMuted w-full">
                  No items active in local catalog matching search criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredCatalogItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className="bg-white border border-borderMain rounded-2xl overflow-hidden shadow-soft hover:shadow-hover hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="relative h-44 bg-borderMain/10">
                        <img src={item.images[0]} alt={item.item_name} className="w-full h-full object-cover" />
                        <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'Claimed & Collected'
                            ? 'bg-emerald-100 text-emerald-600'
                            : item.status === 'Claim Requested'
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-primary-light text-primary'
                        }`}>
                          {item.status === 'Claimed & Collected' ? getClaimedBadge(item) : item.status.toUpperCase()}
                        </span>

                        {item.matchScore && (
                          <span className="absolute bottom-3 left-3 text-[10px] font-extrabold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                            <Sparkles size={10} />
                            {item.matchScore}% Match
                          </span>
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        <span className="text-[9px] font-sans font-bold text-accent uppercase tracking-wider">{item.category}</span>
                        <h4 className="font-sans font-bold text-sm text-textMain truncate leading-tight">{item.item_name}</h4>
                        <p className="text-[11px] text-textMuted line-clamp-2 leading-relaxed min-h-[32px]">{item.description}</p>
                        <div className="flex justify-between items-center text-[10px] text-textMuted pt-2 border-t border-borderMain/50">
                          <span>{item.found_location}</span>
                          <span>{item.found_date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'claims' && (
            <motion.div
              key="claims-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 text-left"
            >
              <h3 className="font-sans font-bold text-lg text-textMain">Claims Ownership Log</h3>

              <div className="space-y-4">
                {claims.map(claim => (
                  <div
                    key={claim.id}
                    className="bg-white p-5 border border-borderMain rounded-2xl shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-sans font-bold text-sm text-textMain">
                          {claim.lost_items ? claim.lost_items.item_name : 'Lost Item'}
                        </h4>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          claim.approval_status === 'approved' ? 'bg-emerald-150 text-emerald-600' :
                          claim.approval_status === 'rejected' ? 'bg-red-50 text-red-500' :
                          claim.approval_status === 'expired' ? 'bg-neutral-100 text-neutral-600' :
                          'bg-yellow-50 text-yellow-600'
                        }`}>
                          {claim.approval_status.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-xs text-textMuted">
                        Deadline to claim in office:{' '}
                        <strong className="text-textMain">
                          {new Date(claim.expected_collection_deadline).toLocaleString()}
                        </strong>
                      </p>

                      {claim.receipt_code && (
                        <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg inline-block text-[10px] font-mono text-emerald-700">
                          Digital Receipt Code: <strong>{claim.receipt_code}</strong>
                        </div>
                      )}
                    </div>

                    <div className="text-right text-[10px] text-textMuted space-y-1">
                      <span>Submitted: {new Date(claim.claim_request_date).toLocaleDateString()}</span>
                      {claim.claimed_date && (
                        <span className="block text-emerald-600">Collected: {new Date(claim.claimed_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
                {claims.length === 0 && (
                  <div className="py-20 bg-white border border-borderMain/60 rounded-2xl text-center text-xs text-textMuted">
                    No claim records compiled.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-6"
            >
              <div className="w-full max-w-2xl bg-white border border-borderMain rounded-3xl p-6 md:p-8 shadow-soft text-left space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-borderMain/50">
                  {activeStudent?.profile_photo ? (
                    <img
                      src={activeStudent.profile_photo}
                      alt={activeStudent.full_name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
                      {currentUser?.name[0]}
                    </div>
                  )}
                  <div className="space-y-1.5 text-center sm:text-left">
                    <h3 className="font-sans font-extrabold text-xl text-textMain">{activeStudent?.full_name}</h3>
                    <span className="inline-block text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Academic Verified Account
                    </span>
                    <div className="text-xs text-textMuted flex gap-4 mt-1 flex-wrap justify-center sm:justify-start font-medium">
                      <span>Dept: <strong>{activeStudent?.department}</strong></span>
                      <span>Year: <strong>{activeStudent?.year}</strong></span>
                      <span>Sec: <strong>{activeStudent?.section}</strong></span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <h4 className="text-xs font-bold text-textMain uppercase tracking-wider flex items-center gap-1.5">
                    <Settings size={14} className="text-primary" />
                    <span>Editable Contact Coordinates</span>
                  </h4>

                  {profileSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-bold">{profileSuccess}</div>}
                  {profileError && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-bold">{profileError}</div>}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* College Email */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">College Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={12} />
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={12} />
                        <input
                          type="text"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Photo URL */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Profile Photo URL</label>
                      <div className="relative">
                        <Camera className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={12} />
                        <input
                          type="text"
                          value={photoInput}
                          onChange={(e) => setPhotoInput(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl transition-all shadow-md"
                    >
                      Save Profile Details
                    </button>
                  </div>
                </form>

                <div className="space-y-3 pt-6 border-t border-borderMain/50 text-xs">
                  <div className="flex justify-between">
                    <span className="text-textMuted">Permanent Roll Number</span>
                    <span className="font-semibold text-textMain font-mono">{activeStudent?.roll_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textMuted">Academic Register Number</span>
                    <span className="font-semibold text-textMain font-mono">{activeStudent?.register_number}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 text-left"
            >
              <h3 className="font-sans font-bold text-lg text-textMain">Portal Configurations</h3>

              <div className="bg-white border border-borderMain rounded-2xl p-6 shadow-soft space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-sans font-bold text-sm text-textMain">Administrative Session</h4>
                    <p className="text-xs text-textMuted">Log out to switch credentials or access different role levels.</p>
                  </div>
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 rounded-xl text-xs font-bold transition-all"
                  >
                    Logout Now
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
export default DashboardPage;
