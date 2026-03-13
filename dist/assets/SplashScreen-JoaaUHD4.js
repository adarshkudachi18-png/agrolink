import{u as s,r as n,j as e}from"./index-Ds0taoU2.js";import{c as i}from"./createLucideIcon-B4UZ3Tv5.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r=[["path",{d:"M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z",key:"nnexq3"}],["path",{d:"M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12",key:"mt58a7"}]],l=i("leaf",r);function m(){const t=s();return n.useEffect(()=>{const a=setTimeout(()=>{t("/landing")},2500);return()=>clearTimeout(a)},[t]),e.jsxs("div",{className:"min-h-screen bg-green-600 flex flex-col items-center justify-center",children:[e.jsxs("div",{className:"relative",children:[e.jsx("div",{className:"absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150 animate-pulse"}),e.jsx("div",{className:"relative animate-bounce",children:e.jsx("div",{className:"w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl",children:e.jsx(l,{className:"w-16 h-16 text-green-600"})})})]}),e.jsxs("div",{className:"mt-8 text-center animate-fade-in",children:[e.jsx("h1",{className:"text-4xl font-bold text-white tracking-tight mb-2",children:"Kisan Mitra"}),e.jsx("div",{className:"flex gap-1 justify-center",children:[0,1,2].map(a=>e.jsx("div",{className:"w-2 h-2 bg-white rounded-full animate-bounce",style:{animationDelay:`${a*.15}s`}},a))})]}),e.jsx("style",{children:`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
      `})]})}export{m as default};
