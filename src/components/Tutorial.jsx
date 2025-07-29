import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  Brain, 
  Archive, 
  CheckSquare, 
  Target, 
  BarChart3, 
  Settings, 
  X, 
  ArrowRight, 
  ArrowLeft,
  Play,
  SkipForward,
  HelpCircle
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useTutorial } from '@/hooks/useTutorial';

const Tutorial = ({ onComplete, forceShow = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { hasSeenTutorial, shouldShowTutorial, markTutorialComplete } = useTutorial();

  useEffect(() => {
    // Show tutorial if forced, or if it's the first visit and hasn't been seen
    if (forceShow || shouldShowTutorial()) {
      // Show tutorial after a short delay to let the app load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [forceShow, shouldShowTutorial]);

  const tutorialSteps = [
    {
      id: 'welcome',
      title: 'Welcome to OMI! 🧠',
      description: 'Your AI-powered thought recorder and organizer. Let\'s take a quick tour of the key features.',
      icon: Brain,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <p className="text-lg font-semibold text-gray-800">OMI - Thought Recorder</p>
            <p className="text-sm text-gray-600">Capture, organize, and act on your thoughts with AI</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Mic className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="font-medium text-blue-800">Voice Recording</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Brain className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <p className="font-medium text-purple-800">AI Organization</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'voice-recording',
      title: 'Voice Recording',
      description: 'Record your thoughts naturally with voice-to-text technology.',
      icon: Mic,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <p className="font-medium text-gray-800">Quick Voice Capture</p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <p>Tap the microphone button to start recording</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <p>Speak naturally - AI will transcribe your thoughts</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <p>Tap again to stop and process your recording</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ai-processing',
      title: 'AI Processing',
      description: 'Watch as AI analyzes and categorizes your thoughts automatically.',
      icon: Brain,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <p className="font-medium text-gray-800">Smart AI Analysis</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium">Thought Categories</span>
              <div className="flex gap-1">
                <Badge variant="outline" className="text-xs">Reflection</Badge>
                <Badge variant="outline" className="text-xs">Idea</Badge>
                <Badge variant="outline" className="text-xs">Task</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium">Action Items</span>
              <CheckSquare className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium">Memory Storage</span>
              <Archive className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-600 text-center">
            AI automatically identifies key insights and suggests actions
          </p>
        </div>
      )
    },
    {
      id: 'triage',
      title: 'Thought Triage',
      description: 'Swipe to organize your thoughts into actions or memories.',
      icon: CheckSquare,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <p className="font-medium text-gray-800">Quick Organization</p>
          </div>
          <div className="relative">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-700 mb-2">"I should call mom this weekend"</p>
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="text-xs">Task</Badge>
                <span className="text-xs text-gray-500">Just now</span>
              </div>
            </div>
            <div className="absolute -left-16 top-1/2 -translate-y-1/2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
              ← Archive
            </div>
            <div className="absolute -right-16 top-1/2 -translate-y-1/2 bg-green-500 text-white px-2 py-1 rounded text-xs">
              Action →
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-gray-800">Swipe Gestures</p>
            <div className="flex justify-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />
                <span>Archive</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Action</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'goals',
      title: 'Goal Tracking',
      description: 'Set and track your goals with AI-powered insights.',
      icon: Target,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-white" />
            </div>
            <p className="font-medium text-gray-800">Goal Management</p>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-800">Learn React</span>
                <span className="text-xs text-orange-600">75%</span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-800">Exercise Daily</span>
                <span className="text-xs text-orange-600">3/7 days</span>
              </div>
              <div className="flex gap-1">
                {[1, 1, 1, 0, 0, 0, 0].map((day, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full ${day ? 'bg-orange-500' : 'bg-orange-200'}`}></div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 text-center">
            Track progress and get AI insights on your goals
          </p>
        </div>
      )
    },
    {
      id: 'insights',
      title: 'AI Insights',
      description: 'Discover patterns and insights about your thoughts and habits.',
      icon: BarChart3,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <p className="font-medium text-gray-800">Smart Analytics</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <p className="text-lg font-bold text-indigo-600">12</p>
              <p className="text-xs text-indigo-700">Thoughts Today</p>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <p className="text-lg font-bold text-indigo-600">5</p>
              <p className="text-xs text-indigo-700">Action Items</p>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <p className="text-lg font-bold text-indigo-600">80%</p>
              <p className="text-xs text-indigo-700">Productivity</p>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <p className="text-lg font-bold text-indigo-600">3</p>
              <p className="text-xs text-indigo-700">Goals Active</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 text-center">
            Get personalized insights and recommendations
          </p>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'You\'re All Set! 🎉',
      description: 'Start recording your thoughts and let AI help you stay organized.',
      icon: Play,
      content: (
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-3">
            <p className="font-semibold text-gray-800">Ready to Get Started?</p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Tap the microphone to record your first thought</p>
              <p>• Explore different sections in the navigation</p>
              <p>• Check Settings to customize your experience</p>
            </div>
          </div>
          <div className="pt-4">
            <p className="text-xs text-gray-500">
              You can always access help from the Settings page
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeTutorial();
  };

  const completeTutorial = () => {
    markTutorialComplete();
    setIsVisible(false);
    toast({
      title: "Welcome to OMI!",
      description: "Start recording your thoughts and let AI help you stay organized.",
    });
    if (onComplete) onComplete();
  };

  const currentStepData = tutorialSteps[currentStep];
  const IconComponent = currentStepData.icon;

  // Don't render if not visible and not forced to show
  if (!isVisible && !forceShow) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md"
          >
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                      <p className="text-sm text-gray-600">{currentStepData.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {currentStepData.content}
                
                {/* Progress indicator */}
                <div className="flex justify-center space-x-1">
                  {tutorialSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentStep ? 'bg-indigo-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation buttons */}
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleSkip}
                      className="flex items-center gap-2"
                    >
                      <SkipForward className="w-4 h-4" />
                      Skip
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="flex items-center gap-2"
                    >
                      {currentStep === tutorialSteps.length - 1 ? (
                        <>
                          <Play className="w-4 h-4" />
                          Get Started
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Tutorial; 