import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Loader2, 
  UserPlus,
  Mail,
  Shield,
  MoreHorizontal
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import Modal from './Modal';

interface TeamSectionProps {
  userId: string;
}

interface TeamMember {
  id: string;
  name: string;
  role?: string;
  createdAt: any;
}

export default function TeamSection({ userId }: TeamSectionProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const membersQuery = query(
      collection(db, `users/${userId}/teamMembers`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    setModalLoading(true);
    try {
      await addDoc(collection(db, `users/${userId}/teamMembers`), {
        name: newMemberName,
        role: newMemberRole || 'Member',
        createdAt: serverTimestamp()
      });
      setNewMemberName('');
      setNewMemberRole('');
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding member:", error);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-slate-900">Team Members</h2>
          <p className="text-slate-500">Collaborate with your team</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add Member</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 shadow-xl shadow-slate-200/40">
          <div className="px-8 py-6 border-b border-slate-100 bg-white/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Active Members</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{members.length} Total</span>
          </div>
          <div className="divide-y divide-slate-50">
            {members.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="text-slate-300 w-8 h-8" />
                </div>
                <p className="text-slate-500 font-medium">No team members yet. Start by adding one!</p>
              </div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="px-8 py-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center font-display font-bold text-indigo-600 text-xl group-hover:scale-110 transition-transform">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{member.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                          <Shield className="w-3 h-3" />
                          <span>{member.role}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-xs text-slate-400 font-medium">
                          Joined {member.createdAt?.toDate ? member.createdAt.toDate().toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                    <MoreHorizontal className="w-6 h-6" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add Team Member"
      >
        <form onSubmit={handleAddMember} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
            <input 
              required
              type="text" 
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="e.g. Jane Smith"
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Role</label>
            <select 
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            >
              <option value="Member">Member</option>
              <option value="Admin">Admin</option>
              <option value="Editor">Editor</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={modalLoading}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
            >
              {modalLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              Add Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
