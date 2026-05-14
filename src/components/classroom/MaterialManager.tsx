import React, { useState, useEffect } from 'react';
import { FileText, Upload, Play, X, Loader2, CheckCircle2, FileUp } from 'lucide-react';
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
  const { t } = useLanguage();

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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-white font-black text-sm uppercase tracking-widest">{t('material.lessonMaterials')}</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t('material.uploadShare')}</p>
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
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{t('material.loading')}</p>
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
                    <p className="text-slate-500 text-[9px] font-bold truncate leading-none mt-1">{m.file_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActivate(m)}
                    className={cn(
                      "px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest transition-all active:scale-95",
                      m.is_active
                        ? "bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white"
                        : "bg-brand-purple text-white hover:bg-brand-purple-dark shadow-lg shadow-purple-500/20"
                    )}
                  >
                    {m.is_active ? t('material.stopSharing') : t('material.shareLive')}
                  </button>
                </div>
              </div>

              {m.is_active && (
                <div className="mt-4 pt-3 border-t border-brand-purple/20 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{t('material.activelySharing')}</span>
                </div>
              )}
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
            <span className="text-white font-black text-xs uppercase tracking-widest">
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
    </div>
  );
};
