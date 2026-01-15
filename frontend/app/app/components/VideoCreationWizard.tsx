"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

interface VideoCreationWizardProps {
  open: boolean;
  onClose: () => void;
  campaignId?: string;
}

enum WorkflowStep {
  INITIAL_PROMPT = "INITIAL_PROMPT",
  PROMPT_REFINEMENT = "PROMPT_REFINEMENT",
  ADDITIONAL_INFO = "ADDITIONAL_INFO",
  FRAME_GENERATION = "FRAME_GENERATION",
  FRAME_REVIEW = "FRAME_REVIEW",
  VIDEO_GENERATION = "VIDEO_GENERATION",
  COMPLETED = "COMPLETED",
}

enum WorkflowStatus {
  IN_PROGRESS = "IN_PROGRESS",
  WAITING_USER_INPUT = "WAITING_USER_INPUT",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

interface RefinementIteration {
  iteration: number;
  userPrompt: string;
  refinedPrompt: string;
  refinementModel: string;
  additionalInfo?: string;
  timestamp: Date;
}

interface GeneratedFrame {
  frameNumber: number;
  prompt: string;
  imageUrl: string;
  model: string;
  approved: boolean;
  feedback?: string;
  timestamp: Date;
}

interface VideoOutput {
  videoUrl: string;
  model: string;
  duration: number;
  fps: number;
  finalPrompt: string;
  timestamp: Date;
}

interface VideoWorkflow {
  _id: string;
  currentStep: WorkflowStep;
  status: WorkflowStatus;
  initialPrompt: string;
  initialMetadata?: {
    targetAudience?: string;
  };
  refinementIterations: RefinementIteration[];
  finalRefinedPrompt?: string;
  generatedFrames: GeneratedFrame[];
  framesApproved: boolean;
  videoOutput?: VideoOutput;
  modelSelections: {
    refinementModel?: string;
    frameModel?: string;
    videoModel?: string;
  };
  errors: string[];
}

const REFINEMENT_MODELS = [
  { value: "gpt-4o", label: "GPT-4o (Fast, Creative)" },
  { value: "claude-3-opus-20240229", label: "Claude 3 Opus (Deep Reasoning)" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Balanced)" },
];

const FRAME_MODELS = [
  { value: "stable-diffusion-xl", label: "Stable Diffusion XL (High Quality)" },
  { value: "dalle-3", label: "DALL-E 3 (Creative)" },
];

const VIDEO_MODELS = [
  { value: "veo-3", label: "Veo 3 (High Quality, Slow)" },
  { value: "Video-Generator-PRO", label: "Video Generator PRO (Fast)" },
];

const STEP_LABELS = {
  [WorkflowStep.INITIAL_PROMPT]: "Initial Prompt",
  [WorkflowStep.PROMPT_REFINEMENT]: "AI Refinement",
  [WorkflowStep.ADDITIONAL_INFO]: "Additional Info",
  [WorkflowStep.FRAME_GENERATION]: "Frame Generation",
  [WorkflowStep.FRAME_REVIEW]: "Review Frames",
  [WorkflowStep.VIDEO_GENERATION]: "Video Generation",
  [WorkflowStep.COMPLETED]: "Completed",
};

export function VideoCreationWizard({
  open,
  onClose,
  campaignId,
}: VideoCreationWizardProps) {
  const [currentWizardStep, setCurrentWizardStep] = useState(0);
  const [workflow, setWorkflow] = useState<VideoWorkflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Initial Prompt
  const [initialPrompt, setInitialPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("");
  const [duration, setDuration] = useState("30");
  const [style, setStyle] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");

  // Step 2: Refinement
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [selectedRefinementModel, setSelectedRefinementModel] = useState("gpt-4o");
  const [showPromptImprover, setShowPromptImprover] = useState(false);
  const [improvedPrompt, setImprovedPrompt] = useState<string | null>(null);
  const [improvingPrompt, setImprovingPrompt] = useState(false);

  // Step 3: Frame Review
  const [frameReviews, setFrameReviews] = useState<
    Record<number, { approved: boolean | null; feedback: string }>
  >({});
  const [showFrameRecreate, setShowFrameRecreate] = useState<number | null>(null);
  const [frameRecreatePrompt, setFrameRecreatePrompt] = useState("");
  const [selectedFrameModel, setSelectedFrameModel] = useState("stable-diffusion-xl");

  // Step 4: Video Generation
  const [selectedVideoModel, setSelectedVideoModel] = useState("veo-3");
  const [videoFps, setVideoFps] = useState("30");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const createWorkflow = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE}/api/video-workflows`,
        {
          title,
          initialPrompt,
          campaignId,
          metadata: {
            targetAudience,
            tone,
            duration: parseInt(duration),
            style,
            aspectRatio,
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setWorkflow(response.data);
      setCurrentWizardStep(1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create workflow");
    } finally {
      setLoading(false);
    }
  };

  const improvePromptWithAI = async () => {
    if (!workflow) return;
    setImprovingPrompt(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const latestPrompt = workflow.refinementIterations?.length
        ? workflow.refinementIterations[workflow.refinementIterations.length - 1].refinedPrompt
        : workflow.initialPrompt;

      const response = await axios.post(
        `${API_BASE}/api/poe/improve-prompt`,
        {
          prompt: latestPrompt,
          context: {
            targetAudience: workflow.initialMetadata?.targetAudience || targetAudience,
            tone: "professional and engaging",
            style: "high-quality video content",
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setImprovedPrompt(response.data.improvedPrompt ?? response.data.improved_prompt);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to improve prompt");
    } finally {
      setImprovingPrompt(false);
    }
  };

  const refinePrompt = async () => {
    if (!workflow) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE}/api/video-workflows/${workflow._id}/refine-prompt`,
        {
          additionalInfo: additionalInfo || improvedPrompt || undefined,
          model: selectedRefinementModel,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setWorkflow(response.data);
      setAdditionalInfo("");
      setImprovedPrompt(null);
      setShowPromptImprover(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to refine prompt");
    } finally {
      setLoading(false);
    }
  };

  const generateFrames = async () => {
    if (!workflow) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE}/api/video-workflows/${workflow._id}/generate-frames`,
        {
          frameCount: 3,
          model: selectedFrameModel,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setWorkflow(response.data);
      
      // Initialize frame reviews
      const reviews: Record<number, { approved: boolean | null; feedback: string }> = {};
      response.data.generatedFrames.forEach((frame: GeneratedFrame) => {
        reviews[frame.frameNumber] = { approved: null, feedback: "" };
      });
      setFrameReviews(reviews);
      setCurrentWizardStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate frames");
    } finally {
      setLoading(false);
    }
  };

  const submitFrameReviews = async () => {
    if (!workflow) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const frameReviewsArray = Object.entries(frameReviews).map(
        ([frameNumber, review]) => ({
          frameNumber: parseInt(frameNumber),
          approved: review.approved,
          feedback: review.feedback || undefined,
        })
      );
      
      const response = await axios.post(
        `${API_BASE}/api/video-workflows/${workflow._id}/review-frames`,
        { frameReviews: frameReviewsArray },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setWorkflow(response.data);
      
      if (response.data.framesApproved) {
        setCurrentWizardStep(3);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit reviews");
    } finally {
      setLoading(false);
    }
  };

  const recreateFrameWithChanges = async (frameNumber: number) => {
    if (!workflow) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE}/api/video-workflows/${workflow._id}/regenerate-frames`,
        {
          frameNumbers: [frameNumber],
          customPrompts: { [frameNumber]: frameRecreatePrompt },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setWorkflow(response.data);
      setShowFrameRecreate(null);
      setFrameRecreatePrompt("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to recreate frame");
    } finally {
      setLoading(false);
    }
  };

  const regenerateFrames = async () => {
    if (!workflow) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const rejectedFrames = Object.entries(frameReviews)
        .filter(([_, review]) => !review.approved)
        .map(([frameNumber]) => parseInt(frameNumber));

      const response = await axios.post(
        `${API_BASE}/api/video-workflows/${workflow._id}/regenerate-frames`,
        { frameNumbers: rejectedFrames },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setWorkflow(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to regenerate frames");
    } finally {
      setLoading(false);
    }
  };

  const generateVideo = async () => {
    if (!workflow) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE}/api/video-workflows/${workflow._id}/generate-video`,
        {
          model: selectedVideoModel,
          duration: parseInt(duration),
          fps: parseInt(videoFps),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setWorkflow(response.data);
      setCurrentWizardStep(4);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate video");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentWizardStep(0);
    setWorkflow(null);
    setInitialPrompt("");
    setTitle("");
    setTargetAudience("");
    setTone("");
    setDuration("30");
    setStyle("");
    setAspectRatio("16:9");
    setAdditionalInfo("");
    setFrameReviews({});
    setSelectedRefinementModel("gpt-4o");
    setSelectedFrameModel("stable-diffusion-xl");
    setSelectedVideoModel("veo-3");
    setVideoFps("30");
    setShowPromptImprover(false);
    setImprovedPrompt(null);
    setImprovingPrompt(false);
    setShowFrameRecreate(null);
    setFrameRecreatePrompt("");
    setError(null);
    onClose();
  };

  const renderProgressBar = () => {
    const steps = ["Prompt", "Refine", "Frames", "Video", "Done"];
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index <= currentWizardStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index < currentWizardStep ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className="text-xs mt-1">{step}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    index < currentWizardStep ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderPromptImproverModal = () => {
    if (!showPromptImprover) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 mt-0">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Improve Prompt with AI</h3>
          <p className="text-sm text-gray-600">ChatGPT will analyze your prompt and suggest improvements for better video generation.</p>
          {improvedPrompt ? (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">Suggested Improvement:</p>
                <p className="text-sm text-blue-800">{improvedPrompt}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAdditionalInfo(improvedPrompt);
                    setImprovedPrompt(null);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Use This
                </button>
                <button
                  onClick={() => setImprovedPrompt(null)}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={improvePromptWithAI}
              disabled={improvingPrompt}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
            >
              {improvingPrompt ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Improving...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Improve with ChatGPT
                </>
              )}
            </button>
          )}
          <button
            onClick={() => {
              setShowPromptImprover(false);
              setImprovedPrompt(null);
            }}
            className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderStep0 = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Video Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Summer Product Launch"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">Describe Your Video</label>
        <textarea
          id="prompt"
          value={initialPrompt}
          onChange={(e) => setInitialPrompt(e.target.value)}
          placeholder="Describe the video you want to create..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
          <input
            id="audience"
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g., Young professionals"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
          <input
            id="tone"
            type="text"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="e.g., Energetic, Professional"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">Duration (seconds)</label>
          <input
            id="duration"
            type="number"
            min="5"
            max="60"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-700 mb-1">Aspect Ratio</label>
          <select
            id="aspectRatio"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          >
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
            <option value="1:1">1:1 (Square)</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-1">Visual Style</label>
        <input
          id="style"
          type="text"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          placeholder="e.g., Modern, Minimalist, Vibrant"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <button
        onClick={createWorkflow}
        disabled={loading || !initialPrompt || !title}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating...
          </>
        ) : (
          <>
            Start Creating
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>
    </div>
  );

  const renderStep1 = () => {
    const latestIteration =
      workflow?.refinementIterations?.length
        ? workflow.refinementIterations[workflow.refinementIterations.length - 1]
        : undefined;

    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              AI-Refined Prompt
            </h3>
          </div>
          <div className="p-4">
            {latestIteration ? (
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">
                    {latestIteration.refinedPrompt}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    Model: {latestIteration.refinementModel}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                    Iteration {latestIteration.iteration}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Your prompt will be refined here...
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="refinementModel" className="block text-sm font-medium text-gray-700 mb-1">AI Model</label>
          <select
            id="refinementModel"
            value={selectedRefinementModel}
            onChange={(e) => setSelectedRefinementModel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          >
            {REFINEMENT_MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">Additional Information (Optional)</label>
          <textarea
            id="additionalInfo"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="Add more details to refine the prompt..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="flex gap-2 flex-col">
          <button
            onClick={() => setShowPromptImprover(true)}
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition flex items-center justify-center"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Improve with ChatGPT
          </button>
          <div className="flex gap-2">
            {latestIteration && (
              <button
                onClick={generateFrames}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center"
              >
                Continue to Frames
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            <button
              onClick={refinePrompt}
              disabled={loading}
              className={`${latestIteration ? "" : "flex-1"} px-4 py-2 ${latestIteration ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50" : "bg-blue-600 text-white hover:bg-blue-700"} rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refining...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {latestIteration ? "Refine Again" : "Refine Prompt"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">AI Model for Frames</label>
        <select
          value={selectedFrameModel}
          onChange={(e) => setSelectedFrameModel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
        >
          {FRAME_MODELS.map((model) => (
            <option key={model.value} value={model.value}>
              {model.label}
            </option>
          ))}
        </select>
      </div>

      {workflow?.generatedFrames && workflow.generatedFrames.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4">
            {workflow.generatedFrames.map((frame) => (
              <div key={frame.frameNumber} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Frame {frame.frameNumber}</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        {frame.model}
                      </span>
                    </div>
                    <img
                      src={frame.imageUrl}
                      alt={`Frame ${frame.frameNumber}`}
                      className="w-full rounded-md"
                    />
                    <p className="text-sm text-gray-500">{frame.prompt}</p>
                    
                    <div className="flex gap-2 flex-col">
                      <button
                        onClick={() => setShowFrameRecreate(frame.frameNumber)}
                        className="w-full px-3 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium hover:bg-orange-200 transition flex items-center justify-center"
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Recreate with Changes
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setFrameReviews((prev) => ({
                              ...prev,
                              [frame.frameNumber]: {
                                ...prev[frame.frameNumber],
                                approved: true,
                              },
                            }))
                          }
                          className={`flex-1 px-3 py-2 rounded-lg font-medium transition flex items-center justify-center ${
                            frameReviews[frame.frameNumber]?.approved
                              ? "bg-green-600 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            setFrameReviews((prev) => ({
                              ...prev,
                              [frame.frameNumber]: {
                                ...prev[frame.frameNumber],
                                approved: false,
                              },
                            }))
                          }
                          className={`flex-1 px-3 py-2 rounded-lg font-medium transition flex items-center justify-center ${
                            frameReviews[frame.frameNumber]?.approved === false
                              ? "bg-red-600 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Reject
                        </button>
                      </div>
                    </div>

                    {showFrameRecreate === frame.frameNumber && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                        <p className="text-sm font-medium text-orange-900">Describe your changes:</p>
                        <textarea
                          placeholder="Describe what you'd like to change about this frame. E.g., 'Add more vibrant colors', 'Make it more cinematic', 'Different angle'"
                          value={frameRecreatePrompt}
                          onChange={(e) => setFrameRecreatePrompt(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => recreateFrameWithChanges(frame.frameNumber)}
                            disabled={loading || !frameRecreatePrompt.trim()}
                            className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? "Recreating..." : "Recreate Frame"}
                          </button>
                          <button
                            onClick={() => {
                              setShowFrameRecreate(null);
                              setFrameRecreatePrompt("");
                            }}
                            className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {frameReviews[frame.frameNumber]?.approved === false && showFrameRecreate !== frame.frameNumber && (
                      <textarea
                        placeholder="What would you like to change?"
                        value={frameReviews[frame.frameNumber]?.feedback || ""}
                        onChange={(e) =>
                          setFrameReviews((prev) => ({
                            ...prev,
                            [frame.frameNumber]: {
                              ...prev[frame.frameNumber],
                              feedback: e.target.value,
                            },
                          }))
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {Object.values(frameReviews).some((r) => r.approved === false) && (
              <button
                onClick={regenerateFrames}
                disabled={loading}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                <span className="ml-2">Regenerate Rejected</span>
              </button>
            )}
            <button
              onClick={submitFrameReviews}
              disabled={
                loading ||
                Object.values(frameReviews).some((r) => r.approved === null)
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  Continue to Video
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            No frames generated yet. Click the button below to generate sample frames.
          </p>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            Video Settings
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label htmlFor="videoModel" className="block text-sm font-medium text-gray-700 mb-1">AI Model</label>
            <select
              id="videoModel"
              value={selectedVideoModel}
              onChange={(e) => setSelectedVideoModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              {VIDEO_MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fps" className="block text-sm font-medium text-gray-700 mb-1">FPS</label>
              <input
                id="fps"
                type="number"
                value={videoFps}
                onChange={(e) => setVideoFps(e.target.value)}
                min="24"
                max="60"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input
                value={`${duration}s`}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          {workflow?.finalRefinedPrompt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Final Prompt</label>
              <div className="bg-gray-50 p-3 rounded-md text-sm mt-2">
                {workflow.finalRefinedPrompt}
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={generateVideo}
        disabled={loading}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Video... (This may take a few minutes)
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Generate Video
          </>
        )}
      </button>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      {workflow?.videoOutput ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Video Ready!
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <video
              src={workflow.videoOutput.videoUrl}
              controls
              className="w-full rounded-md"
            />
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                Model: {workflow.videoOutput.model}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                Duration: {workflow.videoOutput.duration}s
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                FPS: {workflow.videoOutput.fps}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(workflow.videoOutput!.videoUrl, "_blank")}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Download Video
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Video is being generated. This may take several minutes...
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {renderPromptImproverModal()}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create AI Video</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {renderProgressBar()}

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {workflow?.status && (
                <div className="flex items-center gap-2 text-sm mb-4">
                  <span className="text-gray-500">Status:</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      workflow.status === WorkflowStatus.COMPLETED
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : workflow.status === WorkflowStatus.FAILED
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : "bg-blue-100 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {workflow.status}
                  </span>
                </div>
              )}

              {currentWizardStep === 0 && renderStep0()}
              {currentWizardStep === 1 && renderStep1()}
              {currentWizardStep === 2 && renderStep2()}
              {currentWizardStep === 3 && renderStep3()}
              {currentWizardStep === 4 && renderStep4()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
