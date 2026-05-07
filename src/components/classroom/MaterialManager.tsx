import React, { useState, useEffect } from 'react';
import { FileText, Upload, Play, X, Loader2, CheckCircle2, FileUp } from 'lucide-react';
import { apiService } from '@/src/services/apiService';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

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
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const res = await apiService.getClassroomMaterials(classroomId);
      if (res.success) {
        setMaterials(res.data);
      }
    } catch (err) {
      // 

      setError("Failed to load lesson materials.");
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
      setError("Only PDF files are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace('.pdf', ''));

    try {
      setIsUploading(true);
      setError(null);
      const res = await apiService.uploadClassroomMaterial(classroomId, formData);
      if (res.success) {
        fetchMaterials();
      } else {
        setError("Upload failed. Please try again.");
      }
    } catch (err) {
      // 

      setError("An error occurred during upload.");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
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
      // 

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
            <h3 className="text-white font-black text-sm uppercase tracking-widest">Lesson Materials</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Upload & Share PDFs</p>
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
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Loading Materials...</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12 px-6 border-2 border-dashed border-white/5 rounded-3xl">
            <p className="text-slate-600 text-xs font-bold uppercase tracking-widest leading-relaxed">
              No materials uploaded yet. Upload a PDF to start sharing with your students.
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
                    {m.is_active ? 'Stop Sharing' : 'Share Live'}
                  </button>
                </div>
              </div>

              {m.is_active && (
                <div className="mt-4 pt-3 border-t border-brand-purple/20 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Actively Sharing</span>
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
        
        <label className={cn(
          "relative flex items-center justify-center gap-3 w-full h-14 bg-brand-indigo rounded-2xl cursor-pointer overflow-hidden transition-all hover:scale-[1.02] active:scale-98 shadow-xl shadow-indigo-500/20",
          isUploading && "opacity-50 cursor-not-allowed"
        )}>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
          {isUploading ? (
            <Loader2 className="animate-spin text-white" size={20} />
          ) : (
            <FileUp className="text-white" size={20} />
          )}
          <span className="text-white font-black text-xs uppercase tracking-widest">
            {isUploading ? 'Uploading...' : 'Upload New Material'}
          </span>
        </label>
      </div>
    </div>
  );
};
