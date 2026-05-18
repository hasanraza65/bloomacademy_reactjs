import React, { useState, useEffect } from 'react';
import { FileText, Upload, Play, X, Loader2, CheckCircle2, FileUp, Trash2 } from 'lucide-react';
import { apiService } from '@/src/services/apiService';
import { cn } from '@/src/lib/utils';
import { BASE_URL } from '@/src/lib/config';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';

interface Material {
  id: number;
  title: string;
  file_name: string;
  file_path: string;
  file_url: string;
  is_active: boolean;
}

interface MaterialManagerProps {
  classroomId: number;
  onActivate: (material: Material) => void;
  onDeactivate: (materialId: number) => void;
  onClose: () => void;
}

export const MaterialManager: React.FC<MaterialManagerProps> = ({
  classroomId,
  onActivate,
  onDeactivate,
  onClose,
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { t, language } = useLanguage();

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const res = await apiService.getClassroomMaterials(classroomId);
      if (res.success) {
        setMaterials(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch materials:", err);
      setError(t('material.failedLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [classroomId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError(t('class.onlyImagesPDF'));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace('.pdf', ''));

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const xhr = new XMLHttpRequest();
    const token = localStorage.getItem('auth_token');
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    });

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText);
        if (res.success) {
          fetchMaterials();
        } else {
          setError(res.message || t('material.uploadFailed'));
        }
      } else {
        setError(t('material.uploadFailed') + " Status: " + xhr.status);
      }
      setIsUploading(false);
      setUploadProgress(0);
    };

    xhr.onerror = () => {
      setError(t('material.errorDuringUpload'));
      setIsUploading(false);
      setUploadProgress(0);
    };

    xhr.open('POST', `${BASE_URL}classrooms/${classroomId}/materials/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.send(formData);

    if (e.target) e.target.value = '';
  };

  const handleToggleActivate = async (material: Material) => {
    try {
      if (material.is_active) {
        await apiService.deactivateClassroomMaterial(classroomId, material.id);
        onDeactivate(material.id);
      } else {
        await apiService.activateClassroomMaterial(classroomId, material.id);
  onActivate(material);
  // Close the material manager modal so teacher immediately sees the PDF on the whiteboard
  onClose();
      }
      fetchMaterials();
    } catch (err) {
      console.error("Failed to toggle material:", err);
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    try {
      setIsDeleting(true);
      setError(null);
      const res = await apiService.deleteMaterial(id);
      if (res.success) {
        const wasActive = materials.find((m) => m.id === id)?.is_active;
        if (wasActive) {
          onDeactivate(id);
        }
        fetchMaterials();
        setConfirmDeleteId(null);
      } else {
        setError(res.message || "Failed to delete material.");
      }
    } catch (err) {
      console.error("Failed to delete material:", err);
      setError("An error occurred while deleting the material.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-white font-black text-md capitalize tracking-widest">{t('material.books')}</h3>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40">
            <Loader2 className="animate-spin text-brand-purple mb-3" size={32} />
            <p className="text-slate-500 text-sm font-black tracking-widest">{t('material.loading')}</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12 px-6 border-2 border-dashed border-white/5 rounded-3xl">
            <p className="text-slate-600 text-xs font-bold uppercase tracking-widest leading-relaxed">
              {t('material.noMaterials')}
            </p>
          </div>
        ) : (
          materials.map((m) => (
            <motion.div
              layout
              key={m.id}
              className={cn(
                "group relative p-4 rounded-2xl border transition-all",
                m.is_active 
                  ? "bg-brand-purple/10 border-brand-purple/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]" 
                  : "bg-slate-900 border-white/5 hover:border-white/10 hover:bg-slate-800/80"
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    m.is_active ? "bg-brand-purple text-white shadow-lg shadow-purple-500/20" : "bg-slate-800 text-slate-400 group-hover:text-white"
                  )}>
                    <FileText size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-white font-black text-xs uppercase tracking-widest truncate">{m.title}</h4>
                    {/* <p className="text-slate-500 text-[9px] font-bold truncate leading-none mt-1">{m.file_name}</p> */}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActivate(m)}
                    className={cn(
                      "px-4 py-2 min-w-max cursor-pointer rounded-full font-bold text-sm tracking-widest transition-all active:scale-95",
                      m.is_active
                        ? "bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white"
                        : "bg-brand-purple text-white hover:bg-brand-purple-dark shadow-lg shadow-purple-500/20"
                    )}
                  >
                    <span>{m.is_active ? t('material.closeBook') : t('material.openBook')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(m.id)}
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-95"
                    title={language === 'en' ? 'Delete Book' : 'Supprimer le livre'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="p-6 border-t border-white/5 bg-slate-900/50 shrink-0">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500">
            <X size={14} className="shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-widest">{error}</p>
          </div>
        )}
        
        <div className={cn(
          "relative flex flex-col gap-2 w-full p-4 bg-brand-indigo rounded-2xl cursor-pointer overflow-hidden transition-all hover:scale-[1.02] active:scale-98 shadow-xl shadow-indigo-500/20",
          isUploading && "opacity-90 cursor-not-allowed"
        )}>
          {!isUploading && (
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
          
          <div className="flex items-center justify-center gap-3 w-full">
            {isUploading ? (
              <Loader2 className="animate-spin text-white" size={20} />
            ) : (
              <FileUp className="text-white" size={20} />
            )}
            <span className="text-white font-black text-sm capitalize tracking-widest">
              {isUploading ? `${t('material.uploading')} ${uploadProgress}%` : t('material.uploadNew')}
            </span>
          </div>

          {isUploading && (
            <div className="mt-2 w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 p-6 rounded-3xl w-full max-w-sm shadow-2xl space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                  <Trash2 size={24} />
                </div>
                <h4 className="text-white font-black text-md capitalize tracking-widest">
                  {language === 'en' ? 'Delete Book?' : 'Supprimer le livre ?'}
                </h4>
                <p className="text-slate-400 text-xs font-bold leading-relaxed">
                  {language === 'en' 
                    ? 'Are you sure you want to delete this book? This action cannot be undone.'
                    : 'Êtes-vous sûr de vouloir supprimer ce livre ? Cette action est irréversible.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'Annuler'}
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeleteId && handleDeleteMaterial(confirmDeleteId)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isDeleting ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    language === 'en' ? 'Delete' : 'Supprimer'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
