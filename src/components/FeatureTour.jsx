import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft, Lightbulb } from 'lucide-react';

const FeatureTour = ({ steps = [], onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (steps.length > 0) {
      setIsVisible(true);
    }
  }, [steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeTour();
  };

  const completeTour = () => {
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const currentStepData = steps[currentStep];

  if (!isVisible || !currentStepData) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none"
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          
          {/* Highlighted element */}
          {currentStepData.target && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute z-10"
              style={{
                top: currentStepData.target.offsetTop - 8,
                left: currentStepData.target.offsetLeft - 8,
                width: currentStepData.target.offsetWidth + 16,
                height: currentStepData.target.offsetHeight + 16,
              }}
            >
              <div className="w-full h-full border-2 border-blue-500 rounded-lg shadow-lg bg-blue-500/10" />
            </motion.div>
          )}

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute z-20 pointer-events-auto"
            style={{
              top: currentStepData.position?.top || '50%',
              left: currentStepData.position?.left || '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Card className="w-80 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{currentStepData.title}</h3>
                      <p className="text-sm text-gray-600">{currentStepData.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Progress indicator */}
                <div className="flex justify-center space-x-1 mb-4">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation buttons */}
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Previous
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="flex items-center gap-1"
                  >
                    {currentStep === steps.length - 1 ? (
                      <>
                        Got it!
                        <ArrowRight className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeatureTour; 