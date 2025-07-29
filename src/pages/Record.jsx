
import React, { useState, useRef, useEffect } from "react";
import { Thought } from "@/api/entities";
import { Goal } from "@/api/entities"; // Added Goal import
import { InvokeLLM } from "@/api/integrations";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Mic, MicOff, Loader2, Type, Send, Brain, Archive, CheckSquare, ArrowLeft, ArrowRight, X, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "../components/PageTransition";
import LoadingSpinner from "../components/LoadingSpinner";
import { AudioRecorder } from "@/utils/audioRecorder";

// Enhanced Badge Component
const Badge = ({ children, className }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
    {children}
  </span>
);

// Enhanced Triage Card with premium animations
const TriageCard = ({ thought, onSwipe, index }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const getCategoryColor = (category) => {
    const colors = {
      reflection: "bg-blue-100 text-blue-700 border-blue-200", 
      idea: "bg-yellow-100 text-yellow-700 border-yellow-200",
      concern: "bg-red-100 text-red-700 border-red-200", 
      goal: "bg-green-100 text-green-700 border-green-200",
      memory: "bg-gray-100 text-gray-700 border-gray-200", // Changed to gray for more neutral "memory"
      task: "bg-orange-100 text-orange-700 border-orange-200",
      emotion: "bg-pink-100 text-pink-700 border-pink-200", 
      observation: "bg-gray-100 text-gray-700 border-gray-200"
    };
    return colors[category] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 0.8,
        x: isDragging ? (Math.abs(isDragging) > 100 ? (isDragging > 0 ? 400 : -400) : 0) : 0,
        transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
      }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1]
      }}
      drag="x"
      dragConstraints={{ left: -50, right: 50 }}
      dragElastic={0.3}
      onDragStart={() => setIsDragging(0)}
      onDrag={(event, info) => setIsDragging(info.offset.x)}
      onDragEnd={(event, info) => {
        setIsDragging(false);
        if (Math.abs(info.offset.x) > 120) {
          onSwipe(info.offset.x > 0 ? "right" : "left", thought.id);
        }
      }}
      whileDrag={{ 
        scale: 1.05,
        rotate: isDragging * 0.1,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)"
      }}
      className="relative touch-pan-y"
    >
      {/* Swipe Indicators */}
      <AnimatePresence>
        {isDragging !== false && Math.abs(isDragging) > 30 && (
          <>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: isDragging < -30 ? Math.min(Math.abs(isDragging) / 100, 1) : 0,
                x: isDragging < -30 ? -10 : -20
              }}
              className="absolute -left-16 top-1/2 -translate-y-1/2 z-10 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg"
            >
              <Archive className="w-4 h-4 inline mr-1" />
              Thoughts
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ 
                opacity: isDragging > 30 ? Math.min(Math.abs(isDragging) / 100, 1) : 0,
                x: isDragging > 30 ? 10 : 20
              }}
              className="absolute -right-16 top-1/2 -translate-y-1/2 z-10 bg-purple-500 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg"
            >
              <CheckSquare className="w-4 h-4 inline mr-1" />
              Actions
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-500">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-gray-800 leading-relaxed flex-1 font-medium text-base break-words">
              {thought.processed_text}
            </p>
            <Badge className={`${getCategoryColor(thought.category)} border text-xs font-semibold px-2 py-1 flex-shrink-0`}>
              {thought.category}
            </Badge>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-blue-500">
                <ArrowLeft className="w-4 h-4" />
                <Archive className="w-4 h-4" />
                <span className="text-sm font-medium">Thoughts</span>
              </div>
              <div className="w-px h-6 bg-gray-200" />
              <div className="flex items-center gap-2 text-blue-500">
                <span className="text-sm font-medium">Actions</span>
                <CheckSquare className="w-4 h-4" />
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Enhanced Notification Component
const NotificationManager = ({ notifications, removeNotification }) => (
  <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-2 w-full max-w-sm px-4">
    <AnimatePresence mode="popLayout">
      {notifications.map(note => (
        <motion.div
          key={note.id}
          layout
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.8, transition: { duration: 0.2 } }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className={`p-4 rounded-xl shadow-md text-sm font-medium border ${
            note.type === "error" 
              ? "bg-red-50 text-red-800 border-red-200" 
              : "bg-green-50 text-green-800 border-green-200"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex-1">{note.message}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeNotification(note.id)}
              className="p-1 h-auto hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

export default function Record() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [thoughtsForTriage, setThoughtsForTriage] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [inputMethod, setInputMethod] = useState("voice");
  const [notifications, setNotifications] = useState([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [activeGoals, setActiveGoals] = useState([]); // Added activeGoals state

  const timerRef = useRef(null);
  const audioRecorderRef = useRef(new AudioRecorder());
  const triageRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Fetch active goals on component mount
  useEffect(() => {
    const fetchActiveGoals = async () => {
      const goals = await Goal.filter({ status: 'active' });
      setActiveGoals(goals);
    };
    fetchActiveGoals();
  }, []);

  // Enhanced keyboard detection for mobile
  useEffect(() => {
    const handleResize = () => {
      const isKeyboard = window.innerHeight < window.screen.height * 0.7;
      setIsKeyboardVisible(isKeyboard);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleResize();
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Auto-scroll to triage when cards appear with enhanced smooth scrolling
  useEffect(() => {
    if (thoughtsForTriage.length > 0 && triageRef.current) {
      setTimeout(() => {
        triageRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }, 300);
    }
  }, [thoughtsForTriage.length]);
  
  const addNotification = (message, type = "success") => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const abortRecording = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cancelRecording();
    }
    clearInterval(timerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
    setTextInput("");
    addNotification("Recording cancelled", "error");
  };

  const startVoiceRecording = async () => {
    try {
      setTextInput("");
      
      // Start recording with the AudioRecorder
      await audioRecorderRef.current.startRecording();
      
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start the timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsRecording(false);
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError') {
        addNotification("Microphone access denied. Please enable it in your browser settings.", "error");
        setInputMethod("text");
      } else if (error.name === 'NotFoundError') {
        addNotification("No microphone found. Please connect a microphone and try again.", "error");
        setInputMethod("text");
      } else {
        addNotification("Error starting voice recording. Try text input.", "error");
      }
    }
  };

  const stopVoiceRecording = async () => {
    if (!audioRecorderRef.current.isRecording()) {
      return;
    }
    
    clearInterval(timerRef.current);
    setIsRecording(false);
    setIsProcessing(true);
    
    try {
      // Stop recording and get transcription
      const transcription = await audioRecorderRef.current.stopRecording();
      
      if (transcription && transcription.trim()) {
        setTextInput(transcription);
        await processText(transcription);
      } else {
        addNotification("No speech detected. Please try again.", "error");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      addNotification("Error processing recording. Please try again.", "error");
      setIsProcessing(false);
    }
  };

  const handleMicrophoneClick = () => {
    if (isProcessing) return;

    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  const processText = async (text) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);

    const activeGoalsPrompt = activeGoals.length > 0 
      ? `The user has the following active goals, use them for context: ${activeGoals.map(g => g.title).join(', ')}.`
      : '';
    
    try {
      const aiResponse = await InvokeLLM({
        prompt: `
        You are an expert AI assistant that analyzes human thoughts. ${activeGoalsPrompt}

        ENHANCED ROUTING RULES:
        1. AUTOMATIC TO "ACTIONS" (no user triage needed):
           - Tasks: Clear actionable items, especially "how-to" questions, problems to solve
           - Goals: Achievement-oriented thoughts 
           - Urgent Concerns: Problems requiring immediate action
           - Questions needing answers: "How do I...", "I need to...", "I don't know how..."

        2. AUTOMATIC TO "THOUGHTS ARCHIVE" (no user triage needed):
           - Emotional Venting: Pure emotional expression
           - Simple Observations: Neutral observations about life/world
           - Personal Notes: Simple notes to self
           - Memories: Past experiences being recorded
           - Pure Reflections: Self-awareness without action needed

        3. REQUIRES USER TRIAGE (ambiguous cases):
           - Complex Ideas: Creative concepts that could go either direction
           - Mixed Reflections: Thoughts with both emotional and actionable elements

        FOR ACTIONABLE ITEMS: When something is clearly a task, goal, or concern - especially "how-to" questions or problems to solve - provide detailed, step-by-step action_steps that serve as a complete guide.

        For each thought, determine:
        - transcription: original text
        - processed_text: cleaned version
        - category: a primary category (e.g., reflection, idea, concern, goal, memory, task)
        - sub_category: a more specific sub-category (e.g., business idea, health concern)
        - mood_score: -1 to 1
        - priority: low, medium, high
        - tags: 2-4 relevant keywords
        - action_steps: For actionable items, provide step-by-step guidance including suggested_tools and estimated_time for each step.
        - requires_triage: true/false (false = auto-route, true = needs user decision)
        - auto_destination: "todo", "thoughts", or null (only set when requires_triage is false)

        Text to analyze: "${text}"
        `,
        response_json_schema: {
          type: "object",
          properties: {
            thoughts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  transcription: { type: "string" },
                  processed_text: { type: "string" },
                  category: { 
                    type: "string", 
                    enum: ["reflection", "idea", "concern", "goal", "memory", "task", "emotion", "observation"] 
                  },
                  sub_category: { type: "string" }, // Added sub_category
                  mood_score: { type: "number" },
                  priority: { type: "string", enum: ["low", "medium", "high"] },
                  tags: { type: "array", items: { type: "string" } },
                  action_steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        step: { type: "string" },
                        recommendation: { type: "string" },
                        suggested_tools: { "type": "array", "items": { "type": "string" } }, // Added suggested_tools
                        estimated_time: { "type": "string" } // Added estimated_time
                      }
                    }
                  },
                  requires_triage: { type: "boolean" },
                  auto_destination: { type: "string", enum: ["todo", "thoughts"] }
                }
              }
            }
          }
        }
      });

      if (aiResponse.thoughts && aiResponse.thoughts.length > 0) {
        let autoToDoCount = 0;
        let autoThoughtsCount = 0;
        let triageCount = 0;

        for (const thoughtData of aiResponse.thoughts) {
          if (!thoughtData.requires_triage) {
            if (thoughtData.auto_destination === "todo") {
              await Thought.create({
                ...thoughtData,
                status: "actioned",
                task_status: "not_started"
              });
              autoToDoCount++;
            } else if (thoughtData.auto_destination === "thoughts") {
              await Thought.create({
                ...thoughtData,
                status: "memory_banked"
              });
              autoThoughtsCount++;
            }
          } else {
            const newThought = await Thought.create({
              ...thoughtData,
              status: "pending"
            });
            setThoughtsForTriage(prev => [...prev, newThought]);
            triageCount++;
          }
        }

        if (autoToDoCount > 0) {
          addNotification(`📋 ${autoToDoCount} task${autoToDoCount > 1 ? 's' : ''} added to Actions with step-by-step guidance`);
        }
        if (autoThoughtsCount > 0) {
          addNotification(`💭 ${autoThoughtsCount} thought${autoThoughtsCount > 1 ? 's' : ''} archived`);
        }
        if (triageCount > 0) {
          addNotification(`🤔 ${triageCount} thought${triageCount === 1 ? ' needs' : 's need'} your decision`);
        }
      }
      
      setTextInput("");
      
    } catch (error) {
      console.error("Error processing text:", error);
      addNotification("Error processing your thought. Please try again.", "error");
    } finally {
      setIsProcessing(false);
      setRecordingTime(0);
    }
  };

  const handleTriageSwipe = async (direction, thoughtId) => {
    const newStatus = direction === "left" ? "memory_banked" : "actioned";
    const updateData = direction === "left" 
      ? { status: newStatus }
      : { status: newStatus, task_status: "not_started" };
      
    await Thought.update(thoughtId, updateData);
    setThoughtsForTriage(prev => prev.filter(t => t.id !== thoughtId));
    
    const destination = direction === "left" ? "Thoughts" : "Actions";
    addNotification(`✓ Moved to ${destination}`);
  };

  const handleTextSubmit = async () => {
    if (textInput.trim()) {
      await processText(textInput);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <PageTransition>
      <div className={`min-h-screen transition-all duration-300 ${isKeyboardVisible ? 'pb-4' : 'pb-24'}`}>
        <div className="p-4 space-y-6 relative">
          <NotificationManager 
            notifications={notifications} 
            removeNotification={removeNotification} 
          />

          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="bg-white rounded-2xl p-2 border border-gray-200 shadow-sm">
              <div className="flex">
                <motion.button
                  onClick={() => setInputMethod("voice")}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.1 }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
                    inputMethod === "voice"
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  Voice
                </motion.button>
                <motion.button
                  onClick={() => setInputMethod("text")}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.1 }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
                    inputMethod === "text"
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Type className="w-4 h-4" />
                  Text
                </motion.button>
              </div>
            </div>
          </motion.div>

          {inputMethod === "voice" && (
            <motion.div
              layout
              className="flex flex-col items-center justify-center space-y-6"
              style={{ minHeight: 'calc(100vh - 300px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {/* Centered Microphone Button */}
              <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                <motion.div
                  className="relative"
                  animate={{ scale: isRecording ? 1.02 : 1 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  {isRecording && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full bg-red-400/20 pointer-events-none"
                        animate={{ 
                          scale: [1, 1.6, 1], 
                          opacity: [0.6, 0.1, 0] 
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          ease: "easeOut"
                        }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full bg-red-500/20 pointer-events-none"
                        animate={{ 
                          scale: [1, 1.4, 1], 
                          opacity: [0.4, 0.1, 0] 
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity, 
                          delay: 0.3,
                          ease: "easeOut"
                        }}
                      />
                    </>
                  )}
                  
                  <motion.button
                    className={`w-44 h-44 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-full shadow-lg transition-all duration-300 relative z-10 flex items-center justify-center ${
                      isRecording 
                        ? "bg-red-500 hover:bg-red-600" 
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                    onClick={handleMicrophoneClick}
                    disabled={isProcessing}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <AnimatePresence mode="wait">
                      {isProcessing ? (
                        <motion.div
                          key="processing"
                          initial={{ opacity: 0, rotate: -90 }}
                          animate={{ opacity: 1, rotate: 0 }}
                          exit={{ opacity: 0, rotate: 90 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Loader2 className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 text-white animate-spin" />
                        </motion.div>
                      ) : isRecording ? (
                        <motion.div
                          key="recording"
                          initial={{ scale: 1, rotate: 0 }}
                          animate={{ 
                            scale: [1, 0.8, 1],
                            rotate: [0, 45, 0]
                          }}
                          exit={{ 
                            scale: [1, 0.8, 1],
                            rotate: [0, -45, 0]
                          }}
                          transition={{ 
                            duration: 0.6,
                            ease: [0.4, 0, 0.2, 1],
                            times: [0, 0.5, 1]
                          }}
                        >
                          <motion.div
                            animate={{
                              scale: [1, 1.1, 1],
                              rotate: [0, 360]
                            }}
                            transition={{
                              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                              rotate: { duration: 8, repeat: Infinity, ease: "linear" }
                            }}
                          >
                            <Square 
                              className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 text-white" 
                              style={{
                                filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))'
                              }}
                            />
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="ready"
                          initial={{ scale: 1, rotate: 0 }}
                          animate={{ 
                            scale: [1, 0.95, 1],
                            rotate: [0, -5, 5, 0]
                          }}
                          exit={{ 
                            scale: [1, 0.8, 1],
                            rotate: [0, 45, 0]
                          }}
                          transition={{ 
                            duration: 0.6,
                            ease: [0.4, 0, 0.2, 1],
                            times: [0, 0.5, 1]
                          }}
                          whileHover={{
                            scale: 1.05,
                            rotate: [0, -2, 2, 0],
                            transition: { duration: 0.3, repeat: Infinity, repeatType: "reverse" }
                          }}
                        >
                          <motion.div
                            animate={{
                              scale: [1, 1.02, 1]
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            <Mic 
                              className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 text-white" 
                              style={{
                                filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.2))'
                              }}
                            />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>

                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <Button
                      onClick={abortRecording}
                      variant="outline"
                      className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel Recording
                    </Button>
                  </motion.div>
                )}

                <motion.div 
                  className="text-center space-y-3"
                  layout
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                >
                  <AnimatePresence mode="wait">
                    {isRecording ? (
                      <motion.div
                        key="recording-status"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                      >
                        <p className="text-xl font-semibold text-red-500 flex items-center justify-center gap-2">
                          <motion.span
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-3 h-3 bg-red-500 rounded-full"
                          />
                          Recording...
                        </p>
                        <motion.p 
                          className="text-3xl font-mono text-gray-900 font-bold"
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          {formatTime(recordingTime)}
                        </motion.p>
                        <p className="text-sm text-gray-500">Tap to stop and process</p>
                      </motion.div>
                    ) : isProcessing ? (
                      <motion.div
                        key="processing-status"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                      >
                        <p className="text-xl font-semibold text-blue-500 flex items-center justify-center gap-2">
                          <Brain className="w-5 h-5 animate-pulse" />
                          AI Processing...
                        </p>
                        <p className="text-sm text-gray-500">Analyzing and creating step-by-step guidance</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="ready-status"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                      >
                        <p className="text-xl font-semibold text-gray-900">Ready to capture your thoughts</p>
                        <p className="text-sm text-gray-500">AI will provide step-by-step guidance for tasks</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Transcribed Text Preview */}
              {textInput && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  className="w-full max-w-md mx-auto"
                >
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-700 italic leading-relaxed break-words">"{textInput}"</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}

          {inputMethod === "text" && (
            <motion.div
              layout
              className={`max-w-md mx-auto space-y-4 ${isKeyboardVisible ? 'mt-4' : ''}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-6 space-y-5">
                  <motion.div 
                    className="text-center space-y-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Brain className="w-8 h-8 mx-auto text-blue-500" />
                    <h2 className="text-lg font-semibold text-gray-900">What's on your mind?</h2>
                    <p className="text-xs text-gray-500">Ask "how-to" questions for step-by-step guidance</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Textarea
                      ref={textareaRef}
                      placeholder="Share your thoughts, questions, tasks, or problems... AI will provide detailed guidance for actionable items."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onFocus={() => {
                        if (isKeyboardVisible && textareaRef.current) {
                          setTimeout(() => {
                            textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 300);
                        }
                      }}
                      className="min-h-32 bg-gray-50 border-gray-200 resize-none text-gray-900 transition-all duration-300 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 input-mobile touch-manipulation"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button 
                      onClick={handleTextSubmit} 
                      disabled={!textInput.trim() || isProcessing} 
                      className="w-full bg-blue-500 hover:bg-blue-600 shadow-sm disabled:opacity-50"
                      size="lg"
                    >
                      <AnimatePresence mode="wait">
                        {isProcessing ? (
                          <motion.div
                            key="processing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                          >
                            <Loader2 className="w-4 h-4 animate-spin" />
                            AI Creating Guidance...
                          </motion.div>
                        ) : (
                          <motion.div
                            key="ready"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Process Thoughts
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {thoughtsForTriage.length > 0 && (
            <motion.div 
              ref={triageRef}
              className="space-y-4 max-w-md mx-auto"
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div 
                className="text-center space-y-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Brain className="w-6 h-6 text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Quick Decision Needed</h2>
                </div>
                <p className="text-sm text-gray-600">AI couldn't auto-sort these thoughts. Where should they go?</p>
                <div className="bg-white rounded-2xl p-3 border border-gray-200 text-xs shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-500 font-medium">
                      <ArrowLeft className="w-3 h-3" />
                      <Archive className="w-3 h-3" />
                      <span>Thoughts</span>
                    </div>
                    <span className="text-gray-500 font-medium">Swipe to Sort</span>
                    <div className="flex items-center gap-2 text-blue-500 font-medium">
                      <span>Actions</span>
                      <CheckSquare className="w-3 h-3" />
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {thoughtsForTriage.map((thought, index) => (
                    <TriageCard 
                      key={thought.id} 
                      thought={thought} 
                      onSwipe={handleTriageSwipe}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
