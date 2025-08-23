"use client";

import {
  Message as MessageWrapper,
  MessageContent,
} from "@/components/prompt-kit/message";
import {
  PromptInput,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FADE_VARIANTS,
  SLIDE_UP_VARIANTS,
  TRANSITION_DEFAULT,
} from "@/lib/motion";
import { useChat, type Message } from "@/hooks/useChat";
import { useUserWallet } from "@/contexts/UserWalletContext";
import { AlertTriangle, ArrowUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { memo, useState } from "react";
import { CHAIN_DEFAULT } from "@/lib/rec";
import { parseMessageData } from "@/services/utils/message-utils";
import { TransactionActions } from "@/components/txns/TransactionActions";
import { SwapActions } from "@/components/swap/SwapActions";
import { TransactionPreparingCard } from "@/components/txns/TransactionPreparingCard";
import { MessagePortfolioTable } from "@/components/chat/MessagePortfolioTable";
import { MessageTransactionTable } from "@/components/chat/MessageTransactionTable";
import { MessageNFTGrid } from "@/components/nfts/MessageNFTGrid";
import { MessageMarketTable } from "@/components/chat/MessageMarketTable";
import { SimplePaymentCard } from "@/components/solana-pay/SimplePaymentCard";
import { Loader } from "../prompt-kit/loader";
import { ChainSelector } from "../chain-selector";
import { PromptSystem } from "../prompt-system";
import { BreakoutContainer } from "../layout/BreakoutContainer";

type MessageComponentProps = {
  message: Message;
  isLastMessage: boolean;
};

export const MessageComponent = memo(
  ({ message, isLastMessage }: MessageComponentProps) => {
    const isAssistant = message.role === "assistant";

    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={SLIDE_UP_VARIANTS}
        transition={TRANSITION_DEFAULT}
        layout
      >
        <MessageWrapper
          className={cn(
            "mx-auto flex w-full max-w-3xl flex-col gap-2 px-2 md:px-10",
            isAssistant ? "items-start" : "items-end"
          )}
        >
          {isAssistant ? (
            <div className="group flex w-full flex-col gap-0">
              {(() => {
                // Parse AI message data like the old ChatMessage component
                const {
                  isTransactionPreparing,
                  isSwapPreparing,
                  isPortfolioPreparing,
                  isTransactionHistoryPreparing,
                  isNftPreparing,
                  isMarketPreparing,
                  hasCompleteTransaction,
                  hasCompleteSwap,
                  hasCompletePortfolio,
                  hasCompleteTransactionHistory,
                  hasCompleteNfts,
                  hasCompleteMarket,
                  // New optimized data ID approach
                  hasTransactionDataId,
                  transactionDataId,
                  hasPortfolioDataId,
                  portfolioDataId,
                  hasNftDataId,
                  nftDataId,
                  hasMarketDataId,
                  marketDataId,
                  transactionData,
                  swapData,
                  portfolioData,
                  transactionHistoryData,
                  nftData,
                  marketData,
                  cleanContent,
                } = parseMessageData(message.content);

                return (
                  <>
                    <MessageContent
                      className="text-foreground prose w-full min-w-0 flex-1 rounded-lg bg-transparent p-0"
                      markdown
                    >
                      {cleanContent}
                    </MessageContent>

                    {/* Transaction preparation loading */}
                    {isTransactionPreparing && (
                      <div className="mt-4">
                        <TransactionPreparingCard type="transaction" />
                      </div>
                    )}

                    {/* Swap preparation loading */}
                    {isSwapPreparing && (
                      <div className="mt-4">
                        <TransactionPreparingCard type="swap" />
                      </div>
                    )}

                    {/* Portfolio preparation loading */}
                    {isPortfolioPreparing && (
                      <BreakoutContainer className="mt-4">
                        <div className="animate-pulse flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="w-5 h-5 bg-blue-400 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-blue-200 rounded w-32 mb-1"></div>
                            <div className="h-3 bg-blue-100 rounded w-48"></div>
                          </div>
                        </div>
                      </BreakoutContainer>
                    )}

                    {/* Transaction history preparation loading */}
                    {isTransactionHistoryPreparing && (
                      <BreakoutContainer className="mt-4">
                        <div className="animate-pulse flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="w-5 h-5 bg-green-400 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-green-200 rounded w-40 mb-1"></div>
                            <div className="h-3 bg-green-100 rounded w-52"></div>
                          </div>
                        </div>
                      </BreakoutContainer>
                    )}

                    {/* NFT preparation loading */}
                    {isNftPreparing && (
                      <BreakoutContainer className="mt-4">
                        <div className="animate-pulse flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="w-5 h-5 bg-purple-400 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-purple-200 rounded w-40 mb-1"></div>
                            <div className="h-3 bg-purple-100 rounded w-56"></div>
                          </div>
                        </div>
                      </BreakoutContainer>
                    )}

                    {/* Market data preparation loading */}
                    {isMarketPreparing && (
                      <BreakoutContainer className="mt-4">
                        <div className="animate-pulse flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="w-5 h-5 bg-orange-400 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-orange-200 rounded w-40 mb-1"></div>
                            <div className="h-3 bg-orange-100 rounded w-60"></div>
                          </div>
                        </div>
                      </BreakoutContainer>
                    )}

                    {/* Complete transaction UI card */}
                    {hasCompleteTransaction && transactionData && (
                      <div className="mt-4">
                        {transactionData.type === "deposit" ? (
                          <>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                📱 <strong>Solana Pay QR Code</strong> - Share
                                this QR code or link for others to pay you
                              </p>
                            </div>
                            <SimplePaymentCard
                              recipient={transactionData.recipient}
                              amount={transactionData.amount}
                              tokenSymbol={transactionData.token?.symbol}
                              splToken={transactionData.token?.mint}
                              label={`SOLMate Payment: ${
                                transactionData.amount
                              } ${transactionData.token?.symbol || "SOL"}`}
                              message={`Payment request for ${
                                transactionData.amount
                              } ${transactionData.token?.symbol || "SOL"}`}
                              onPaymentComplete={(signature) => {
                                console.log("Payment completed:", signature);
                              }}
                            />
                          </>
                        ) : (
                          <>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                💳 <strong>Transaction Ready</strong> - Review
                                the details below and approve when ready
                              </p>
                            </div>
                            <TransactionActions
                              transactionIntent={transactionData}
                              onTransactionComplete={() => {}}
                            />
                          </>
                        )}
                      </div>
                    )}

                    {/* Complete swap UI card */}
                    {hasCompleteSwap && swapData && (
                      <div className="mt-4">
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            🔄 <strong>Swap Ready</strong> - Review the details
                            below and execute when ready
                          </p>
                        </div>
                        <SwapActions
                          swapIntent={swapData}
                          onSwapComplete={() => {}}
                        />
                      </div>
                    )}

                    {/* Portfolio table - Unified approach */}
                    {hasCompletePortfolio && portfolioData && (
                      <BreakoutContainer className="mt-4">
                        <MessagePortfolioTable
                          tokens={portfolioData.tokens}
                          nativeBalance={portfolioData.native_balance}
                        />
                      </BreakoutContainer>
                    )}
                    {hasPortfolioDataId && portfolioDataId && (
                      <BreakoutContainer className="mt-4">
                        <MessagePortfolioTable dataId={portfolioDataId} />
                      </BreakoutContainer>
                    )}

                    {/* Transaction history table - Unified approach */}
                    {hasCompleteTransactionHistory &&
                      transactionHistoryData && (
                        <BreakoutContainer className="mt-4">
                          <MessageTransactionTable
                            transactions={transactionHistoryData.transactions}
                          />
                        </BreakoutContainer>
                      )}
                    {hasTransactionDataId && transactionDataId && (
                      <BreakoutContainer className="mt-4">
                        <MessageTransactionTable dataId={transactionDataId} />
                      </BreakoutContainer>
                    )}

                    {/* NFT grid - Legacy approach only for now */}
                    {hasCompleteNfts && nftData && (
                      <BreakoutContainer className="mt-4">
                        <MessageNFTGrid nfts={nftData.nfts} />
                      </BreakoutContainer>
                    )}
                    {hasNftDataId && nftDataId && (
                      <BreakoutContainer className="mt-4">
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg">
                          NFT data optimization coming soon (ID: {nftDataId})
                        </div>
                      </BreakoutContainer>
                    )}

                    {/* Market data table - Unified approach */}
                    {hasCompleteMarket && marketData && (
                      <BreakoutContainer className="mt-4">
                        <MessageMarketTable marketData={marketData} />
                      </BreakoutContainer>
                    )}
                    {hasMarketDataId && marketDataId && (
                      <BreakoutContainer className="mt-4">
                        <MessageMarketTable dataId={marketDataId} />
                      </BreakoutContainer>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="group flex w-full flex-col items-end gap-1">
              <MessageContent className="bg-muted text-primary max-w-[85%] rounded-3xl px-5 py-2.5 whitespace-pre-wrap sm:max-w-[75%]">
                {message.content}
              </MessageContent>
            </div>
          )}
        </MessageWrapper>
      </motion.div>
    );
  }
);

MessageComponent.displayName = "MessageComponent";

const LoadingMessage = memo(() => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={FADE_VARIANTS}
    transition={TRANSITION_DEFAULT}
  >
    <MessageWrapper className="mx-auto flex w-full max-w-3xl flex-col items-start gap-2 px-0 md:px-10">
      <div className="group flex w-full flex-col gap-0">
        <div className="text-foreground prose w-full min-w-0 flex-1 rounded-lg bg-transparent p-0 flex items-center gap-2">
          <Loader variant="wave" size="sm" />
          <Loader
            variant="text-shimmer"
            text="SOLMate is thinking..."
            size="sm"
          />
        </div>
      </div>
    </MessageWrapper>
  </motion.div>
));

LoadingMessage.displayName = "LoadingMessage";

const ErrorMessage = memo(({ error }: { error: Error }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={SLIDE_UP_VARIANTS}
    transition={TRANSITION_DEFAULT}
  >
    <MessageWrapper className="not-prose mx-auto flex w-full max-w-3xl flex-col items-start gap-2 px-0 md:px-10">
      <div className="group flex w-full flex-col items-start gap-0">
        <div className="text-primary flex min-w-0 flex-1 flex-row items-center gap-2 rounded-lg border-2 border-red-300 bg-red-300/20 px-2 py-1">
          <AlertTriangle size={16} className="text-red-500" />
          <p className="text-red-500">{error.message}</p>
        </div>
      </div>
    </MessageWrapper>
  </motion.div>
));

ErrorMessage.displayName = "ErrorMessage";

// Create a separate ChatInput component that matches zola structure
type ChatInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSend: () => void;
  isSubmitting?: boolean;
  hasMessages?: boolean;
  onSuggestion: (suggestion: string) => void;
  hasSuggestions?: boolean;
  selectedChain: string;
  onSelectChain: (chain: string) => void;
  status?: "submitted" | "streaming" | "ready" | "error";
};

function ChatInputComponent({
  value,
  onValueChange,
  onSend,
  isSubmitting,
  onSuggestion,
  hasSuggestions,
  selectedChain,
  onSelectChain,
  status,
}: ChatInputProps) {
  return (
    <div className="relative flex w-full flex-col gap-4">
      {hasSuggestions && (
        <PromptSystem
          onValueChange={onValueChange}
          onSuggestion={onSuggestion}
          value={value}
        />
      )}
      <div className="relative order-2 px-2 pb-3 sm:pb-4 md:order-1">
        <PromptInput
          className="bg-popover relative z-10 p-0 pt-1 shadow-xs backdrop-blur-xl"
          value={value}
          onValueChange={onValueChange}
          onSubmit={onSend}
        >
          <div className="flex flex-col">
            <PromptInputTextarea
              placeholder="Ask anything"
              className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
            />
            <PromptInputActions className="mt-3 flex w-full items-center justify-between gap-2 p-2">
              <div className="flex gap-2">
                <ChainSelector
                  selectedChainId={selectedChain}
                  setSelectedChainId={onSelectChain}
                  className="rounded-full border-none shadow-none bg-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="size-9 rounded-full transition-all duration-300 ease-out"
                  disabled={!value || isSubmitting || !/[^\s]/.test(value)}
                  type="button"
                  onClick={onSend}
                  aria-label={status === "streaming" ? "Stop" : "Send message"}
                >
                  {status === "ready" || status === "error" ? (
                    <ArrowUp className="size-4" />
                  ) : (
                    <span className="size-3 rounded-xs bg-white" />
                  )}
                </Button>
              </div>
            </PromptInputActions>
          </div>
        </PromptInput>
      </div>
    </div>
  );
}

function ConversationPromptInput({ chatId }: { chatId?: string }) {
  const [selectedChain, setSelectedChain] = useState(CHAIN_DEFAULT);
  const { userWallet } = useUserWallet();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput,
  } = useChat({
    api: "/api/chat",
    userWallet,
    chatId,
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  const handleSubmitWrapper = () => {
    if (!input.trim() || !/[^\s]/.test(input)) return;

    // Create a fake event for the old handleSubmit
    const fakeEvent = {
      preventDefault: () => {},
    } as React.FormEvent;

    handleSubmit(fakeEvent);
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => {
      const fakeEvent = {
        preventDefault: () => {},
      } as React.FormEvent;
      handleSubmit(fakeEvent);
    }, 0);
  };

  const handleChainChange = (chain: string) => {
    setSelectedChain(chain);
  };

  const showOnboarding = messages.length === 0;
  const isSubmitting = isLoading;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col items-center justify-end md:justify-center"
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {showOnboarding ? (
          <motion.div
            key="onboarding"
            className="absolute bottom-[60%] mx-auto max-w-[50rem] md:relative md:bottom-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            layout="position"
            layoutId="onboarding"
            transition={{
              layout: {
                duration: 0,
              },
            }}
          >
            <h1 className="mb-6 text-3xl font-medium tracking-tight">
              What&apos;s on your mind?
            </h1>
          </motion.div>
        ) : (
          <div key="conversation" className="w-full flex-1 overflow-hidden">
            <div className="relative flex h-full flex-col overflow-hidden">
              <div className="relative flex-1 space-y-0 overflow-y-auto">
                <div className="space-y-4 px-4 py-12">
                  <AnimatePresence mode="popLayout">
                    {messages.map((message, index) => {
                      const isLastMessage = index === messages.length - 1;

                      return (
                        <MessageComponent
                          key={message.id}
                          message={message}
                          isLastMessage={isLastMessage}
                        />
                      );
                    })}

                    {isLoading && <LoadingMessage key="loading" />}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        className={cn(
          "relative inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl"
        )}
        layout="position"
        layoutId="chat-input-container"
        transition={{
          layout: {
            duration: messages.length === 1 ? 0.3 : 0,
          },
        }}
      >
        <ChatInputComponent
          value={input}
          onValueChange={setInput}
          onSend={handleSubmitWrapper}
          isSubmitting={isSubmitting}
          hasMessages={messages.length > 0}
          onSuggestion={handleSuggestion}
          hasSuggestions={messages.length === 0}
          selectedChain={selectedChain}
          onSelectChain={handleChainChange}
          status={isLoading ? "submitted" : "ready"}
        />
      </motion.div>
    </div>
  );
}

export default ConversationPromptInput;
