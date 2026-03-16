"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center  border-2 border-transparent bg-clip-padding text-sm font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 active:translate-y-1 active:translate-x-1 active:shadow-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,1)]",
  {
    variants: {
      variant: {
        default: "bg-amber-300 dark:bg-amber-500 hover:bg-amber-400 dark:hover:bg-amber-600 text-black border-black dark:border-white",
        outline:
          "border-black dark:border-white bg-white dark:bg-slate-800 hover:bg-pink-100 dark:hover:bg-pink-900 text-black dark:text-white",
        secondary:
          "bg-blue-200 dark:bg-blue-600 text-black hover:bg-blue-300 dark:hover:bg-blue-700 border-black dark:border-white",
        ghost:
          "hover:bg-purple-100 dark:hover:bg-purple-900 text-black dark:text-white border-transparent shadow-none hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:border-black dark:hover:border-white",
        destructive:
          "bg-red-400 dark:bg-red-600 text-white hover:bg-red-500 dark:hover:bg-red-700 border-black dark:border-white",
        link: "text-primary dark:text-white underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1  px-2 text-xs in-data-[slot=button-group]: has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1  px-2.5 text-[0.8rem] in-data-[slot=button-group]: has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-6  in-data-[slot=button-group]: [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7  in-data-[slot=button-group]:",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
