import React from 'react'
export default function Input(props: React.InputHTMLAttributes<HTMLInputElement>){
  return <input {...props} className={"bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm " + (props.className||'')} />
}
