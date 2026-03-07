"use client"

import React from "react"
import { HttpTypes } from "@medusajs/types"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
}

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ children }) => {
  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 -z-10 h-48 rounded-[36px] bg-[radial-gradient(circle_at_top_left,rgba(212,180,120,0.24),transparent_58%),linear-gradient(135deg,rgba(246,241,231,0.88),rgba(255,255,255,0.55))]" />
      <div className="space-y-8">{children}</div>
    </div>
  )
}

export default PaymentWrapper
