import React, { useEffect, useRef, useState } from 'react';
import { WhiteWebSdk, Room, DeviceType, ViewMode, ApplianceNames } from 'white-web-sdk';
import { Loader2, Pencil, Eraser, Square, Circle, Minus, Type, MousePointer2, ChevronLeft, ChevronRight, Highlighter, MousePointerClick } from 'lucide-react';
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<string>('pencil');
  const [numPages, setNumPages] = useState<number>(0);

  // Sync Whiteboard Scene with PDF Page
  useEffect(() => {
    if (pdfUrl) {
      console.log("Whiteboard: PDF URL changed", pdfUrl);
      setError(null);
    }
    if (!room || !pdfUrl) return;

    const scenePath = `/pdf/${currentPage}`;
    console.log("Whiteboard: Setting scene path to", scenePath);
    
    // Check if scene exists, if not create it
    const scenes = room.entireScenes();
    if (!scenes['/pdf/']?.find(s => s.name === String(currentPage))) {
      room.putScenes('/pdf', [{ name: String(currentPage) }]);
    }
    
    room.setScenePath(scenePath);
  }, [room, pdfUrl, currentPage]);

  useEffect(() => {
    if (!containerRef.current || !roomUUID || !roomToken) return;

    let isCancelled = false;
    const sdk = new WhiteWebSdk({
      appIdentifier: appId,
      deviceType: DeviceType.Surface,
      region: 'us-sv',
    });

    let currentRoom: Room | null = null;

    const joinRoom = async () => {
      try {
        setLoading(true);
        const joinedRoom = await sdk.joinRoom({
          uuid: roomUUID,
          roomToken: roomToken,
          uid: uid,
          region: 'us-sv',
          cursorAdapter: undefined, // Let it use default or false
          disableNewPencil: true,
          userPayload: {
            cursorName: userName,
          },
        });
        
        if (isCancelled) {
          joinedRoom.disconnect();
          return;
        }

        currentRoom = joinedRoom;
        setRoom(currentRoom);
        currentRoom.bindHtmlElement(containerRef.current!);
        
        if (isTeacher) {
          currentRoom.setViewMode(ViewMode.Broadcaster);
        } else {
          currentRoom.setViewMode(ViewMode.Follower);
        }
        
        // Ensure transparency if needed (note: Netless might use setBackgroundColor)
        // Some versions use: currentRoom.setBackgroundColor(0, 0, 0, 0)
        
        currentRoom.setMemberState({
          currentApplianceName: ApplianceNames.pencil,
          strokeColor: [139, 92, 246],
          strokeWidth: 4,
          textSize: 24,
        });

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
      if (currentRoom) {
        currentRoom.bindHtmlElement(null);
        currentRoom.disconnect();
      }
    };
  }, [appId, roomUUID, roomToken, uid, userName]);

  const setTool = (tool: string) => {
    if (!room) return;
    setCurrentTool(tool);
    
    switch (tool) {
      case 'selector':
        room.setMemberState({ currentApplianceName: ApplianceNames.selector });
        break;
      case 'pencil':
        room.setMemberState({ currentApplianceName: ApplianceNames.pencil, strokeColor: [139, 92, 246], strokeWidth: 4 });
        break;
      case 'highlighter':
        // Netless highlighter is just a semi-transparent pencil
        room.setMemberState({ 
          currentApplianceName: ApplianceNames.pencil, 
          strokeColor: [251, 191, 36, 128], // Gold with transparency
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

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm z-50">
          <Loader2 className="animate-spin text-white mb-4" size={48} />
          <p className="text-white font-black text-sm tracking-widest uppercase">Connecting to Whiteboard</p>
        </div>
      )}

      {/* PDF Background Rendering */}
      {pdfUrl && (
        <div className="absolute inset-0 flex items-center justify-center p-8 bg-slate-200 overflow-hidden">
          <div className="shadow-2xl bg-white max-w-full max-h-full overflow-hidden">
            <Document
              file={pdfUrl}
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
                scale={1.5}
                className="max-w-full h-auto"
              />
            </Document>
          </div>

          {/* Page Controls for Teacher */}
          {isTeacher && numPages > 0 && (
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
        </div>
      )}

      {/* Toolbar - Only visible to Teacher */}
      {isTeacher && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 z-20">
          <ToolButton 
            icon={<MousePointer2 size={20} />} 
            active={currentTool === 'selector'} 
            onClick={() => setTool('selector')} 
            title="Select"
          />
          <ToolButton 
            icon={<Pencil size={20} />} 
            active={currentTool === 'pencil'} 
            onClick={() => setTool('pencil')} 
            title="Pencil"
          />
          <ToolButton 
            icon={<Highlighter size={20} />} 
            active={currentTool === 'highlighter'} 
            onClick={() => setTool('highlighter')} 
            title="Highlight"
          />
          <ToolButton 
            icon={<MousePointerClick size={20} />} 
            active={currentTool === 'laser'} 
            onClick={() => setTool('laser')} 
            title="Laser Pointer"
          />
          <ToolButton 
            icon={<Eraser size={20} />} 
            active={currentTool === 'eraser'} 
            onClick={() => setTool('eraser')} 
            title="Eraser"
          />
          <div className="h-px bg-white/10 my-1" />
          <ToolButton 
            icon={<Square size={20} />} 
            active={currentTool === 'rectangle'} 
            onClick={() => setTool('rectangle')} 
            title="Rectangle"
          />
          <ToolButton 
            icon={<Circle size={20} />} 
            active={currentTool === 'ellipse'} 
            onClick={() => setTool('ellipse')} 
            title="Ellipse"
          />
          <ToolButton 
            icon={<Type size={20} />} 
            active={currentTool === 'text'} 
            onClick={() => setTool('text')} 
            title="Text"
          />
        </div>
      )}

      {/* Board Container - Overlay */}
      <div 
        ref={containerRef} 
        className={cn(
          "w-full h-full touch-none relative z-10",
          pdfUrl ? "bg-transparent" : "bg-white"
        )}
        style={{ cursor: currentTool === 'pencil' ? 'crosshair' : 'default' }}
      />
    </div>
  );
};

interface ToolButtonProps {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, active, onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={cn(
      "p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95",
      active 
        ? "bg-brand-purple text-white shadow-lg shadow-purple-500/30" 
        : "text-slate-400 hover:text-white hover:bg-white/10"
    )}
  >
    {icon}
  </button>
);
