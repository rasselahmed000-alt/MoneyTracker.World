import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Trash2, Edit2, Plus, ToggleLeft, ToggleRight, AlertCircle, Clock, MessageCircle, Ban, Unlock, Pin, Library, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';

const TABS = [
  { id: 'pending', label: 'Pending Messages', icon: AlertCircle },
  { id: 'approved', label: 'Approved Messages', icon: CheckCircle2 },
  { id: 'message_lib', label: 'Message Library', icon: Library },
  { id: 'schedule', label: 'Auto Schedule', icon: Clock },
  { id: 'banned', label: 'Banned Users', icon: Ban },
  { id: 'logs', label: 'Activity Logs', icon: MessageCircle },
];

export default function AdminGroupChat() {
  const [activeTab, setActiveTab] = useState('pending');
  const [messages, setMessages] = useState([]);
  const [messageLibrary, setMessageLibrary] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState('');
  const [showMsgForm, setShowMsgForm] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // LOCAL form state — only saved to DB on SAVE button click
  const [localSchedule, setLocalSchedule] = useState({
    time_range_minutes: 300,
    target_message_count: 30,
    publish_mode: 'random',
    activity_intensity: 0.5,
    auto_delete_after_send: true,
  });

  useEffect(() => {
    loadData();
    const unsub = base44.entities.GroupMessage.subscribe(() => loadData());
    return () => { if (unsub) unsub(); };
  }, []);

  const loadData = async () => {
    try {
      const [msgs, libs, sched] = await Promise.all([
        base44.entities.GroupMessage.list('-created_date', 200),
        base44.entities.AutoMessageLibrary.list('-created_date', 500),
        base44.entities.AutoMessageSchedule.list('-created_date', 1),
      ]);
      setMessages(msgs || []);
      setMessageLibrary(libs || []);
      const s = sched?.[0] || null;
      setSchedule(s);
      // Sync local form state from DB
      if (s) {
        setLocalSchedule({
          time_range_minutes: s.time_range_minutes || 300,
          target_message_count: s.target_message_count || 30,
          publish_mode: s.publish_mode || 'random',
          activity_intensity: s.activity_intensity ?? 0.5,
          auto_delete_after_send: s.auto_delete_after_send !== false,
        });
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Message Approval
  const handleApprove = async (msgId) => {
    try {
      await base44.entities.GroupMessage.update(msgId, { status: 'approved' });
      await loadData();
    } catch (err) {
      console.error('Approve error:', err);
    }
  };

  const handleReject = async (msgId) => {
    try {
      await base44.entities.GroupMessage.update(msgId, { status: 'rejected' });
      await loadData();
    } catch (err) {
      console.error('Reject error:', err);
    }
  };

  // Parse bulk messages by number prefix (1., ১., 2., ২., etc.)
  const parseBulkMessages = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    const messages = [];
    let currentMsg = '';

    for (const line of lines) {
      // Match English (1., 2., etc.) or Bengali (১., ২., etc.) numbered format
      const match = line.match(/^[\d।]+[\.\)]\s*(.*)/);
      
      if (match) {
        if (currentMsg.trim()) {
          messages.push(currentMsg.trim());
        }
        currentMsg = match[1].trim();
      } else if (currentMsg) {
        currentMsg += ' ' + line.trim();
      }
    }

    if (currentMsg.trim()) {
      messages.push(currentMsg.trim());
    }

    return messages.filter(m => m.length > 0);
  };

  // Message Library
  const handleAddMessage = async () => {
    if (!newMsg.trim()) return;
    try {
      await base44.entities.AutoMessageLibrary.create({ content: newMsg.trim(), is_active: true });
      setNewMsg('');
      setShowMsgForm(false);
      await loadData();
    } catch (err) {
      console.error('Add message error:', err);
    }
  };

  const handleBulkAddMessages = async () => {
    if (!bulkText.trim()) return;
    try {
      const messages = parseBulkMessages(bulkText);
      if (messages.length === 0) {
        alert('No messages found. Please use format: 1. Message or ১. Message');
        return;
      }

      for (const msg of messages) {
        await base44.entities.AutoMessageLibrary.create({ content: msg, is_active: true });
      }

      setBulkText('');
      setBulkMode(false);
      await loadData();
      alert(`Successfully added ${messages.length} messages!`);
    } catch (err) {
      console.error('Bulk add error:', err);
      alert('Error adding messages: ' + err.message);
    }
  };

  const handleDeleteMessage = async (msgId) => {
   if (!confirm('Delete this message from library?')) return;
   try {
     await base44.entities.AutoMessageLibrary.delete(msgId);
     await loadData();
   } catch (err) {
     console.error('Delete message error:', err);
   }
  };

  const handleBulkClearLibrary = async () => {
    if (!confirm('Delete ALL messages from library? This cannot be undone!')) return;
    try {
      let allMsgs = await base44.entities.AutoMessageLibrary.list('sort_order', 1000);
      // Delete in parallel batches of 20 for speed
      const batchSize = 20;
      for (let i = 0; i < allMsgs.length; i += batchSize) {
        const batch = allMsgs.slice(i, i + batchSize);
        await Promise.all(batch.map(msg => base44.entities.AutoMessageLibrary.delete(msg.id)));
      }
      await loadData();
      alert(`✅ Library cleared! ${allMsgs.length} messages deleted.`);
    } catch (err) {
      console.error('Clear error:', err);
      alert('Error: ' + err.message);
    }
  };

  // Toggle is_enabled directly (no save button needed)
  const handleToggleEnabled = async () => {
    try {
      const newVal = !schedule?.is_enabled;
      if (!schedule) {
        await base44.entities.AutoMessageSchedule.create({ is_enabled: newVal });
      } else {
        await base44.entities.AutoMessageSchedule.update(schedule.id, { is_enabled: newVal });
      }
      await loadData();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  // Save all local form state to DB at once
  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        ...localSchedule,
        // Reset batch when settings change so new config applies immediately
        current_batch_start: new Date().toISOString(),
        current_batch_count: 0,
        next_publish_time: null,
        last_message_time: null,
      };
      if (!schedule) {
        await base44.entities.AutoMessageSchedule.create(dataToSave);
      } else {
        await base44.entities.AutoMessageSchedule.update(schedule.id, dataToSave);
      }
      await loadData();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const pendingMessages = messages.filter(m => m.status === 'pending' && m.message_type === 'user');
  const approvedMessages = messages.filter(m => m.status === 'approved');
  const bannedEmails = [...new Set(messages.filter(m => m.is_user_banned).map(m => m.user_email))];

  return (
    <AdminShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Group Chat Management</h1>
            <p className="text-sm text-gray-500 mt-1">Messages, users, library, and automation</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 border-b border-gray-200">
          {TABS.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-forest text-forest'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <TabIcon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-forest rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Pending Messages */}
            {activeTab === 'pending' && (
              <div className="space-y-3">
                {pendingMessages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No pending messages</p>
                ) : (
                  pendingMessages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-yellow-200 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{msg.username}</p>
                          <p className="text-xs text-gray-500">{msg.user_email}</p>
                          <p className="text-sm text-gray-700 mt-2">{msg.content}</p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Pending</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleApprove(msg.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded font-semibold text-sm hover:bg-green-200"
                        >
                          <CheckCircle2 size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(msg.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded font-semibold text-sm hover:bg-red-200"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Approved Messages */}
            {activeTab === 'approved' && (
              <div className="space-y-3">
                {approvedMessages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No approved messages</p>
                ) : (
                  approvedMessages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-green-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{msg.username}</p>
                          <p className="text-xs text-gray-500">{msg.message_type === 'system' ? '🤖 System' : msg.user_email}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(msg.created_date).toLocaleString('en-BD')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-800 rounded">Approved</span>
                          <button
                            onClick={async () => { if (confirm('Delete this message?')) { await base44.entities.GroupMessage.delete(msg.id); loadData(); } }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{msg.content}</p>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Message Library */}
            {activeTab === 'message_lib' && (
              <div className="space-y-3">
                {!showMsgForm && !bulkMode ? (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setShowMsgForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-forest text-white rounded-lg font-semibold hover:bg-opacity-90"
                    >
                      <Plus size={16} /> Single Message
                    </button>
                    <button
                      onClick={() => setBulkMode(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-opacity-90"
                    >
                      <Plus size={16} /> Bulk Import
                    </button>
                    <button
                      onClick={handleBulkClearLibrary}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-opacity-90 ml-auto"
                    >
                      Clear All
                    </button>
                  </div>
                ) : showMsgForm ? (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                    <textarea
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      placeholder="Enter message text..."
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddMessage}
                        className="px-4 py-2 bg-forest text-white rounded-lg font-semibold hover:bg-opacity-90"
                      >
                        Save Message
                      </button>
                      <button
                        onClick={() => { setShowMsgForm(false); setNewMsg(''); }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Paste Multiple Messages (Numbered Format)
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Format: 1. Message Text or ১. মেসেজ টেক্সট (supports both English and Bengali numbers)
                      </p>
                      <textarea
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder={`1. আমার উইথড্র সফল হয়েছে।\n2. ধন্যবাদ, খুব দ্রুত টাকা পেয়েছি।\n3. সাপোর্ট টিম খুব ভালো।`}
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm font-mono"
                        rows={10}
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Messages will be automatically split by numbers. You can paste 100+ messages at once.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleBulkAddMessages}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-opacity-90"
                      >
                        Import {bulkText ? `(${parseBulkMessages(bulkText).length} messages)` : ''}
                      </button>
                      <button
                        onClick={() => { setBulkMode(false); setBulkText(''); }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {messageLibrary.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No messages in library</p>
                ) : (
                  <div className="space-y-2">
                    {messageLibrary.map(msg => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-3 rounded-lg border border-gray-200 flex items-start justify-between"
                      >
                        <p className="text-sm text-gray-700 flex-1">{msg.content}</p>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="ml-3 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}



            {/* Auto Schedule */}
            {activeTab === 'schedule' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

                  {/* Header + Toggle */}
                  <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <div>
                      <h3 className="font-black text-gray-900 text-lg">Auto Message System</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Human-like random timing • No fixed intervals</p>
                    </div>
                    <button
                      onClick={handleToggleEnabled}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        schedule?.is_enabled
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {schedule?.is_enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      {schedule?.is_enabled ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </div>

                  {/* Live Stats Bar */}
                  <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50 border-b border-gray-100">
                    <div className="px-4 py-3 text-center">
                      <p className="text-xs text-gray-500 font-medium">Total Sent</p>
                      <p className="text-2xl font-black text-forest">{schedule?.total_published || 0}</p>
                    </div>
                    <div className="px-4 py-3 text-center">
                      <p className="text-xs text-gray-500 font-medium">Remaining</p>
                      <p className="text-2xl font-black text-blue-600">
                        {Math.max(0, (schedule?.target_message_count || 30) - (schedule?.current_batch_count || 0))}
                      </p>
                    </div>
                    <div className="px-4 py-3 text-center">
                      <p className="text-xs text-gray-500 font-medium">Last Message</p>
                      <p className="text-xs font-bold text-gray-700 mt-1">
                        {schedule?.last_message_time
                          ? new Date(schedule.last_message_time).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="px-6 py-6 space-y-5">

                    {/* Time Range */}
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-3">⏱️ Auto Message Interval</label>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { label: '5 min', value: 5 },
                          { label: '10 min', value: 10 },
                          { label: '15 min', value: 15 },
                          { label: '20 min', value: 20 },
                          { label: '30 min', value: 30 },
                          { label: '45 min', value: 45 },
                          { label: '50 min', value: 50 },
                          { label: '1 hour', value: 60 },
                          { label: '2 hours', value: 120 },
                          { label: '6 hours', value: 360 },
                          { label: '12 hours', value: 720 },
                          { label: '24 hours', value: 1440 },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setLocalSchedule(prev => ({ ...prev, time_range_minutes: opt.value }))}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all ${
                              localSchedule.time_range_minutes === opt.value
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-3 items-center">
                        <input
                          type="number"
                          value={localSchedule.time_range_minutes}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setLocalSchedule(prev => ({ ...prev, time_range_minutes: Math.max(1, val) }));
                          }}
                          className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:border-emerald-500 focus:outline-none transition-colors"
                          min="1"
                          placeholder="Custom minutes"
                        />
                        <div className="shrink-0 bg-emerald-50 border border-emerald-200 px-3 py-2.5 rounded-xl text-center min-w-[72px]">
                          <p className="text-xs text-emerald-600 font-bold">
                            {localSchedule.time_range_minutes >= 1440
                              ? `${(localSchedule.time_range_minutes / 1440).toFixed(1)}d`
                              : localSchedule.time_range_minutes >= 60
                              ? `${(localSchedule.time_range_minutes / 60).toFixed(1)}h`
                              : `${localSchedule.time_range_minutes}m`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Target Messages */}
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">📊 Target Messages</label>
                      <input
                        type="number"
                        value={localSchedule.target_message_count}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setLocalSchedule(prev => ({ ...prev, target_message_count: Math.max(1, val) }));
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base font-bold text-gray-800 focus:border-emerald-500 focus:outline-none transition-colors"
                        min="1"
                        placeholder="e.g. 850"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">
                          Examples: <span className="font-semibold text-gray-600">50 · 380 · 850 · 5000 · 12000+</span>
                        </p>
                        <p className="text-xs font-bold text-emerald-600">
                          ≈ {((localSchedule.target_message_count || 1) / Math.max(0.01, (localSchedule.time_range_minutes || 1) / 60)).toFixed(1)} msg/hr
                        </p>
                      </div>
                    </div>

                    {/* Message Mode */}
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">🎯 Message Mode</label>
                      <div className="flex gap-3">
                        {[
                          { value: 'random', label: '🔀 Random Order' },
                          { value: 'sequential', label: '📋 Sequential' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setLocalSchedule(prev => ({ ...prev, publish_mode: opt.value }))}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                              localSchedule.publish_mode === opt.value
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-gray-200 bg-white text-gray-600'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Activity Speed */}
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">⚡ Activity Speed</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 0.2, label: '🐢 Low', desc: 'Slow group' },
                          { value: 0.5, label: '🚶 Medium', desc: 'Normal group' },
                          { value: 0.75, label: '🏃 High', desc: 'Busy group' },
                          { value: 1.0, label: '⚡ Very High', desc: 'Very active' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setLocalSchedule(prev => ({ ...prev, activity_intensity: opt.value }))}
                            className={`py-2.5 px-3 rounded-xl text-left border-2 transition-all ${
                              localSchedule.activity_intensity === opt.value
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <p className={`text-sm font-bold ${localSchedule.activity_intensity === opt.value ? 'text-emerald-700' : 'text-gray-700'}`}>{opt.label}</p>
                            <p className="text-xs text-gray-400">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Auto Delete */}
                    <button
                      onClick={() => setLocalSchedule(prev => ({ ...prev, auto_delete_after_send: !prev.auto_delete_after_send }))}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        localSchedule.auto_delete_after_send
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className={`w-10 h-6 rounded-full transition-all flex items-center ${localSchedule.auto_delete_after_send ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                        <div className="w-4 h-4 bg-white rounded-full mx-1 shadow" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">🗑️ Auto Delete After Send</p>
                        <p className="text-xs text-gray-500">Remove message from library once sent</p>
                      </div>
                    </button>

                    {/* SAVE BUTTON */}
                    <button
                      onClick={handleSaveSchedule}
                      disabled={saving}
                      className={`w-full py-4 rounded-xl font-black text-base transition-all active:scale-95 ${
                        saveSuccess
                          ? 'bg-emerald-500 text-white'
                          : saving
                            ? 'bg-gray-300 text-gray-500 cursor-wait'
                            : 'bg-forest text-white hover:opacity-90 shadow-lg'
                      }`}
                    >
                      {saving ? '⏳ Saving...' : saveSuccess ? '✅ Saved! Automation Reset' : '💾 SAVE & APPLY SETTINGS'}
                    </button>
                    <p className="text-xs text-center text-gray-400">
                      Saving resets the current batch — new settings apply immediately
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                  <p className="text-sm text-blue-900 font-bold mb-2">🤖 Human-Like Timing:</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>✓ No fixed 5-min intervals — fully random distribution</li>
                    <li>✓ Burst activity (rapid messages in succession)</li>
                    <li>✓ Silent gaps (natural pauses)</li>
                    <li>✓ Peak hour variation (9am-10pm faster)</li>
                    <li>✓ Set any time range & message count — no limits</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Banned Users */}
            {activeTab === 'banned' && (
              <div className="space-y-3">
                {bannedEmails.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No banned users</p>
                ) : (
                  bannedEmails.map(email => (
                    <div key={email} className="bg-white border border-red-200 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800">{email}</p>
                        <p className="text-xs text-gray-500">Banned from group chat</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Activity Logs */}
            {activeTab === 'logs' && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-700">Full Message History ({messages.length} loaded)</p>
                  <button
                    onClick={async () => {
                      if (!confirm('Delete ALL messages from group chat? This cannot be undone!')) return;
                      const batch = [...messages];
                      for (let i = 0; i < batch.length; i += 20) {
                        await Promise.all(batch.slice(i, i + 20).map(m => base44.entities.GroupMessage.delete(m.id).catch(() => {})));
                      }
                      loadData();
                    }}
                    className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100"
                  >
                    Clear All
                  </button>
                </div>
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {messages.map(msg => (
                    <div key={msg.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-bold text-gray-800 truncate">{msg.username}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            msg.status === 'approved' ? 'bg-green-100 text-green-700' :
                            msg.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{msg.status}</span>
                          {msg.message_type === 'system' && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">BOT</span>}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{msg.content}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{new Date(msg.created_date).toLocaleString('en-BD')}</p>
                      </div>
                      <button
                        onClick={async () => { await base44.entities.GroupMessage.delete(msg.id); loadData(); }}
                        className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}