import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt for the video.');
      return;
    }

    setError('');
    setVideoUrl('');

    // Check API key selection
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      try {
        await window.aistudio.openSelectKey();
      } catch (e) {
        setError('API key selection is required to generate videos.');
        return;
      }
    }

    setIsGenerating(true);
    setStatus('Initializing video generation...');

    try {
      const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        setStatus('Generating video... This may take a few minutes. Please do not close this window.');
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setStatus('Fetching video file...');
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch the generated video.');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setStatus('Video generated successfully!');
      } else {
        throw new Error('Failed to get video link from the model response.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating the video.');
      setStatus('');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white border-8 border-black rounded-[3rem] p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-5xl font-black uppercase tracking-tighter">AI Video Generator</h2>
          <p className="text-xl font-bold text-gray-500 mt-2">Create educational videos for your lessons using Veo.</p>
        </div>
        <div className="w-24 h-24 bg-purple-100 rounded-full border-4 border-black flex items-center justify-center text-4xl">
          🎥
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-sm font-black uppercase tracking-widest mb-4">Video Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., A 3D animation explaining the water cycle, showing evaporation, condensation, and precipitation..."
            className="w-full p-6 bg-gray-50 border-4 border-black rounded-3xl font-bold text-lg outline-none focus:bg-white focus:shadow-[8px_8px_0px_0px_rgba(168,85,247,1)] transition-all min-h-[150px]"
            disabled={isGenerating}
          />
        </div>

        {error && (
          <div className="p-6 bg-red-100 border-4 border-red-500 rounded-2xl text-red-700 font-bold">
            {error}
          </div>
        )}

        {status && !error && (
          <div className="p-6 bg-blue-50 border-4 border-blue-500 rounded-2xl text-blue-700 font-bold flex items-center gap-4">
            {isGenerating && (
              <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {status}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-6 bg-purple-600 text-white rounded-2xl border-4 border-black font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Video'}
        </button>

        {videoUrl && (
          <div className="mt-12 border-4 border-black rounded-3xl overflow-hidden bg-black">
            <video 
              src={videoUrl} 
              controls 
              className="w-full h-auto aspect-video"
              autoPlay
            />
          </div>
        )}
      </div>
    </div>
  );
};
