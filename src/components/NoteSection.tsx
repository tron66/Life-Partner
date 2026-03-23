import React, { useState, useEffect } from 'react';
import { 
  StickyNote, 
  Plus, 
  Loader2, 
  Calendar,
  ChevronRight,
  FileText
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

interface NoteSectionProps {
  userId: string;
}

interface Note {
  id: string;
  title: string;
  content?: string;
  createdAt: any;
}

export default function NoteSection({ userId }: NoteSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const notesQuery = query(
      collection(db, `users/${userId}/notes`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;
    setModalLoading(true);
    try {
      await addDoc(collection(db, `users/${userId}/notes`), {
        title: newNoteTitle,
        content: newNoteContent,
        createdAt: serverTimestamp()
      });
      setNewNoteTitle('');
      setNewNoteContent('');
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-slate-900">My Notes</h2>
          <p className="text-slate-500">Capture your ideas and thoughts</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5" />
          <span>New Note</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.length === 0 ? (
            <div className="col-span-full p-20 text-center glass rounded-[2.5rem] border-white/60 shadow-xl shadow-slate-200/40">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="text-slate-300 w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium">No notes yet. Start by writing one!</p>
            </div>
          ) : (
            notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group p-8 rounded-[2rem] bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-50 transition-all cursor-pointer flex flex-col h-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <StickyNote className="text-indigo-600 w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                  </div>
                </div>
                <h3 className="font-display font-bold text-xl text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors">{note.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">
                  {note.content || 'No content provided.'}
                </p>
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Read More</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* New Note Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create New Note"
      >
        <form onSubmit={handleAddNote} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Title</label>
            <input 
              required
              type="text" 
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="e.g. Project Ideas"
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Content (Optional)</label>
            <textarea 
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Write your thoughts here..."
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all min-h-[160px]"
            />
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
              Create Note
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
