"use client"

import { RadioGroup } from "@headlessui/react"
import { isMobileMoney, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Button, Container, Heading, Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import MobileMoneyContainer from "@modules/checkout/components/mobile-money-container"
import PaymentContainer from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mobileMoneyComplete, setMobileMoneyComplete] = useState(
    Boolean(
      isMobileMoney(activeSession?.provider_id) &&
        activeSession?.data?.phone_number &&
        activeSession?.data?.network
    )
  )
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"
  const currentProviderStatus = activeSession?.data?.provider_status as
    | string
    | undefined

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    setMobileMoneyComplete(
      Boolean(
        isMobileMoney(method) &&
          activeSession?.provider_id === method &&
          activeSession?.data?.phone_number &&
          activeSession?.data?.network
      )
    )
    if (!isMobileMoney(method)) {
      await initiatePaymentSession(cart, {
        provider_id: method,
      })
    }
  }

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    (activeSession && cart?.shipping_methods.length !== 0) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      return router.push(pathname + "?" + createQueryString("step", "review"), {
        scroll: false,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="rounded-[28px] border border-stone-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(57,45,24,0.08)] backdrop-blur">
      <div className="mb-6 flex flex-row items-center justify-between">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row items-baseline gap-x-2 font-serif text-3xl text-stone-900",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Payment
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 transition hover:border-stone-900 hover:text-stone-900"
              data-testid="edit-payment-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          <div className="mb-6 rounded-[24px] border border-stone-200 bg-[linear-gradient(135deg,#f6f1e7_0%,#fbfaf7_100%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
              Uganda mobile money
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-700">
              Choose your network, enter the number that should receive the prompt, then
              continue to review. The actual payment request is triggered when you place the
              order.
            </p>
          </div>

          {!paidByGiftcard && availablePaymentMethods?.length && (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setPaymentMethod(value)}
              >
                {availablePaymentMethods.map((paymentMethod) => (
                  <div key={paymentMethod.id}>
                    {isMobileMoney(paymentMethod.id) ? (
                      <MobileMoneyContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentInfoMap={paymentInfoMap}
                        setMobileMoneyComplete={setMobileMoneyComplete}
                        setError={setError}
                        paymentSession={activeSession}
                        cart={cart}
                      />
                    ) : (
                      <PaymentContainer
                        paymentInfoMap={paymentInfoMap}
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentSession={activeSession}
                        cart={cart}
                      />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            size="large"
            className="mt-6 rounded-full bg-stone-900 px-6 text-white hover:bg-stone-800"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              (isMobileMoney(selectedPaymentMethod) && !mobileMoneyComplete) ||
              (!selectedPaymentMethod && !paidByGiftcard)
            }
            data-testid="submit-payment-button"
          >
            Continue to review
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="grid gap-4 small:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                <Text className="mb-1 text-sm font-medium text-stone-700">
                  Payment method
                </Text>
                <Text
                  className="text-sm text-stone-600"
                  data-testid="payment-method-summary"
                >
                  {paymentInfoMap[activeSession?.provider_id]?.title ||
                    activeSession?.provider_id}
                </Text>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                <Text className="mb-1 text-sm font-medium text-stone-700">
                  Payment details
                </Text>
                <div
                  className="flex items-center gap-2 text-sm text-stone-600"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex h-8 w-fit items-center rounded-full bg-white p-2 shadow-sm">
                    {paymentInfoMap[selectedPaymentMethod]?.icon || (
                      <CreditCard />
                    )}
                  </Container>
                  <Text>
                    {isMobileMoney(selectedPaymentMethod)
                      ? `Prompt will be sent to ${
                          activeSession?.data?.phone_number || "selected number"
                        }`
                      : "Another step will appear"}
                  </Text>
                </div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                <Text className="mb-1 text-sm font-medium text-stone-700">
                  Prompt status
                </Text>
                <Text className="text-sm text-stone-600">
                  {currentProviderStatus
                    ? `${currentProviderStatus}. Complete the prompt on your phone if requested.`
                    : "Pending. The prompt will be sent when you place the order."}
                </Text>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
