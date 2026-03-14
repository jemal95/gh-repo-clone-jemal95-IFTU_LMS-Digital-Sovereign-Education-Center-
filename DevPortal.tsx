
import React, { useState, useEffect } from 'react';

const DevPortal: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset the button state after printing or canceling
  useEffect(() => {
    const handleAfterPrint = () => setIsProcessing(false);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const handlePrint = () => {
    // Mobile browsers require immediate execution to trust the user gesture
    setIsProcessing(true);
    try {
      window.print();
    } catch (e) {
      console.error("Print failed:", e);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-fadeIn pb-40">
      {/* HEADER: Screen Only UI */}
      <div className="text-center space-y-8 mb-20 no-print">
        <div className="inline-block bg-blue-600 text-white px-8 py-3 rounded-2xl border-4 border-black font-black uppercase text-xs tracking-[0.4em] shadow-xl mb-4">
          IFTU Infrastructure Division
        </div>
        <h1 className="text-7xl md:text-9xl font-black uppercase italic tracking-tighter leading-none text-blue-900">
          Hosting <span className="liquid-spectrum-text">Manual.</span>
        </h1>
        <p className="text-xl font-black text-gray-400 uppercase tracking-widest italic max-w-2xl mx-auto">
          Official procedural steps for deploying the IFTU LMS Sovereign Codebase to public cloud nodes.
        </p>
        
        <div className="flex flex-col items-center gap-6">
          <button 
            onClick={handlePrint}
            disabled={isProcessing}
            className={`mt-8 px-12 py-6 rounded-[3rem] border-8 border-black font-black uppercase text-2xl shadow-[12px_12px_0px_0px_rgba(34,197,94,1)] hover:translate-y-2 hover:shadow-none transition-all ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white'}`}
          >
            {isProcessing ? 'System Printing...' : 'Generate Official PDF Guide 📥'}
          </button>
          
          <div className="bg-yellow-50 border-4 border-black p-6 rounded-[2.5rem] flex items-center gap-4 max-w-lg shadow-sm">
            <span className="text-3xl">📱</span>
            <div className="text-left space-y-1">
              <p className="text-[10px] font-black uppercase tracking-tight leading-tight">
                <span className="text-blue-600">MOBILE USERS:</span> If no window pops up, tap your browser's <span className="underline">Menu/Share</span> icon and select <span className="bg-yellow-200 px-1 font-black">"Print"</span>.
              </p>
              <p className="text-[10px] font-black uppercase tracking-tight text-gray-400 leading-tight">
                Then set "Destination" to "Save as PDF".
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* THE OFFICIAL DOCUMENT (Print Optimized) */}
      <div className="bg-white border-[12px] border-black rounded-[5rem] p-12 md:p-24 shadow-[40px_40px_0px_0px_rgba(0,0,0,1)] space-y-20 relative printable-transcript">
        {/* Document Header */}
        <div className="absolute top-0 left-0 w-full h-10 ethiopian-gradient"></div>
        
        <div className="flex justify-between items-start border-b-8 border-black pb-12">
          <div className="space-y-4">
            <h2 className="text-5xl font-black uppercase italic tracking-tighter">IFTU National Digital Center</h2>
            <p className="text-sm font-black text-blue-600 uppercase tracking-[0.3em]">Deployment & Integration Protocol</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase italic">Ref: IFTU-DEPLOY-2025-001 // Auth: Jemal Fano Haji</p>
          </div>
          <div className="w-32 h-32 bg-gray-50 border-4 border-black rounded-3xl flex items-center justify-center text-6xl shadow-inner">🏛️</div>
        </div>

        {/* SECTION 1: GITHUB PAGES */}
        <section className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-black text-white rounded-2xl border-4 border-black flex items-center justify-center text-3xl font-black italic">01</div>
            <h3 className="text-4xl font-black uppercase italic tracking-tighter">Protocol: GitHub Pages Broadcast</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-10 pl-6 border-l-8 border-blue-600">
            <div className="space-y-3">
              <h4 className="text-2xl font-black uppercase italic">Step 1: Digital Registry Initialization</h4>
              <p className="text-gray-600 font-bold leading-relaxed text-lg italic">Create a Public repository on GitHub named <code>iftu-portal</code>. This acts as the source-of-truth for your application.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-2xl font-black uppercase italic">Step 2: Codebase Synchronization</h4>
              <p className="text-gray-600 font-bold leading-relaxed mb-4 italic">Commit your code using the Git terminal interface:</p>
              <div className="bg-slate-900 text-green-400 p-8 rounded-[2rem] font-mono text-lg border-4 border-black shadow-inner overflow-x-auto">
                git init<br/>
                git add .<br/>
                git commit -m "IFTU Sovereign Release v1.0"<br/>
                git remote add origin [YOUR_REPO_URL]<br/>
                git push -u origin main
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-2xl font-black uppercase italic">Step 3: Portal Activation</h4>
              <p className="text-gray-600 font-bold leading-relaxed text-lg italic">Navigate to <b>Settings &gt; Pages</b>. Set Source to 'Deploy from a branch' and select <code>main</code>. Click Save. Your portal will be live globally at <code>username.github.io/iftu-portal</code>.</p>
            </div>
          </div>
        </section>

        {/* SECTION 2: FIREBASE HOSTING */}
        <section className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-[#ffcd00] text-black rounded-2xl border-4 border-black flex items-center justify-center text-3xl font-black italic">02</div>
            <h3 className="text-4xl font-black uppercase italic tracking-tighter">Protocol: Firebase Infrastructure</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-10 pl-6 border-l-8 border-[#ffcd00]">
            <div className="space-y-3">
              <h4 className="text-2xl font-black uppercase italic">Step 1: Cloud Project Registration</h4>
              <p className="text-gray-600 font-bold leading-relaxed text-lg italic">Register a project at <b>firebase.google.com</b>. Choose a unique project ID like <code>iftu-sovereign-lms</code>.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-2xl font-black uppercase italic">Step 2: Local CLI Integration</h4>
              <div className="bg-slate-900 text-green-400 p-8 rounded-[2rem] font-mono text-lg border-4 border-black shadow-inner overflow-x-auto">
                npm install -g firebase-tools<br/>
                firebase login<br/>
                firebase init hosting
              </div>
              <p className="text-[12px] font-black uppercase text-gray-400 italic">Critical: Select 'Single Page App' configuration during setup.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-2xl font-black uppercase italic">Step 3: Global Node Deployment</h4>
              <div className="bg-slate-900 text-green-400 p-8 rounded-[2rem] font-mono text-lg border-4 border-black shadow-inner overflow-x-auto">
                npm run build<br/>
                firebase deploy
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: VERCEL DEPLOYMENT */}
        <section className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-black text-white rounded-2xl border-4 border-black flex items-center justify-center text-3xl font-black italic">03</div>
            <h3 className="text-4xl font-black uppercase italic tracking-tighter">Protocol: Vercel Cloud Node</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-10 pl-6 border-l-8 border-black">
            <div className="space-y-3">
              <h4 className="text-2xl font-black uppercase italic">Step 1: Repository Linkage</h4>
              <p className="text-gray-600 font-bold leading-relaxed text-lg italic">Connect your GitHub account to <b>vercel.com</b> and import the <code>iftu-portal</code> repository.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-2xl font-black uppercase italic">Step 2: Build Configuration</h4>
              <p className="text-gray-600 font-bold leading-relaxed text-lg italic">Vercel will automatically detect Vite. Ensure the Framework Preset is set to <b>Vite</b>.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-2xl font-black uppercase italic">Step 3: Environment Synchronization</h4>
              <p className="text-gray-600 font-bold leading-relaxed text-lg italic">Add your <code>API_KEY</code> and any Supabase variables in the <b>Environment Variables</b> section before clicking Deploy.</p>
            </div>
          </div>
        </section>

        {/* SECTION 4: API_KEY SECURITY */}
        <section className="bg-rose-50 border-8 border-black rounded-[4rem] p-12 space-y-8 shadow-inner">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-600 text-white rounded-2xl border-4 border-black flex items-center justify-center text-3xl font-black italic">!</div>
            <h3 className="text-4xl font-black uppercase italic tracking-tighter">Critical: Environment Configuration</h3>
          </div>
          <p className="text-xl font-black leading-relaxed italic text-rose-900">
            For the Sovereign AI Tutor to function in production, you MUST set your <code>API_KEY</code> in the hosting provider's Environment Secrets panel.
          </p>
          <div className="bg-white p-8 border-4 border-black rounded-[2.5rem] shadow-md space-y-4">
             <p className="font-mono text-2xl md:text-3xl font-black text-center text-blue-900 break-all">KEY: API_KEY</p>
             <div className="h-1 bg-gray-100 w-full"></div>
             <p className="font-mono text-lg font-black text-center text-gray-500 break-all">Optional: VITE_BASE_PATH (for GH Pages)</p>
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-gray-400 text-center">
            Reference: ai.google.dev/gemini-api/docs/api-key
          </p>
        </section>

        {/* OFFICIAL FOOTER */}
        <div className="pt-20 border-t-8 border-black flex flex-col items-center space-y-8">
           <div className="flex gap-6">
              <div className="w-12 h-12 bg-[#009b44] rounded-lg border-2 border-black"></div>
              <div className="w-12 h-12 bg-[#ffcd00] rounded-lg border-2 border-black"></div>
              <div className="w-12 h-12 bg-[#ef3340] rounded-lg border-2 border-black"></div>
           </div>
           <p className="text-xl md:text-2xl font-black italic text-center">IFTU National Digital Sovereign Education Center</p>
           <p className="text-sm font-bold text-gray-500 uppercase tracking-widest italic text-center">Central Headquarters: Addis Ababa, Ethiopia</p>
           <div className="bg-gray-50 border-2 border-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
             Official System Documentation // No: 992-IF-HOST
           </div>
        </div>
      </div>
    </div>
  );
};

export default DevPortal;
