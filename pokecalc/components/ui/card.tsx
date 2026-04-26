import * as React from "react"
export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-xl border bg-card text-card-foreground shadow ${className}`} {...props} />
)