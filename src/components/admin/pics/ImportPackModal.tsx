import React, { useState, useRef, useEffect } from 'react';
import { Pic } from '@/types/pic';
import { picService } from '@/services/picService';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/clientApp';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface ImportPackModalProps {
  onClose: () => void;
  onComplete: () => void;
}

interface PreviewItem {
  dataUrl: string;
  metadata: Partial<Pic> | null;
}

export default function ImportPackModal({ onClose, onComplete }: ImportPackModalProps) {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [manifestText, setManifestText] = useState('');
  
  const [gridCols, setGridCols] = useState(6);
  const [gridRows, setGridRows] = useState(4);
  const [cropBottomPercent, setCropBottomPercent] = useState(28); // Text area crop
  
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Parse Manifest
  const parseManifest = (): Partial<Pic>[] => {
    try {
      if (!manifestText.trim()) return [];
      const data = JSON.parse(manifestText);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Manifest Parse Error:", e);
      toast.error(t('pics.admin.import_invalid_json'));
      return [];
    }
  };

  // Generate Previews
  const handlePreview = async () => {
    if (!file) {
      toast.error(t('pics.admin.upload_image_only'));
      return;
    }

    setIsProcessing(true);
    const parsedData = parseManifest();

    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = objectUrl;
      });

      const cellWidth = img.width / gridCols;
      const cellHeight = img.height / gridRows;
      const imageAreaHeight = cellHeight * (1 - cropBottomPercent / 100);

      const canvas = document.createElement('canvas');
      canvas.width = cellWidth;
      canvas.height = imageAreaHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error("Canvas context not available");

      const newPreviews: PreviewItem[] = [];
      let index = 0;

      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Draw only the image part of the cell (skip bottom text area)
          ctx.drawImage(
            img,
            col * cellWidth, row * cellHeight, cellWidth, imageAreaHeight, // Source
            0, 0, cellWidth, imageAreaHeight // Destination
          );
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          newPreviews.push({
            dataUrl,
            metadata: parsedData[index] || null
          });
          index++;
        }
      }

      setPreviews(newPreviews);
      URL.revokeObjectURL(objectUrl);

    } catch (error) {
      console.error("Preview Generation Error:", error);
      toast.error(t('pics.admin.upload_fail'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (previews.length === 0) return;
    
    // Validate if at least some metadata is present
    const hasMetadata = previews.some(p => p.metadata);
    if (!hasMetadata && !confirm(t('pics.admin.import_no_metadata_confirm'))) {
      return;
    }

    setIsUploading(true);
    let successCount = 0;

    for (let i = 0; i < previews.length; i++) {
      const item = previews[i];
      try {
        const metadata = item.metadata || { title: `Imported Pic ${i+1}` };
        const fileName = `Pics/batch_${Date.now()}_${i}.jpg`;
        const storageRef = ref(storage, fileName);
        
        // Upload base64 string
        await uploadString(storageRef, item.dataUrl, 'data_url');
        const downloadURL = await getDownloadURL(storageRef);

        // Save to Firestore
        const picData: any = {
          title: metadata.title || `Imported Pic ${i+1}`,
          slug: metadata.slug || `imported-pic-${Date.now()}-${i}`,
          imageUrl: downloadURL,
          mood: metadata.mood || 'All',
          activity: metadata.activity || 'All',
          season: metadata.season || 'All',
          tags: metadata.tags || [],
          orientation: 'landscape', // Most contact sheets are landscape
          brightness: metadata.brightness || 50,
          contrastSafe: metadata.contrastSafe ?? true,
          featured: metadata.featured || false,
          premium: metadata.premium || false,
          sortOrder: i,
          typographySafeZone: metadata.typographySafeZone || { top: 10, left: 10, width: 80, height: 80 }
        };

        await picService.createPic(picData);
        successCount++;
        setUploadProgress(Math.round(((i + 1) / previews.length) * 100));

      } catch (error) {
        console.error(`Error uploading item ${i}:`, error);
        // Continue with next even if one fails
      }
    }

    setIsUploading(false);
    const finishedMsg = t('pics.admin.import_finished')
      .replace('{successCount}', successCount.toString())
      .replace('{totalCount}', previews.length.toString());
    toast.success(finishedMsg);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-6xl max-h-[90vh] rounded-3xl flex flex-col shadow-2xl border border-surface-container overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-container shrink-0">
          <div>
            <h2 className="text-xl font-bold font-headline flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">view_cozy</span>
              {t('pics.admin.import_modal_title')}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">{t('pics.admin.import_pack_desc')}</p>
          </div>
          <button onClick={onClose} disabled={isUploading} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-50">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
          
          {/* Config Panel */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-surface-container pb-2">{t('pics.admin.contact_sheet')}</h3>
              <input 
                type="file" 
                accept="image/*"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-surface-container pb-2">{t('pics.admin.grid_config')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-outline">{t('pics.admin.columns')}</label>
                  <input type="number" min="1" value={gridCols} onChange={e => setGridCols(Number(e.target.value))} className="w-full p-2 mt-1 bg-surface-container-low border border-outline-variant/30 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-outline">{t('pics.admin.rows')}</label>
                  <input type="number" min="1" value={gridRows} onChange={e => setGridRows(Number(e.target.value))} className="w-full p-2 mt-1 bg-surface-container-low border border-outline-variant/30 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-outline">{t('pics.admin.crop_bottom')}</label>
                  <span className="text-xs font-mono">{cropBottomPercent}%</span>
                </div>
                <input type="range" min="0" max="50" value={cropBottomPercent} onChange={e => setCropBottomPercent(Number(e.target.value))} className="w-full accent-primary" />
                <p className="text-[10px] text-on-surface-variant mt-1 leading-tight">{t('pics.admin.crop_bottom_desc')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-surface-container pb-2">{t('pics.admin.json_manifest')}</h3>
              <textarea 
                value={manifestText}
                onChange={e => setManifestText(e.target.value)}
                placeholder="[ { &quot;title&quot;: &quot;pic-001&quot;, &quot;mood&quot;: &quot;Chill&quot; } ]"
                className="w-full h-48 p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-mono outline-none focus:border-primary whitespace-pre resize-none"
              />
            </div>

            <button 
              onClick={handlePreview}
              disabled={isProcessing || !file}
              className="w-full py-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              {t('pics.admin.generate_preview')}
            </button>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 bg-surface-container-low rounded-2xl border border-surface-container overflow-hidden flex flex-col">
            <div className="p-4 border-b border-surface-container bg-surface flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {t('pics.admin.preview_title').replace('{count}', previews.length.toString())}
              </h3>
              {previews.length > 0 && (
                <button 
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="px-6 py-2 bg-primary text-white font-bold rounded-full text-sm shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined !text-[18px]">cloud_upload</span>
                  {isUploading ? `${t('pics.admin.saving')} ${uploadProgress}%` : t('pics.admin.upload_save_all')}
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {previews.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-outline-variant">
                  <span className="material-symbols-outlined !text-[48px] mb-2 opacity-50">grid_view</span>
                  <p className="text-sm">{t('pics.admin.preview_hint')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {previews.map((item, idx) => (
                    <div key={idx} className="bg-surface rounded-xl overflow-hidden border border-outline-variant/20 shadow-sm relative group">
                      <div className="aspect-video relative bg-black/5">
                        <img src={item.dataUrl} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold backdrop-blur-md">
                          #{idx + 1}
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-bold text-xs truncate mb-1">
                          {item.metadata?.title || item.metadata?.slug || `Untitled-${idx+1}`}
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {item.metadata?.mood && (
                            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold">{item.metadata.mood}</span>
                          )}
                          {item.metadata?.activity && (
                            <span className="text-[9px] bg-tertiary/10 text-tertiary px-1.5 py-0.5 rounded uppercase font-bold">{item.metadata.activity}</span>
                          )}
                          {!item.metadata && (
                            <span className="text-[9px] bg-error/10 text-error px-1.5 py-0.5 rounded uppercase font-bold">{t('pics.admin.no_metadata')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
