import React, { useState } from 'react'
export function Dialog({trigger, children}:{trigger: React.ReactNode, children: React.ReactNode}){
  const [open,setOpen]=useState(false)
  return <>
    <span onClick={()=>setOpen(true)}>{trigger}</span>
    {open && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-2xl w-[min(92vw,800px)]">
        <div className="p-3 border-b border-neutral-800 flex justify-between items-center">
          <div className="font-semibold">Detalhes</div>
          <button className="text-neutral-400 hover:text-white" onClick={()=>setOpen(false)}>✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>}
  </>
}
