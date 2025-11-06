import React from 'react'
export function Card({children, className=''}: {children: React.ReactNode, className?:string}){
  return <div className={`rounded-2xl border border-neutral-800 ${className}`}>{children}</div>
}
export function CardHeader({children, className=''}: any){
  return <div className={`p-4 border-b border-neutral-800 ${className}`}>{children}</div>
}
export function CardTitle({children, className=''}: any){
  return <div className={`text-lg font-semibold ${className}`}>{children}</div>
}
export function CardContent({children, className=''}: any){
  return <div className={`p-4 ${className}`}>{children}</div>
}
