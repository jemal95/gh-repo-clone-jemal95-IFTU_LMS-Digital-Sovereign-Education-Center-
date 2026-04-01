
import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import pptxgen from 'pptxgenjs';

const ProjectReportPortal: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const reportContentEn = {
    title: "IFTU National Digital Sovereign Education Center",
    summary: "A state-of-the-art Learning Management System (LMS) designed for Ethiopia's digital sovereignty, empowering students and teachers with AI-driven tools and national curriculum alignment.",
    features: [
      "Sovereign Identity: Integration with National ID for secure student records.",
      "AI-Powered Learning: Real-time lesson simplification and advanced context generation.",
      "National Curriculum: Comprehensive modules for Grades 9-12 and TVET colleges.",
      "Teacher Forge: AI-assisted exam generation and curriculum architecture.",
      "Offline-First: Resilient synchronization for areas with intermittent connectivity."
    ],
    technical: "Built with React 19, TypeScript, Tailwind CSS v4, and Supabase. Powered by Gemini 3.1 Pro for educational intelligence and real-time pedagogical adaptation.",
    architecture: "The IFTU platform utilizes a decentralized sovereign architecture, ensuring that all educational data remains within the national digital boundaries. It features a robust offline-first synchronization engine for resilient learning in remote areas.",
    vision: "To bridge the digital divide in Ethiopia by providing high-quality, AI-enhanced education that respects national values and digital sovereignty."
  };

  const reportContentOm = {
    title: "Giddu-gala Barnoota Of-danda'aa Dijitaalaa Biyoolessaa IFTU",
    summary: "Sirna Bulchiinsa Barumsaa (LMS) ammayyaa kan birmadummaa dijitaalaa Itoophiyaatiif qophaa'e, barattootaa fi barsiisota meeshaalee AI-n deeggaramanii fi sirna barnoota biyoolessaa waliin walsimuun kan humneessudha.",
    features: [
      "Eenyummaa Of-danda'aa: Galmee barattootaa amansiisaa ta'eef NID waliin walitti hidhamuu.",
      "Barumsa AI-n Deeggarame: Barnoota salphisuu fi yaada gadi fageenyaa AI-n maddisiisuu.",
      "Sirna Barnoota Biyoolessaa: Kutaa 9-12 fi kolleejjota TVET-tiif mooduloota guutuu.",
      "Forge Barsiisotaa: Qorumsa qopheessuu fi sirna barnootaa AI-n deeggarame.",
      "Offline-First: Naannolee tajaajila interneetii hin qabneef sirna wal-simsiisuu danda'u."
    ],
    technical: "React 19, TypeScript, Tailwind CSS v4, fi Supabase fayyadamanii ijaarame. Gemini 3.1 Pro barnootaaf itti fayyadama.",
    architecture: "Pilaatfoormiin IFTU arkiteektara of-danda'aa bittinnaa'e fayyadama, kunis ragaan barnootaa hundi daangaa dijitaalaa biyya keessatti akka hafu mirkaneessa.",
    vision: "Barnoota qulqullina qabu, AI-n deeggarame kan duudhaalee biyyaalessaa fi birmadummaa dijitaalaa kabaju dhiyeessuun garaagarummaa dijitaalaa Itoophiyaa keessa jiru dhiphisuuf."
  };

  const generatePDF = (doc: jsPDF, content: typeof reportContentEn) => {
    doc.setFontSize(22);
    doc.text(content.title, 20, 30);
    doc.setFontSize(14);
    doc.text("Official Project Report & Documentation", 20, 45);
    doc.line(20, 50, 190, 50);
    
    doc.setFontSize(16);
    doc.text("1. Executive Summary", 20, 65);
    doc.setFontSize(12);
    const splitSummary = doc.splitTextToSize(content.summary, 170);
    doc.text(splitSummary, 20, 75);

    doc.setFontSize(16);
    doc.text("2. Key Features", 20, 105);
    doc.setFontSize(12);
    content.features.forEach((feature, index) => {
      const splitFeature = doc.splitTextToSize(`• ${feature}`, 170);
      doc.text(splitFeature, 25, 115 + (index * 12));
    });

    doc.setFontSize(16);
    doc.text("3. Technical Architecture", 20, 180);
    doc.setFontSize(12);
    const splitArch = doc.splitTextToSize(content.architecture, 170);
    doc.text(splitArch, 20, 190);

    doc.setFontSize(16);
    doc.text("4. Strategic Vision", 20, 220);
    doc.setFontSize(12);
    const splitVision = doc.splitTextToSize(content.vision, 170);
    doc.text(splitVision, 20, 230);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 280);
  };

  const generatePPT = (pres: pptxgen, content: typeof reportContentEn) => {
    // Slide 1: Title
    let slide1 = pres.addSlide();
    slide1.addText(content.title, { x: 1, y: 1, w: 8, h: 1, fontSize: 36, bold: true, color: "363636", align: "center" });
    slide1.addText("National Digital Sovereign Education Center", { x: 1, y: 2, w: 8, h: 0.5, fontSize: 18, color: "666666", align: "center" });
    slide1.addText("Project Documentation v1.0", { x: 1, y: 4, w: 8, h: 0.5, fontSize: 14, color: "999999", align: "center" });

    // Slide 2: Summary
    let slide2 = pres.addSlide();
    slide2.addText("Executive Summary", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "003366" });
    slide2.addText(content.summary, { x: 0.5, y: 1.5, w: 9, h: 2, fontSize: 16 });

    // Slide 3: Features
    let slide3 = pres.addSlide();
    slide3.addText("Key Features", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "003366" });
    content.features.forEach((feature, index) => {
      slide3.addText(feature, { x: 0.8, y: 1.2 + (index * 0.6), w: 8.5, h: 0.5, fontSize: 14, bullet: true });
    });

    // Slide 4: Architecture
    let slide4 = pres.addSlide();
    slide4.addText("Technical Architecture", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "003366" });
    slide4.addText(content.architecture, { x: 0.5, y: 1.5, w: 9, h: 2, fontSize: 16 });
    slide4.addText(`Stack: ${content.technical}`, { x: 0.5, y: 4, w: 9, h: 1, fontSize: 12, italic: true });

    // Slide 5: Vision
    let slide5 = pres.addSlide();
    slide5.addText("Strategic Vision", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "003366" });
    slide5.addText(content.vision, { x: 0.5, y: 1.5, w: 9, h: 2, fontSize: 18, italic: true, align: "center" });
  };

  const handleDownloadZip = async () => {
    setIsGenerating(true);
    try {
      const zip = new JSZip();

      // Generate English PDF
      const pdfEn = new jsPDF();
      generatePDF(pdfEn, reportContentEn);
      const pdfEnBlob = pdfEn.output('blob');
      zip.file("IFTU_Project_Report_EN.pdf", pdfEnBlob);

      // Generate Afan Oromo PDF
      const pdfOm = new jsPDF();
      generatePDF(pdfOm, reportContentOm);
      const pdfOmBlob = pdfOm.output('blob');
      zip.file("IFTU_Gabaasa_Piroojektii_OM.pdf", pdfOmBlob);

      // Generate English PPT
      const pptEn = new pptxgen();
      generatePPT(pptEn, reportContentEn);
      const pptEnBlob = await pptEn.write({ outputType: 'blob' }) as Blob;
      zip.file("IFTU_Project_Presentation_EN.pptx", pptEnBlob);

      // Generate Afan Oromo PPT
      const pptOm = new pptxgen();
      generatePPT(pptOm, reportContentOm);
      const pptOmBlob = await pptOm.write({ outputType: 'blob' }) as Blob;
      zip.file("IFTU_Gabaasa_Piroojektii_OM.pptx", pptOmBlob);

      // Generate the ZIP file
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "IFTU_Sovereign_Documentation_Package.zip");
    } catch (error) {
      console.error("Failed to generate documentation package:", error);
      alert("Documentation Synthesis Interrupted. Please check system logs.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-12 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b-8 border-black pb-10">
        <div>
          <h2 className="text-8xl font-black uppercase italic tracking-tighter text-blue-900 leading-none">Project Report.</h2>
          <p className="text-blue-600 font-black uppercase text-sm mt-4 tracking-[0.3em]">National Documentation Registry</p>
        </div>
        <button 
          onClick={handleDownloadZip}
          disabled={isGenerating}
          className="bg-black text-white px-12 py-6 rounded-[2.5rem] border-8 border-black font-black uppercase text-xl shadow-[12px_12px_0px_0px_rgba(59,130,246,1)] hover:translate-y-2 transition-all flex items-center gap-4 disabled:opacity-50"
        >
          {isGenerating ? 'Synthesizing...' : '📦 Download Documentation (ZIP)'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* English Section */}
        <div className="bg-white border-8 border-black rounded-[4rem] p-12 space-y-8 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🇬🇧</span>
            <h3 className="text-4xl font-black uppercase italic tracking-tighter">English Version</h3>
          </div>
          <div className="space-y-6 text-xl font-bold text-gray-700">
            <p className="text-3xl font-black text-blue-900 uppercase">{reportContentEn.title}</p>
            <p className="italic leading-relaxed">{reportContentEn.summary}</p>
            <ul className="space-y-4">
              {reportContentEn.features.map((f, i) => (
                <li key={i} className="flex gap-4">
                  <span className="text-blue-600">◈</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Afan Oromo Section */}
        <div className="bg-white border-8 border-black rounded-[4rem] p-12 space-y-8 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🇪🇹</span>
            <h3 className="text-4xl font-black uppercase italic tracking-tighter">Afan Oromo</h3>
          </div>
          <div className="space-y-6 text-xl font-bold text-gray-700">
            <p className="text-3xl font-black text-red-600 uppercase">{reportContentOm.title}</p>
            <p className="italic leading-relaxed">{reportContentOm.summary}</p>
            <ul className="space-y-4">
              {reportContentOm.features.map((f, i) => (
                <li key={i} className="flex gap-4">
                  <span className="text-red-600">◈</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 text-white p-12 md:p-20 rounded-[5rem] border-8 border-black shadow-[30px_30px_0px_0px_rgba(0,0,0,1)] space-y-8">
        <h4 className="text-5xl font-black uppercase italic tracking-tighter">Technical Architecture</h4>
        <p className="text-2xl font-bold italic opacity-80 leading-relaxed">
          The IFTU platform utilizes a decentralized sovereign architecture, ensuring that all educational data remains within the national digital boundaries. 
          The integration of Gemini 3.1 Pro allows for real-time pedagogical adaptation, catering to diverse student needs across secondary and TVET levels.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8">
          <div className="p-6 border-4 border-white/20 rounded-3xl text-center">
            <p className="text-3xl font-black">React 19</p>
            <p className="text-xs uppercase font-black opacity-50">Frontend</p>
          </div>
          <div className="p-6 border-4 border-white/20 rounded-3xl text-center">
            <p className="text-3xl font-black">Supabase</p>
            <p className="text-xs uppercase font-black opacity-50">Database</p>
          </div>
          <div className="p-6 border-4 border-white/20 rounded-3xl text-center">
            <p className="text-3xl font-black">Gemini 3.1</p>
            <p className="text-xs uppercase font-black opacity-50">Intelligence</p>
          </div>
          <div className="p-6 border-4 border-white/20 rounded-3xl text-center">
            <p className="text-3xl font-black">Tailwind</p>
            <p className="text-xs uppercase font-black opacity-50">Styling</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectReportPortal;
