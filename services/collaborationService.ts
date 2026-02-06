// Collaboration Features Service
// Multi-dispatcher support, mission templates, keyboard shortcuts, chat

export interface DispatchChannel {
  id: string;
  name: string;
  type: "GENERAL" | "DISPATCH" | "MAINTENANCE" | "EMERGENCY";
  members: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  priority?: "NORMAL" | "URGENT" | "EMERGENCY";
  attachments?: Array<{
    type: "IMAGE" | "DOCUMENT" | "LOCATION";
    url: string;
    name: string;
  }>;
}

export interface MissionTemplate {
  id: string;
  name: string;
  description: string;
  category: "STANDARD" | "VIP" | "EMERGENCY" | "MAINTENANCE";
  defaultPriority: "STANDARD" | "URGENT" | "VIP";
  estimatedDurationMin: number;
  vehicleType?: string;
  requiredCertifications?: string[];
  notes?: string;
  steps: Array<{
    order: number;
    instruction: string;
    required: boolean;
  }>;
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: string;
  shortcut?: string;
  category: string;
}

export interface SessionRecording {
  id: string;
  startTime: string;
  endTime?: string;
  participants: string[];
  actions: Array<{
    timestamp: string;
    userId: string;
    action: string;
    details: any;
  }>;
  status: "RECORDING" | "PAUSED" | "COMPLETED";
}

// Collaboration state management
class CollaborationService {
  private channels: Map<string, DispatchChannel> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();
  private templates: Map<string, MissionTemplate> = new Map();
  private shortcuts: Map<string, QuickAction> = new Map();
  private recordings: Map<string, SessionRecording> = new Map();
  private currentUser: string | null = null;

  constructor() {
    this.initializeDefaults();
  }

  private initializeDefaults() {
    // Default channels
    this.channels.set("general", {
      id: "general",
      name: "General Operations",
      type: "GENERAL",
      members: [],
      unreadCount: 0,
    });
    this.channels.set("dispatch", {
      id: "dispatch",
      name: "Active Dispatch",
      type: "DISPATCH",
      members: [],
      unreadCount: 0,
    });
    this.channels.set("maintenance", {
      id: "maintenance",
      name: "Maintenance Queue",
      type: "MAINTENANCE",
      members: [],
      unreadCount: 0,
    });
    this.channels.set("emergency", {
      id: "emergency",
      name: "Emergency Channel",
      type: "EMERGENCY",
      members: [],
      unreadCount: 0,
    });

    // Default shortcuts
    this.shortcuts.set("new-trip", {
      id: "new-trip",
      label: "New Mission",
      icon: "Plus",
      action: "CREATE_TRIP",
      shortcut: "n",
      category: "Mission",
    });
    this.shortcuts.set("search", {
      id: "search",
      label: "Search",
      icon: "Search",
      action: "OPEN_SEARCH",
      shortcut: "/",
      category: "Navigation",
    });
    this.shortcuts.set("focus-map", {
      id: "focus-map",
      label: "Focus Map",
      icon: "Map",
      action: "FOCUS_MAP",
      shortcut: "m",
      category: "Navigation",
    });
    this.shortcuts.set("dispatch-wizard", {
      id: "dispatch-wizard",
      label: "Dispatch Wizard",
      icon: "Wizard",
      action: "OPEN_DISPATCH_WIZARD",
      shortcut: "d",
      category: "Dispatch",
    });
    this.shortcuts.set("toggle-sidebar", {
      id: "toggle-sidebar",
      label: "Toggle Sidebar",
      icon: "Menu",
      action: "TOGGLE_SIDEBAR",
      shortcut: "b",
      category: "Navigation",
    });
    this.shortcuts.set("quick-incident", {
      id: "quick-incident",
      label: "Report Incident",
      icon: "AlertTriangle",
      action: "REPORT_INCIDENT",
      shortcut: "i",
      category: "Safety",
    });
    this.shortcuts.set("personnel-view", {
      id: "personnel-view",
      label: "Personnel",
      icon: "Users",
      action: "VIEW_PERSONNEL",
      shortcut: "p",
      category: "Navigation",
    });
    this.shortcuts.set("help", {
      id: "help",
      label: "Help",
      icon: "HelpCircle",
      action: "SHOW_HELP",
      shortcut: "?",
      category: "System",
    });

    // Default templates
    this.templates.set("vip-transport", {
      id: "vip-transport",
      name: "VIP Transport",
      description: "Standard VIP dignitary transport protocol",
      category: "VIP",
      defaultPriority: "VIP",
      estimatedDurationMin: 60,
      vehicleType: "SUV",
      requiredCertifications: ["VIP Protection", "EVOC Level 3"],
      notes: "Armored vehicle required. Coordinate with security detail.",
      steps: [
        {
          order: 1,
          instruction: "Confirm security clearance with detail lead",
          required: true,
        },
        {
          order: 2,
          instruction: "Verify vehicle inspection completed",
          required: true,
        },
        {
          order: 3,
          instruction: "Confirm pickup location and time",
          required: true,
        },
        {
          order: 4,
          instruction: "Dispatch with security escort",
          required: true,
        },
        { order: 5, instruction: "Monitor en route status", required: true },
        {
          order: 6,
          instruction: "Confirm dropoff and secure area",
          required: true,
        },
      ],
      createdBy: "system",
      createdAt: new Date().toISOString(),
      usageCount: 0,
    });

    this.templates.set("emergency-response", {
      id: "emergency-response",
      name: "Emergency Response",
      description: "Rapid deployment for emergency situations",
      category: "EMERGENCY",
      defaultPriority: "URGENT",
      estimatedDurationMin: 30,
      requiredCertifications: ["First Responder"],
      notes: "All available units respond. Coordinate with command.",
      steps: [
        {
          order: 1,
          instruction: "Acknowledge emergency dispatch",
          required: true,
        },
        { order: 2, instruction: "Confirm ETA with command", required: true },
        {
          order: 3,
          instruction: "Proceed with lights and sirens",
          required: false,
        },
        { order: 4, instruction: "Report arrival", required: true },
      ],
      createdBy: "system",
      createdAt: new Date().toISOString(),
      usageCount: 0,
    });
  }

  // Channel management
  getChannels(): DispatchChannel[] {
    return Array.from(this.channels.values());
  }

  getChannel(id: string): DispatchChannel | undefined {
    return this.channels.get(id);
  }

  // Message management
  getMessages(channelId: string): ChatMessage[] {
    return this.messages.get(channelId) || [];
  }

  sendMessage(
    channelId: string,
    content: string,
    priority?: "NORMAL" | "URGENT" | "EMERGENCY",
  ): ChatMessage {
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      channelId,
      senderId: this.currentUser || "unknown",
      senderName: "Current User",
      content,
      timestamp: new Date().toISOString(),
      priority,
    };

    const channelMessages = this.messages.get(channelId) || [];
    channelMessages.push(message);
    this.messages.set(channelId, channelMessages);

    const channel = this.channels.get(channelId);
    if (channel) {
      channel.lastMessage = message;
    }

    return message;
  }

  // Template management
  getTemplates(): MissionTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(id: string): MissionTemplate | undefined {
    const template = this.templates.get(id);
    if (template) {
      template.usageCount++;
    }
    return template;
  }

  createTemplate(
    template: Omit<MissionTemplate, "id" | "createdAt" | "usageCount">,
  ): MissionTemplate {
    const newTemplate: MissionTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date().toISOString(),
      usageCount: 0,
    };
    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  // Shortcut management
  getShortcuts(): QuickAction[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcut(action: string): QuickAction | undefined {
    return this.shortcuts.get(action);
  }

  executeShortcut(shortcut: string): QuickAction | undefined {
    return this.shortcuts.get(shortcut);
  }

  // Session recording
  startRecording(): SessionRecording {
    const recording: SessionRecording = {
      id: `rec-${Date.now()}`,
      startTime: new Date().toISOString(),
      participants: [this.currentUser || "unknown"],
      actions: [],
      status: "RECORDING",
    };
    this.recordings.set(recording.id, recording);
    return recording;
  }

  recordAction(recordingId: string, action: string, details: any): void {
    const recording = this.recordings.get(recordingId);
    if (recording && recording.status === "RECORDING") {
      recording.actions.push({
        timestamp: new Date().toISOString(),
        userId: this.currentUser || "unknown",
        action,
        details,
      });
    }
  }

  stopRecording(recordingId: string): SessionRecording | undefined {
    const recording = this.recordings.get(recordingId);
    if (recording) {
      recording.endTime = new Date().toISOString();
      recording.status = "COMPLETED";
    }
    return recording;
  }

  // Multi-dispatcher coordination
  lockResource(resourceId: string, userId: string): boolean {
    // In production, this would use a proper locking mechanism
    console.log(`[Collab] Resource ${resourceId} locked by ${userId}`);
    return true;
  }

  unlockResource(resourceId: string, userId: string): boolean {
    console.log(`[Collab] Resource ${resourceId} unlocked by ${userId}`);
    return true;
  }

  // Presence management
  updatePresence(userId: string, status: "ONLINE" | "AWAY" | "BUSY"): void {
    console.log(`[Collab] User ${userId} is now ${status}`);
  }
}

export const collaborationService = new CollaborationService();

// Keyboard shortcut hook for React
export const useKeyboardShortcuts = (
  shortcuts: Record<string, () => void>,
  enabled: boolean = true,
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const action = shortcuts[key] || shortcuts[e.key];

      if (action) {
        e.preventDefault();
        action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
};

// Undo/Redo manager
export class ActionHistory<T = any> {
  private history: T[] = [];
  private future: T[] = [];
  private maxHistory = 50;

  push(action: T): void {
    this.history.push(action);
    this.future = []; // Clear redo stack on new action
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  undo(): T | undefined {
    const action = this.history.pop();
    if (action) {
      this.future.push(action);
    }
    return action;
  }

  redo(): T | undefined {
    const action = this.future.pop();
    if (action) {
      this.history.push(action);
    }
    return action;
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  clear(): void {
    this.history = [];
    this.future = [];
  }
}

import { useEffect } from "react";

export default collaborationService;
