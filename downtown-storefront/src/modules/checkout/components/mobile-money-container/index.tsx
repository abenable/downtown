"use client"

import { Radio as RadioGroupOption } from "@headlessui/react"
import { Text, clx } from "@medusajs/ui"
import React, { useState, type JSX } from "react"
import { HttpTypes } from "@medusajs/types"

import Radio from "@modules/common/components/radio"
import { initiatePaymentSession } from "@lib/data/cart"

type MobileMoneyContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<string, { title: string; icon: JSX.Element }>
  paymentSession?: HttpTypes.StorePaymentSession
  cart: HttpTypes.StoreCart
  setMobileMoneyComplete: (complete: boolean) => void
  setError: (error: string | null) => void
}

type MobileNetwork = "mtn" | "airtel"

const MobileMoneyContainer: React.FC<MobileMoneyContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  paymentSession,
  cart,
  setMobileMoneyComplete,
  setError,
}) => {
  const [phoneNumber, setPhoneNumber] = useState(
    (paymentSession?.data?.phone_number as string) || ""
  )
  const [network, setNetwork] = useState<MobileNetwork | "">(
    (paymentSession?.data?.network as MobileNetwork) || ""
  )
  const [isUpdating, setIsUpdating] = useState(false)

  const validatePhoneNumber = (phone: string): boolean => {
    // Uganda phone number format: 256XXXXXXXXX (12 digits) or 0XXXXXXXXX (10 digits)
    const ugandaPhoneRegex = /^(256|0)?[7][0-9]{8}$/
    return ugandaPhoneRegex.test(phone.replace(/\s/g, ""))
  }

  const formatPhoneNumber = (phone: string): string => {
    // Remove spaces and ensure it starts with 256
    let formatted = phone.replace(/\s/g, "")
    if (formatted.startsWith("0")) {
      formatted = "256" + formatted.substring(1)
    }
    if (!formatted.startsWith("256")) {
      formatted = "256" + formatted
    }
    return formatted
  }

  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPhoneNumber(value)
    setError(null)

    if (validatePhoneNumber(value) && network) {
      setMobileMoneyComplete(true)
      await updatePaymentSession(value, network)
    } else {
      setMobileMoneyComplete(false)
    }
  }

  const handleNetworkChange = async (selectedNetwork: MobileNetwork) => {
    setNetwork(selectedNetwork)
    setError(null)

    if (validatePhoneNumber(phoneNumber) && selectedNetwork) {
      setMobileMoneyComplete(true)
      await updatePaymentSession(phoneNumber, selectedNetwork)
    } else {
      setMobileMoneyComplete(false)
    }
  }

  const updatePaymentSession = async (phone: string, selectedNetwork: MobileNetwork) => {
    setIsUpdating(true)
    try {
      await initiatePaymentSession(cart, {
        provider_id: paymentProviderId,
        data: {
          phone_number: formatPhoneNumber(phone),
          network: selectedNetwork,
        },
      })
    } catch (err: any) {
      setError(err.message || "Failed to update payment details")
      setMobileMoneyComplete(false)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <RadioGroupOption
      key={paymentProviderId}
      value={paymentProviderId}
      disabled={disabled}
      className={clx(
        "mb-3 flex cursor-pointer flex-col gap-y-2 rounded-[24px] border px-6 py-5 text-small-regular transition hover:border-stone-900 hover:shadow-[0_12px_30px_rgba(57,45,24,0.08)]",
        {
          "border-stone-900 bg-stone-50/70":
            selectedPaymentOptionId === paymentProviderId,
          "border-stone-200 bg-white":
            selectedPaymentOptionId !== paymentProviderId,
        }
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <Radio checked={selectedPaymentOptionId === paymentProviderId} />
          <Text className="text-base-regular">
            {paymentInfoMap[paymentProviderId]?.title || "Mobile Money"}
          </Text>
        </div>
        <span className="justify-self-end text-ui-fg-base">
          {paymentInfoMap[paymentProviderId]?.icon}
        </span>
      </div>

      {selectedPaymentOptionId === paymentProviderId && (
        <div className="mt-4 space-y-4">
          {/* Network Selection */}
          <div>
            <Text className="mb-2 text-sm font-medium text-stone-700">
              Select your network:
            </Text>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleNetworkChange("mtn")}
                className={clx(
                  "flex-1 rounded-[20px] border px-4 py-4 transition-all",
                  {
                    "border-yellow-500 bg-yellow-50 shadow-[inset_0_0_0_1px_rgba(234,179,8,0.15)]":
                      network === "mtn",
                    "border-stone-200 bg-white hover:border-yellow-300":
                      network !== "mtn",
                  }
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-black">MTN</span>
                  </div>
                  <span className="font-medium">MTN MoMo</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleNetworkChange("airtel")}
                className={clx(
                  "flex-1 rounded-[20px] border px-4 py-4 transition-all",
                  {
                    "border-red-500 bg-red-50 shadow-[inset_0_0_0_1px_rgba(220,38,38,0.12)]":
                      network === "airtel",
                    "border-stone-200 bg-white hover:border-red-300":
                      network !== "airtel",
                  }
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">A</span>
                  </div>
                  <span className="font-medium">Airtel Money</span>
                </div>
              </button>
            </div>
          </div>

          {/* Phone Number Input */}
          <div>
            <Text className="mb-2 text-sm font-medium text-stone-700">
              Enter your phone number:
            </Text>
            <div className="flex items-center gap-2">
              <span className="rounded-l-2xl border border-stone-200 bg-stone-100 px-4 py-3 text-stone-600">
                +256
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="7XX XXX XXX"
                className={clx(
                  "flex-1 rounded-r-2xl border px-4 py-3 focus:outline-none",
                  {
                    "border-red-500":
                      phoneNumber && !validatePhoneNumber(phoneNumber),
                    "border-stone-200 bg-white":
                      !phoneNumber || validatePhoneNumber(phoneNumber),
                  }
                )}
                maxLength={13}
              />
            </div>
            <Text className="mt-2 text-xs uppercase tracking-[0.2em] text-stone-400">
              Use MTN or Airtel Uganda numbers only
            </Text>
            {phoneNumber && !validatePhoneNumber(phoneNumber) && (
              <Text className="text-red-500 text-sm mt-1">
                Please enter a valid Uganda phone number
              </Text>
            )}
          </div>

          {/* Instructions */}
          {network && validatePhoneNumber(phoneNumber) && (
            <div className="rounded-[20px] border border-stone-200 bg-stone-100 p-4">
              <Text className="text-sm text-stone-700">
                When you click &quot;Place order&quot;, you will receive a USSD
                prompt on your phone to authorize the payment.
              </Text>
            </div>
          )}

          {isUpdating && (
            <div className="flex items-center gap-2 text-ui-fg-subtle">
              <div className="animate-spin h-4 w-4 border-2 border-ui-fg-subtle border-t-transparent rounded-full" />
              <Text className="text-sm">Updating payment details...</Text>
            </div>
          )}
        </div>
      )}
    </RadioGroupOption>
  )
}

export default MobileMoneyContainer
