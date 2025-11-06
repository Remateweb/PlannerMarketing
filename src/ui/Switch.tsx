import React from 'react'
export default function Switch({checked,onChange}:{checked:boolean,onChange:(v:boolean)=>void}){
  return <button onClick={()=>onChange(!checked)} className={"w-12 h-6 rounded-full border border-neutral-700 relative " + (checked? "bg-emerald-600":"bg-neutral-800")}>
    <span className={"absolute top-0.5 " + (checked? "left-6":"left-0.5") + " w-5 h-5 rounded-full bg-white"}></span>
  </button>
}
