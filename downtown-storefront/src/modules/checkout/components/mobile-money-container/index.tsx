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
        "flex flex-col gap-y-2 text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
        {
          "border-ui-border-interactive":
            selectedPaymentOptionId === paymentProviderId,
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
            <Text className="txt-medium-plus text-ui-fg-base mb-2">
              Select your network:
            </Text>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleNetworkChange("mtn")}
                className={clx(
                  "flex-1 py-3 px-4 border rounded-lg transition-all",
                  {
                    "border-yellow-500 bg-yellow-50": network === "mtn",
                    "border-ui-border-base hover:border-yellow-300":
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
                  "flex-1 py-3 px-4 border rounded-lg transition-all",
                  {
                    "border-red-500 bg-red-50": network === "airtel",
                    "border-ui-border-base hover:border-red-300":
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
            <Text className="txt-medium-plus text-ui-fg-base mb-2">
              Enter your phone number:
            </Text>
            <div className="flex items-center gap-2">
              <span className="text-ui-fg-subtle px-3 py-2 bg-ui-bg-subtle border rounded-l-lg">
                +256
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="7XX XXX XXX"
                className={clx(
                  "flex-1 px-4 py-2 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-ui-border-interactive",
                  {
                    "border-red-500":
                      phoneNumber && !validatePhoneNumber(phoneNumber),
                  }
                )}
                maxLength={12}
              />
            </div>
            {phoneNumber && !validatePhoneNumber(phoneNumber) && (
              <Text className="text-red-500 text-sm mt-1">
                Please enter a valid Uganda phone number
              </Text>
            )}
          </div>

          {/* Instructions */}
          {network && validatePhoneNumber(phoneNumber) && (
            <div className="bg-ui-bg-subtle p-4 rounded-lg">
              <Text className="txt-medium text-ui-fg-subtle">
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
