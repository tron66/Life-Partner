import React, { useState, useEffect } from 'react';
import { 
  Folder as FolderIcon, 
  File as FileIcon, 
  Plus, 
  Loader2, 
  FolderPlus, 
  FilePlus,
  ChevronRight,
  AlertCircle,
  ArrowUpCircle
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

interface FileSectionProps {
  userId: string;
}

interface Folder {
  id: string;
  name: string;
}

interface File {
  id: string;
  name: string;
  folderId?: string;
  size: string;
}

export default function FileSection({ userId }: FileSectionProps) {
  const MAX_FILES = 5;
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileSize, setNewFileSize] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const foldersQuery = query(
      collection(db, `users/${userId}/folders`),
      orderBy('createdAt', 'desc')
    );
    const filesQuery = query(
      collection(db, `users/${userId}/files`),
      orderBy('createdAt', 'desc')
    );

    const unsubFolders = onSnapshot(foldersQuery, (snapshot) => {
      setFolders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder)));
      setLoading(false);
    });

    const unsubFiles = onSnapshot(filesQuery, (snapshot) => {
      setFiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as File)));
    });

    return () => {
      unsubFolders();
      unsubFiles();
    };
  }, [userId]);

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setModalLoading(true);
    try {
      await addDoc(collection(db, `users/${userId}/folders`), {
        name: newFolderName,
        createdAt: serverTimestamp()
      });
      setNewFolderName('');
      setIsFolderModalOpen(false);
    } catch (error) {
      console.error("Error adding folder:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim() || !newFileSize.trim()) return;
    setModalLoading(true);
    try {
      await addDoc(collection(db, `users/${userId}/files`), {
        name: newFileName,
        size: newFileSize,
        folderId: selectedFolderId || null,
        createdAt: serverTimestamp()
      });
      setNewFileName('');
      setNewFileSize('');
      setSelectedFolderId('');
      setIsFileModalOpen(false);
    } catch (error) {
      console.error("Error adding file:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const isLimitReached = files.length >= MAX_FILES;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-slate-900">My Files</h2>
          <p className="text-slate-500">Manage your documents and folders</p>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {isLimitReached && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>You've reached the free plan limit.</span>
              <button 
                onClick={() => setIsUpgradeModalOpen(true)}
                className="ml-2 flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
              >
                <ArrowUpCircle className="w-4 h-4" />
                Upgrade
              </button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsFolderModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              <FolderPlus className="w-5 h-5 text-indigo-600" />
              <span>New Folder</span>
            </button>
            <button 
              onClick={() => setIsFileModalOpen(true)}
              disabled={isLimitReached}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all shadow-lg ${
                isLimitReached 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
              }`}
            >
              <FilePlus className="w-5 h-5" />
              <span>Add File</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Folders Grid */}
          {folders.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group p-5 rounded-3xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FolderIcon className="text-indigo-600 w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 truncate">{folder.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {files.filter(f => f.folderId === folder.id).length} files
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Files List */}
          <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 shadow-xl shadow-slate-200/40">
            <div className="px-8 py-6 border-b border-slate-100 bg-white/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Recent Files</h3>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{files.length} Total</span>
            </div>
            <div className="divide-y divide-slate-50">
              {files.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileIcon className="text-slate-300 w-8 h-8" />
                  </div>
                  <p className="text-slate-500 font-medium">No files yet. Start by adding one!</p>
                </div>
              ) : (
                files.map((file) => (
                  <div key={file.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                        <FileIcon className="text-slate-400 w-5 h-5 group-hover:text-indigo-600 transition-colors" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{file.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400 font-medium">{file.size}</span>
                          {file.folderId && (
                            <>
                              <div className="w-1 h-1 rounded-full bg-slate-200" />
                              <span className="text-xs text-indigo-500 font-bold">
                                {folders.find(f => f.id === file.folderId)?.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      <Modal 
        isOpen={isFolderModalOpen} 
        onClose={() => setIsFolderModalOpen(false)} 
        title="Create New Folder"
      >
        <form onSubmit={handleAddFolder} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Folder Name</label>
            <input 
              required
              type="text" 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Marketing Assets"
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            />
          </div>
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => setIsFolderModalOpen(false)}
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
              Create Folder
            </button>
          </div>
        </form>
      </Modal>

      {/* Add File Modal */}
      <Modal 
        isOpen={isFileModalOpen} 
        onClose={() => setIsFileModalOpen(false)} 
        title="Add New File"
      >
        <form onSubmit={handleAddFile} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">File Name</label>
            <input 
              required
              type="text" 
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. Q1_Report.pdf"
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Size</label>
              <input 
                required
                type="text" 
                value={newFileSize}
                onChange={(e) => setNewFileSize(e.target.value)}
                placeholder="e.g. 2.4 MB"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Folder (Optional)</label>
              <select 
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              >
                <option value="">No Folder</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => setIsFileModalOpen(false)}
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
              Add File
            </button>
          </div>
        </form>
      </Modal>

      {/* Upgrade Modal */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Upgrade your plan"
      >
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100">
            <p className="text-slate-700 leading-relaxed">
              You've reached the limit of <span className="font-bold text-indigo-600">5 files</span> on the free plan. 
              Upgrade to <span className="font-bold">Pro</span> to unlock unlimited file uploads, advanced analytics, and priority support.
            </p>
          </div>
          <button 
            onClick={() => setIsUpgradeModalOpen(false)}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
