import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0  border-2 border-black dark:border-white bg-white dark:bg-slate-800 text-black dark:text-white px-3 py-1 text-base transition-all outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:focus-visible:shadow-[4px_4px_0_0_rgba(0,0,0,1)] focus-visible:-translate-y-1 focus-visible:-translate-x-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:opacity-50 aria-invalid:border-red-500 md:text-sm",
        className
      )}
      {...props} />
  );
}

export { Input }
