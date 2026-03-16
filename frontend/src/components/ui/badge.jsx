import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center  border-2 border-black dark:border-white px-2.5 py-0.5 text-xs font-bold transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-300 dark:bg-indigo-600 text-black dark:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none",
        secondary:
          "bg-pink-300 dark:bg-pink-600 text-black dark:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none",
        destructive:
          "bg-red-400 dark:bg-red-600 text-black dark:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none",
        outline:
          "text-black dark:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none bg-white dark:bg-slate-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps({
      className: cn(badgeVariants({ variant }), className),
    }, props),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants }
