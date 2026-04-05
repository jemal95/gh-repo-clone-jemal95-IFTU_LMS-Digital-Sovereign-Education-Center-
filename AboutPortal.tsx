
import React from 'react';
import { NATIONAL_CENTER_INFO } from '../constants';
import { User } from '../types';

interface AboutPortalProps {
  currentUser?: User | null;
}

const AboutPortal: React.FC<AboutPortalProps> = ({ currentUser }) => {
  const isFounder = currentUser?.email === 'jemalfano030@gmail.com' || currentUser?.email === 'jemalfan030@gmail.com';
  const founderPhoto = isFounder ? currentUser?.photo : NATIONAL_CENTER_INFO.founderPhoto;

  return (
    <div className="max-w-6xl mx-auto space-y-32 py-12 animate-fadeIn">
      {/* Vision Hero */}
      <section className="bg-white border-[10px] border-black rounded-[6rem] p-16 md:p-32 shadow-[30px_30px_0px_0px_rgba(255,205,0,1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
          <div className="ethiopian-gradient h-full w-full"></div>
        </div>
        <div className="space-y-12 relative z-10">
          <div className="space-y-4">
            <h2 className="text-6xl md:text-[8rem] font-black uppercase italic tracking-tighter leading-[0.8] text-blue-900">
              Digital <br/>Sovereignty.
            </h2>
            <h2 className="text-4xl md:text-[5rem] font-black uppercase italic tracking-tighter leading-[0.8] text-green-700 opacity-80">
              Barnoota <br/>Dijitaalaa.
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
            <div className="space-y-6 border-l-8 border-yellow-400 pl-8 bg-yellow-50/50 p-8 rounded-r-[3rem]">
              <p className="text-2xl font-black uppercase text-yellow-600 tracking-widest">English Profile</p>
              <p className="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed">
                Located in <span className="text-blue-600">Ethiopia, Oromia region, West Arsi Zone, Kore woreda</span>. 
                Jemal Fano Haji is an IT Expert and teacher at Biftu Beri Secondary School. 
                He specializes in developing websites, software, and various applications. 
                He provides online education through the IFTU LMS platform and other digital channels.
              </p>
            </div>
            <div className="space-y-6 border-l-8 border-green-600 pl-8 bg-green-50/50 p-8 rounded-r-[3rem]">
              <p className="text-2xl font-black uppercase text-green-600 tracking-widest">Ibsa Afaan Oromoo</p>
              <p className="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed">
                Teessoon koo: <span className="text-green-700">Itoophiyaa, Naannoo Oromiyaa, Godina Arsii Lixaa, Aanaa Koree</span>. 
                Jamaal Faanoo Hajjii Ogeessa IT fi barsiisaa Mana Barumsaa Biftuubari Sadarkaa 2ffaa ti. 
                Weebsaayitii, moosaajii fi appilikeeshinii garaa garaa misoomsuu irratti hojjata. 
                Akkasumas, pilaatfoormii IFTU LMS fi karaalee birootiin barnoota onlaayinii ni kenna.
              </p>
            </div>
          </div>
          <div className="h-4 w-48 bg-red-600"></div>
        </div>
      </section>

      {/* Message Section */}
      <section className="bg-blue-900 text-white border-[10px] border-black rounded-[5rem] p-12 md:p-24 shadow-[30px_30px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute -bottom-20 -right-20 text-[20rem] opacity-10 pointer-events-none select-none">⚡</div>
        <div className="space-y-16 relative z-10">
          <div className="space-y-4">
             <span className="bg-yellow-400 text-black px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest italic">Dhaamsa Developer / Developer's Message</span>
             <h3 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">Technology & AI.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-6">
              <p className="text-xl md:text-2xl font-bold leading-relaxed opacity-90 italic border-b-4 border-yellow-400 pb-8">
                "In this modern era, everything is becoming digital. Understanding Technology and AI is no longer an option but a necessity. Join us to learn, grow, and be supported in your digital journey."
              </p>
            </div>
            <div className="space-y-6">
              <p className="text-xl md:text-2xl font-bold leading-relaxed opacity-90 italic border-b-4 border-green-500 pb-8">
                "Yeroo ammaa kana wantoonni hundi karaa dijitaalaa waan hojjatamaniif, itti fayyadama Teeknooloojii fi AI beekuun dirqama. Koottaa waliin barannaa, isin barsiifna, isin deeggarras."
              </p>
            </div>
          </div>
          
          <div className="pt-8 bg-white/10 p-8 rounded-3xl inline-block border-2 border-white/20">
            <p className="text-3xl font-black uppercase tracking-widest text-yellow-400">Developer Jemal Fano Haji</p>
            <p className="text-lg font-bold text-blue-300">IT Expert & Educator | Ogeessa IT fi Barsiisaa</p>
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-white border-8 border-black p-12 rounded-[4rem] shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] space-y-8">
          <h3 className="text-4xl font-black uppercase italic tracking-tighter border-b-4 border-black pb-4">Skills & Expertise</h3>
          <div className="grid grid-cols-2 gap-6">
            {['Web Systems', 'Mobile Apps', 'AI Integration', 'LMS Design', 'Cloud Computing', 'IT Training'].map((skill, i) => (
              <div key={i} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border-4 border-black font-black uppercase text-xs">
                <span className="text-blue-600">⚡</span> {skill}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-green-600 text-white border-8 border-black p-12 rounded-[4rem] shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] space-y-8">
          <h3 className="text-4xl font-black uppercase italic tracking-tighter border-b-4 border-white pb-4">Ogummaa fi Beekumsa</h3>
          <div className="grid grid-cols-2 gap-6">
            {['Sirna Weebii', 'Appilikeeshinii', 'AI fi Teeknooloojii', 'IFTU LMS', 'Kalaqa Dijitaalaa', 'Leenjii IT'].map((skill, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border-4 border-white font-black uppercase text-xs">
                <span className="text-yellow-400">⚡</span> {skill}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI & Tools Section */}
      <section className="bg-white border-[10px] border-black rounded-[5rem] p-12 md:p-24 shadow-[30px_30px_0px_0px_rgba(59,130,246,1)]">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter">AI & Digital Tools</h3>
            <h4 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-blue-600">Meeshaalee AI fi Dijitaalaa</h4>
            <p className="text-xl font-bold text-gray-500 italic">Empowering education with advanced intelligence. / Barnoota ogummaa ammayyaatiin deeggaruu.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Google AI Studio', nameAO: 'Google AI Studio', desc: 'Advanced coding and model prototyping.', descAO: 'Kalaqa koodii fi piroototaayipii ammayyaa.', icon: '🤖' },
              { name: 'ChatGPT', nameAO: 'ChatGPT', desc: 'Creative content and problem solving.', descAO: 'Qophii qabiyyee fi furaa rakkoolee.', icon: '💬' },
              { name: 'Gemini', nameAO: 'Gemini', desc: 'Multimodal AI for complex reasoning.', descAO: 'AI dandeettii xiinxala qabu.', icon: '✨' }
            ].map((tool, i) => (
              <div key={i} className="bg-blue-50 border-4 border-black p-8 rounded-3xl space-y-4 hover:scale-105 transition-transform">
                <div className="text-5xl">{tool.icon}</div>
                <div className="space-y-1">
                  <h4 className="text-2xl font-black uppercase italic">{tool.name}</h4>
                  <p className="text-xs font-black text-blue-600">{tool.nameAO}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 italic border-b border-gray-200 pb-2">{tool.desc}</p>
                  <p className="text-xs font-bold text-gray-600 italic">{tool.descAO}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Access Links */}
      <section className="bg-yellow-400 border-[10px] border-black rounded-[5rem] p-12 md:p-24 shadow-[30px_30px_0px_0px_rgba(0,0,0,1)]">
        <div className="space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-2">
              <h3 className="text-5xl font-black uppercase italic tracking-tighter">Quick Access Links</h3>
              <h4 className="text-3xl font-black uppercase italic tracking-tighter text-green-800">Liinkiiwwan Saffisaa</h4>
            </div>
            <span className="bg-black text-white px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest">Essential Portals</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'EAES Registration', titleAO: 'Galmee EAES', url: 'https://register.eaes.et', color: 'bg-white', icon: '📝' },
              { title: 'Passport Application', titleAO: 'Iyyannoo Paaspoortii', url: 'https://www.passport.gov.et', color: 'bg-white', icon: '🛂' },
              { title: 'OEB TMIS Portal', titleAO: 'Pilaatfoormii OEB TMIS', url: 'https://oeb.gov.et/TMIS', color: 'bg-white', icon: '👨‍🏫' }
            ].map((link, i) => (
              <a 
                key={i} 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${link.color} border-4 border-black p-8 rounded-3xl flex flex-col gap-4 hover:translate-x-2 hover:-translate-y-2 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{link.icon}</span>
                  <div className="space-y-1">
                    <span className="text-xl font-black uppercase italic tracking-tight block">{link.title}</span>
                    <span className="text-xs font-black uppercase italic text-green-700 block">{link.titleAO}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {[
          { 
            icon: '💻', 
            title: 'PC Web Dev', 
            titleAO: 'Misoomsa Weebii PC',
            desc: 'Building high-performance desktop websites and complex web systems for personal and business use.',
            descAO: 'Weebsaayitii fi sirna weebii kompiitaraa dandeettii ol\'aanaa qaban dhuunfaa fi daldalaaf misoomsuu.'
          },
          { 
            icon: '📱', 
            title: 'Mobile App Dev', 
            titleAO: 'Misoomsa App Bilbilaa',
            desc: 'Creating intuitive and powerful mobile applications for Android and iOS devices.',
            descAO: 'Applikeeshinii bilbilaa (Android fi iOS) salphaa fi dandeettii qaban qopheessuu.'
          },
          { 
            icon: '🎓', 
            title: 'E-Learning', 
            titleAO: 'Barnoota E-Learning',
            desc: 'Comprehensive digital education platform providing accessible learning resources for everyone, everywhere.',
            descAO: 'Pilaatfoormii barnoota dijitaalaa bal\'aa ta\'ee fi meeshaalee barnootaa hundaaf bakka hundatti akka gahan taasisu.'
          }
        ].map((p, i) => (
          <div key={i} className="bg-white border-8 border-black p-12 rounded-[4rem] shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] space-y-8 flex flex-col items-center text-center hover:-translate-y-4 transition-all group">
             <div className="text-9xl group-hover:scale-110 transition-transform">{p.icon}</div>
             <div className="space-y-2">
               <h3 className="text-3xl font-black uppercase italic tracking-tighter">{p.title}</h3>
               <h3 className="text-xl font-black uppercase italic tracking-tighter text-green-700">{p.titleAO}</h3>
             </div>
             <div className="space-y-4">
               <p className="text-sm font-bold text-gray-400 leading-relaxed italic border-b-2 border-gray-100 pb-4">{p.desc}</p>
               <p className="text-sm font-bold text-gray-600 leading-relaxed italic">{p.descAO}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Leadership Footer */}
      <section className="text-center py-24 border-t-8 border-black bg-gray-50 rounded-t-[5rem]">
        <div className="space-y-4 mb-16">
          <p className="text-[14px] font-black uppercase tracking-[0.8em] text-purple-600">Authorized by IFTU National Board</p>
          <div className="h-1 w-32 bg-black mx-auto"></div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-center items-center gap-16">
           <div className="flex flex-col items-center gap-6 group">
             <div className="relative">
               <div className="absolute inset-0 bg-yellow-400 rounded-full translate-x-3 translate-y-3 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform"></div>
               {/* User's provided photo of Jemal Fano Haji */}
               <img 
                 src={founderPhoto || NATIONAL_CENTER_INFO.founderPhoto} 
                 className="w-48 h-48 rounded-full border-8 border-black relative z-10 bg-white object-cover" 
                 alt={NATIONAL_CENTER_INFO.authorizedBy} 
                 referrerPolicy="no-referrer"
               />
             </div>
             <div className="text-center">
               <p className="text-2xl font-black uppercase italic text-black">{NATIONAL_CENTER_INFO.authorizedBy}</p>
               <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Founder & Lead Developer</p>
             </div>
           </div>
           
           <div className="flex flex-col items-center gap-6 group">
             <div className="relative">
               <div className="absolute inset-0 bg-green-500 rounded-full translate-x-3 translate-y-3 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform"></div>
               <img 
                 src="https://api.dicebear.com/7.x/avataaars/svg?seed=Makiya&backgroundColor=ffd5dc&mouth=smile&eyes=happy" 
                 className="w-48 h-48 rounded-full border-8 border-black relative z-10 bg-white" 
                 alt="Director General" 
               />
             </div>
             <div className="text-center">
               <p className="text-2xl font-black uppercase italic text-black">Makiya Kedir</p>
               <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Director General</p>
             </div>
           </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-white border-[10px] border-black rounded-[5rem] p-12 md:p-24 shadow-[30px_30px_0px_0px_rgba(34,197,94,1)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-5xl font-black uppercase italic tracking-tighter">Get In Touch</h3>
              <h4 className="text-3xl font-black uppercase italic tracking-tighter text-green-700">Nu Quunnamaa</h4>
              <p className="text-xl font-bold text-gray-500 italic">Have a project or question? Reach out to us. / Gaaffii ykn piroojektii qabduu? Nu quunnamuu dandeessu.</p>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-6 bg-gray-50 p-6 rounded-3xl border-4 border-black">
                <div className="text-4xl">📧</div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Email Address</p>
                  <p className="text-lg font-black italic">jemalfano030@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-6 bg-gray-50 p-6 rounded-3xl border-4 border-black">
                <div className="text-4xl">📍</div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Location</p>
                  <p className="text-lg font-black italic">Kore, West Arsi, Oromia</p>
                </div>
              </div>
            </div>
          </div>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" placeholder="Your Name / Maqaa" className="w-full bg-gray-50 border-4 border-black p-6 rounded-2xl font-bold focus:bg-yellow-50 outline-none transition-colors" />
              <input type="email" placeholder="Email / Imeelii" className="w-full bg-gray-50 border-4 border-black p-6 rounded-2xl font-bold focus:bg-yellow-50 outline-none transition-colors" />
            </div>
            <textarea placeholder="Your Message / Dhaamsa keessan" rows={4} className="w-full bg-gray-50 border-4 border-black p-6 rounded-2xl font-bold focus:bg-yellow-50 outline-none transition-colors"></textarea>
            <button className="w-full bg-black text-white py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-green-600 transition-colors shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none">
              Send Message / Ergaa Ergi
            </button>
          </form>
        </div>
      </section>

      {/* Minimal End Footer */}
      <footer className="bg-black text-white py-4 px-12 rounded-b-[3rem] flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-[10px] font-black uppercase hover:text-yellow-400 transition-colors">Home</button>
          <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-black uppercase hover:text-yellow-400 transition-colors">Contact Us</button>
        </div>
        <p className="text-[8px] font-bold opacity-50 uppercase tracking-widest">© {new Date().getFullYear()} IFTU National Digital Sovereign Education Center</p>
        <div className="flex gap-4">
          <span className="text-lg">🇪🇹</span>
          <span className="text-lg">⚡</span>
        </div>
      </footer>
    </div>
  );
};

export default AboutPortal;
