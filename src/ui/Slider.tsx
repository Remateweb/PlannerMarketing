import React from 'react'
export default function Slider({value,min,max,step,onChange}:{value:number,min:number,max:number,step?:number,onChange:(v:number)=>void}){
  return <input type="range" min={min} max={max} step={step||1} value={value} onChange={e=>onChange(Number(e.target.value))} className="w-full"/>
}
