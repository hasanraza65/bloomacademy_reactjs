import React, { useEffect, useRef, useState } from 'react';
import { WhiteWebSdk, Room, DeviceType, ViewMode, ApplianceNames } from 'white-web-sdk';
import { Loader2, Pencil, Eraser, Square, Circle, Minus, Type, MousePointer2, ChevronLeft, ChevronRight, Highlighter, MousePointerClick, BookOpen, X, MonitorPlay } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker for react-pdf using a reliable CDN that matches the version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface WhiteboardProps {
  appId: string;
  roomUUID: string;
  roomToken: string;
  uid: string;
  userName: string;
  isTeacher?: boolean;
  pdfUrl?: string | null;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onModeChange?: (mode: 'whiteboard' | 'pdf' | 'none') => void;
  currentMode?: 'whiteboard' | 'pdf' | 'none';
  onOpenMaterials?: () => void;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  appId,
  roomUUID,
  roomToken,
  uid,
  userName,
  isTeacher = false,
  pdfUrl,
  currentPage = 1,
  onPageChange,
  onModeChange,
  currentMode = 'whiteboard',
  onOpenMaterials,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const roomRef = useRef<Room | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<string>('pencil');
  const [numPages, setNumPages] = useState<number>(0);
  const [bindingKey, setBindingKey] = useState(0);

  // Sync Whiteboard Scene with PDF Page
  useEffect(() => {
    if (pdfUrl) setError(null);

    // CRITICAL: Only teacher manages scenes
    // Student is reader-only and must never touch scene paths
    if (!room || !pdfUrl || !isTeacher) return;

    const scenePath = `/pdf/${currentPage}`;

    const scenes = room.entireScenes();
    const pdfScenes = scenes['/pdf/'] || [];

    if (!pdfScenes.find(s => s.name === String(currentPage))) {
      room.putScenes('/pdf', [{ name: String(currentPage) }]);
    }

    room.setScenePath(scenePath);
  }, [room, pdfUrl, currentPage, isTeacher]);

  // Track container size for PDF fitting
  useEffect(() => {
    if (!pdfContainerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    
    observer.observe(pdfContainerRef.current);
    return () => observer.disconnect();
  }, [pdfUrl]);

  // Reset page size when PDF or page changes
  useEffect(() => {
    setPageSize(null);
  }, [pdfUrl, currentPage]);

  useEffect(() => {
    setBindingKey(prev => prev + 1);
  }, [pdfUrl]);

  useEffect(() => {
    if (!roomUUID || !roomToken) return;
    console.log("Whiteboard: Joining room", roomUUID);

    let isCancelled = false;
    const sdk = new WhiteWebSdk({
      appIdentifier: appId,
      deviceType: DeviceType.Surface,
      region: 'us-sv',
    });

    const joinRoom = async () => {
      try {
        setLoading(true);
        const joinedRoom = await sdk.joinRoom({
          uuid: roomUUID,
          roomToken: roomToken,
          uid: uid,
          region: 'us-sv',
          cursorAdapter: undefined,
          disableNewPencil: true,
          isWritable: isTeacher,
          disableDeviceInputs: !isTeacher,
          userPayload: {
            cursorName: userName,
          },
        } as any);

        if (isCancelled) {
          joinedRoom.disconnect();
          return;
        }

        roomRef.current = joinedRoom;
        setRoom(joinedRoom);

        if (isTeacher) {
          // Teacher has full control
          joinedRoom.setViewMode(ViewMode.Broadcaster);
          (joinedRoom as any).disableOperations = false;
          joinedRoom.setMemberState({
            currentApplianceName: ApplianceNames.pencil,
            strokeColor: [139, 92, 246],
            strokeWidth: 4,
            textSize: 24,
          });
        } else {
          // Student is pure viewer — no input, no scene control
          joinedRoom.setViewMode(ViewMode.Follower);
          (joinedRoom as any).disableOperations = true;
        }

        setLoading(false);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Failed to join whiteboard room:', err);
          setError(err.message || 'Failed to join whiteboard');
          setLoading(false);
        }
      }
    };

    joinRoom();

    return () => {
      isCancelled = true;
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [appId, roomUUID, roomToken, uid, userName]);

  // Handle Container Binding
  useEffect(() => {
    if (!room || !containerRef.current) return;

    console.log("Whiteboard: Re-binding, bindingKey:", bindingKey, "PDF?", !!pdfUrl);

    // Step 1: Unbind from current (potentially gone) element
    room.bindHtmlElement(null);

    const timer = setTimeout(async () => {
      if (!containerRef.current || !room) return;

      // Step 2: Re-bind to the element in its new DOM position
      try {
        console.log("Whiteboard: Binding to element...");
        room.bindHtmlElement(containerRef.current);
        
        // Essential call to fix coordinate mapping after DOM shift
        (room as any).refreshViewSize?.();
        
        if (isTeacher) {
          // Step 3: Explicitly re-enable writable state
          await room.setWritable(true);
          
          room.disableDeviceInputs = false;
          (room as any).disableOperations = false;
          room.setViewMode(ViewMode.Broadcaster);

          // Step 4: Re-apply tools to force input handler registration
          room.setMemberState({
            currentApplianceName: ApplianceNames.pencil,
            strokeColor: [139, 92, 246],
            strokeWidth: 4,
            textSize: 24,
          });

          // Step 5: Final safety refresh
          setTimeout(() => {
            if (room && containerRef.current) {
              (room as any).refreshViewSize?.();
              room.disableDeviceInputs = false;
              (room as any).disableOperations = false;
              room.setMemberState({ strokeWidth: 4 });
              console.log("Whiteboard: Final binding refresh complete");
            }
          }, 300);
        } else {
          room.disableDeviceInputs = true;
          (room as any).disableOperations = true;
          room.setViewMode(ViewMode.Follower);
        }
      } catch (e) {
        console.error("Whiteboard binding error:", e);
      }
    }, 500); // Increased delay significantly to avoid race conditions with React DOM updates

    return () => {
      clearTimeout(timer);
      room.bindHtmlElement(null);
    };
  }, [room, bindingKey, isTeacher]);

  const setTool = (tool: string) => {
    if (!room) return;
    setCurrentTool(tool);

    if (isTeacher) {
      // Re-activate writing mode every time a tool is selected to avoid state getting stuck
      room.setWritable(true).catch(e => console.warn("Failed to set writable:", e));
      room.disableDeviceInputs = false;
      (room as any).disableOperations = false;
      (room as any).refreshViewSize?.();
    }

    switch (tool) {
      case 'selector':
        room.setMemberState({ currentApplianceName: ApplianceNames.selector });
        break;
      case 'pencil':
        room.setMemberState({ currentApplianceName: ApplianceNames.pencil, strokeColor: [139, 92, 246], strokeWidth: 4 });
        break;
      case 'highlighter':
        room.setMemberState({
          currentApplianceName: ApplianceNames.pencil,
          strokeColor: [251, 191, 36, 128],
          strokeWidth: 20
        });
        break;
      case 'laser':
        room.setMemberState({ currentApplianceName: ApplianceNames.laserPointer });
        break;
      case 'eraser':
        room.setMemberState({ currentApplianceName: ApplianceNames.eraser });
        break;
      case 'rectangle':
        room.setMemberState({ currentApplianceName: ApplianceNames.rectangle });
        break;
      case 'ellipse':
        room.setMemberState({ currentApplianceName: ApplianceNames.ellipse });
        break;
      case 'text':
        room.setMemberState({ currentApplianceName: ApplianceNames.text });
        break;
      default:
        room.setMemberState({ currentApplianceName: ApplianceNames.pencil });
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const pdfOptions = React.useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    disableRange: true,
    disableStream: true
  }), []);

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm z-50">
          <Loader2 className="animate-spin text-white mb-4" size={48} />
          <p className="text-white font-black text-sm tracking-widest uppercase">Connecting to Whiteboard</p>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-xl z-50 font-bold shadow-xl border border-red-400 backdrop-blur-md max-w-lg text-center">
          {error}
        </div>
      )}

      {/* PDF Background Rendering */}
      {pdfUrl && (
        <div
          ref={pdfContainerRef}
          className="absolute inset-0 bg-slate-200 overflow-hidden z-0 flex items-center justify-center"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {containerSize.width > 0 && containerSize.height > 0 && (
              <Document
                file={pdfUrl}
                options={pdfOptions}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(err) => {
                  console.error("PDF Load Error:", err);
                  const isCors = err.message.includes("Failed to fetch") || err.name === "SecurityError";
                  setError(`Failed to load PDF: ${err.message}${isCors ? " (Possible CORS issue on the server. Please ensure the backend allows requests from this domain.)" : ""}`);
                }}
                loading={<Loader2 className="animate-spin text-brand-purple" />}
              >
                <Page
                  pageNumber={currentPage}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  width={(() => {
                    if (!pageSize || !containerSize.width || !containerSize.height) return containerSize.width - 48;
                    const scaleByWidth = (containerSize.width - 48) / pageSize.width;
                    const scaleByHeight = (containerSize.height - 48) / pageSize.height;
                    const scale = Math.min(scaleByWidth, scaleByHeight);
                    return pageSize.width * scale;
                  })()}
                  onLoadSuccess={(page) => {
                    setPageSize({ width: page.originalWidth, height: page.originalHeight });
                  }}
                  className="shadow-2xl"
                />
              </Document>
            )}
            {/* Whiteboard Overlay for PDF - Stable position overlaying the centered PDF content */}
            <div
              ref={containerRef}
              className="absolute inset-0 z-10 bg-transparent touch-none netless-container"
              style={{
                pointerEvents: isTeacher ? 'all' : 'none',
                cursor: isTeacher ? (currentTool === 'pencil' ? 'crosshair' : 'default') : 'default',
              }}
            />
          </div>
        </div>
      )}

      {/* Page Controls for Teacher (Fixed Position) */}
      {pdfUrl && isTeacher && numPages > 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 z-30 shadow-2xl">
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange?.(currentPage - 1)}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-white font-black text-[10px] uppercase tracking-widest min-w-[100px] text-center">
            Page {currentPage} / {numPages}
          </span>
          <button
            disabled={currentPage >= numPages}
            onClick={() => onPageChange?.(currentPage + 1)}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Toolbar - Only visible to Teacher */}
      {isTeacher && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 z-20">

          {/* Mode Switcher - always rendered */}
          <button
            onClick={() => onModeChange?.('whiteboard')}
            title="Whiteboard"
            className={cn(
              "p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95",
              currentMode === 'whiteboard'
                ? "bg-brand-purple text-white shadow-lg shadow-purple-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            )}
          >
            <MonitorPlay size={20} />
          </button>

          <button
            onClick={() => onOpenMaterials?.()}
            title="PDF Resources"
            className={cn(
              "p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95",
              currentMode === 'pdf'
                ? "bg-brand-purple text-white shadow-lg shadow-purple-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            )}
          >
            <BookOpen size={20} />
          </button>

          <div className="h-px bg-white/10 my-1" />

          {/* Drawing Tools - always rendered, hidden via CSS only */}
          <div
            style={{
              display: (currentMode === 'whiteboard' || currentMode === 'pdf') ? 'flex' : 'none',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <button
              onClick={() => setTool('selector')}
              title="Select"
              className={cn(
                "p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95",
                currentTool === 'selector'
                  ? "bg-brand-purple text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              <MousePointer2 size={20} />
            </button>

            <button
              onClick={() => setTool('pencil')}
              title="Pencil"
              className={cn(
                "p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95",
                currentTool === 'pencil'
                  ? "bg-brand-purple text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Pencil size={20} />
            </button>

            <button
              onClick={() => setTool('highlighter')}
              title="Highlight"
              className={cn(
                "p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95",
                currentTool === 'highlighter'
                  ? "bg-brand-purple text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Highlighter size={20} />
            </button>

            <button
              onClick={() => setTool('laser')}
              title="Laser Pointer"
              className={cn(
                "p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95",
                currentTool === 'laser'
                  ? "bg-brand-purple text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              <MousePointerClick size={20} />
            </button>

            <button
              onClick={() => setTool('eraser')}
              title="Eraser"
              className={cn(
                "p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95",
                currentTool === 'eraser'
                  ? "bg-brand-purple text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Eraser size={20} />
            </button>

            <div className="h-px bg-white/10 my-1" />

            <button
              onClick={() => setTool('rectangle')}
              title="Rectangle"
              className={cn(
                "p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95",
                currentTool === 'rectangle'
                  ? "bg-brand-purple text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Square size={20} />
            </button>

            <button
              onClick={() => setTool('ellipse')}
              title="Ellipse"
              className={cn(
                "p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95",
                currentTool === 'ellipse'
                  ? "bg-brand-purple text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Circle size={20} />
            </button>

            <button
              onClick={() => setTool('text')}
              title="Text"
              className={cn(
                "p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95",
                currentTool === 'text'
                  ? "bg-brand-purple text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Type size={20} />
            </button>
          </div>

          {/* Close Button - always rendered */}
          <div className="h-px bg-white/10 my-1" />
          <button
            onClick={() => onModeChange?.('none')}
            title="Hide Board"
            className="p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X size={20} />
          </button>

        </div>
      )}

      {/* Board Container - Overlay (Only if NO PDF) */}
      {!pdfUrl && (
        <div
          ref={containerRef}
          className="netless-container w-full h-full touch-none relative z-10 bg-white"
          style={{
            pointerEvents: isTeacher ? 'all' : 'none',
            cursor: isTeacher ? (currentTool === 'pencil' ? 'crosshair' : 'default') : 'default',
          }}
        />
      )}
    </div>
  );
};

