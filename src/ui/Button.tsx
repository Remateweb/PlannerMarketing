import React from 'react'
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary'|'destructive', size?: 'sm'|'md' }
export default function Button({ variant='primary', size='md', className='', ...rest }: Props){
  const base = 'rounded-2xl px-3 py-2 text-sm font-medium border transition'
  const variants = {
    primary: 'bg-emerald-700 hover:bg-emerald-600 border-emerald-600',
    secondary: 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700',
    destructive: 'bg-red-700 hover:bg-red-600 border-red-600'
  } as const
  const sizes = { sm: 'px-2 py-1 text-xs', md:'px-3 py-2' } as const
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />
}
