'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, getToolName, isToolUIPart } from 'ai';
import { useEffect, useMemo, useState } from 'react';
import { tools } from './api/chat/tools';
import { APPROVAL, getToolsRequiringConfirmation } from './api/chat/utils';
import { HumanInTheLoopUIMessage, MyTools } from './api/chat/types';

type StageOption =
  | string
  | {
      value: string;
      label: string;
      price?: number;
      vendor?: string;
      distance?: string;
      description?: string;
    };

const backpackCards: StageOption[] = [
  {
    value: 'bk-001',
    label: 'Mission District Daypack',
    price: 72,
    vendor: 'Mission Gear Co.',
    distance: '1.2 miles',
    description:
      'Durable city daypack with padded straps and a dedicated laptop sleeve.',
  },
  {
    value: 'bk-002',
    label: 'SOMA Commuter Bag',
    price: 85,
    vendor: 'SOMA Outfitters',
    distance: '2.0 miles',
    description: 'Weather-resistant commuter backpack with reflective accents.',
  },
  {
    value: 'bk-003',
    label: 'Daily Commuter Backpack',
    price: 50,
    vendor: 'Commuter Essentials',
    distance: '3.0 miles',
    description: 'Lightweight pack with external water bottle holders and organizer.',
  },
];

const stagesConfig = [
  {
    id: 'intent',
    prompt: 'What can I help you with today?',
    options: ['Buy a backpack', 'Track an order', 'Check inventory'] as StageOption[],
    autofill: 'I want to buy a backpack.',
  },
  {
    id: 'preference',
    prompt: 'Do you have a preference for buying from a local vendor or online store?',
    options: ['Local vendor', 'Online store'] as StageOption[],
    autofill: 'Local vendor',
  },
  {
    id: 'zip',
    prompt: 'Great! What is your ZIP code so I can search for local options?',
    options: ['94107', '10001', 'Enter manually'] as StageOption[],
    autofill: '94107',
  },
  {
    id: 'select',
    prompt:
      "I found some backpack options for you. Please provide the ID of the backpack you'd like to purchase.",
    options: backpackCards,
    autofill: 'bk-001',
  },
  {
    id: 'confirm',
    prompt: 'Does this option look right? I just need the backpack ID to initiate the purchase.',
    options: ['Yes, please confirm the purchase.', 'No, show me other options.'] as StageOption[],
    autofill: 'Yes, please confirm the purchase.',
  },
];

export default function Chat() {
  const { messages, addToolResult, sendMessage } =
    useChat<HumanInTheLoopUIMessage>({
      transport: new DefaultChatTransport({ api: '/api/chat' }),
    });
  const [input, setInput] = useState('');
  const [stageResponses, setStageResponses] = useState<Record<string, string>>({});
  const [showDecisionTree, setShowDecisionTree] = useState(false);

  const toolsRequiringConfirmation = getToolsRequiringConfirmation(tools);

  const pendingToolCallConfirmation = messages.some(m =>
    m.parts?.some(
      part =>
        isToolUIPart(part) &&
        part.state === 'input-available' &&
        toolsRequiringConfirmation.includes(getToolName(part)),
    ),
  );

  const conversationStages = useMemo(() => {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    const intentDetected = userMessages.length >= 1;
    const preferenceCaptured = userMessages.length >= 2;
    const zipCaptured = userMessages.length >= 3;
    const optionsPresented = assistantMessages.some(m =>
      m.parts?.some(
        part =>
          part.type === 'text' &&
          /backpack options|I found some options/i.test(part.text ?? ''),
      ),
    );
    const awaitingApproval = pendingToolCallConfirmation;
    const purchaseConfirmed = assistantMessages.some(m =>
      m.parts?.some(
        part =>
          part.type === 'text' &&
          /purchase has been initiated|receipt/i.test(part.text ?? ''),
      ),
    );

    const agentActive =
      preferenceCaptured || zipCaptured || optionsPresented || awaitingApproval;

    return {
      intentDetected,
      preferenceCaptured,
      zipCaptured,
      optionsPresented,
      awaitingApproval,
      purchaseConfirmed,
      agentActive,
    };
  }, [messages, pendingToolCallConfirmation]);

  const stageCompletionMap: Record<string, boolean> = {
    intent: Boolean(stageResponses.intent),
    preference: Boolean(stageResponses.preference),
    zip: Boolean(stageResponses.zip),
    select: Boolean(stageResponses.select),
    confirm: Boolean(stageResponses.confirm) || conversationStages.purchaseConfirmed,
  };

  const activeStage = stagesConfig.find(stage => !stageCompletionMap[stage.id])?.id ?? null;

  useEffect(() => {
    if (!activeStage) {
      return;
    }
    const stage = stagesConfig.find(s => s.id === activeStage);
    if (stage && stage.autofill) {
      setInput(stage.autofill);
    }
  }, [activeStage]);

  const resolvedStages = stagesConfig.map(stage => {
    const isCompleted = stageCompletionMap[stage.id];
    const isActive = activeStage === stage.id;

    return {
      ...stage,
      isCompleted,
      isActive,
      userText: stageResponses[stage.id] ?? '',
      assistantText: stage.prompt,
    };
  });

  const decisionTreeContent = (
    <>
      <div className="mb-4">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          Mode
        </span>
        <div
          className={`mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            stageCompletionMap.preference ||
            stageCompletionMap.zip ||
            stageCompletionMap.select ||
            conversationStages.awaitingApproval
              ? 'bg-blue-100 text-blue-700'
              : 'bg-zinc-100 text-zinc-600'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              stageCompletionMap.preference ||
              stageCompletionMap.zip ||
              stageCompletionMap.select ||
              conversationStages.awaitingApproval
                ? 'bg-blue-500'
                : 'bg-zinc-400'
            }`}
          />
          {stageCompletionMap.preference ||
          stageCompletionMap.zip ||
          stageCompletionMap.select ||
          conversationStages.awaitingApproval
            ? 'Agent Flow'
            : 'Direct Reply'}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div
          className={`px-3 py-2 rounded border ${
            stageCompletionMap.intent
              ? 'bg-green-100 border-green-300'
              : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          1) Intent captured
        </div>
        <div
          className={`px-3 py-2 rounded border ${
            stageCompletionMap.preference
              ? 'bg-green-100 border-green-300'
              : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          2) Preference gathered
        </div>
        <div
          className={`px-3 py-2 rounded border ${
            stageCompletionMap.zip
              ? 'bg-green-100 border-green-300'
              : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          3) ZIP provided
        </div>
        <div
          className={`px-3 py-2 rounded border ${
            conversationStages.optionsPresented
              ? 'bg-green-100 border-green-300'
              : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          4) Options retrieved
        </div>
        <div
          className={`px-3 py-2 rounded border ${
            conversationStages.awaitingApproval
              ? 'bg-green-100 border-green-300'
              : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          5) Awaiting approval
        </div>
        <div
          className={`px-3 py-2 rounded border ${
            conversationStages.purchaseConfirmed
              ? 'bg-green-100 border-green-300'
              : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          6) Purchase confirmed
        </div>
      </div>

      <p className="mt-6 text-xs text-zinc-500 leading-relaxed">
        The decision tree highlights each milestone in the backpack purchase flow.
        When only the first step is active, the assistant is handling a direct
        conversation without invoking agent tools.
      </p>
    </>
  );

  const currentStage = resolvedStages.find(stage => stage.isActive) ?? null;

  useEffect(() => {
    if (!currentStage) {
      return;
    }
    if (!currentStage.isCompleted && currentStage.autofill) {
      setInput(currentStage.autofill);
    }
  }, [currentStage]);

  const submitStageResponse = async (stageId: string, value: string) => {
    if (pendingToolCallConfirmation) {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    await sendMessage({ text: trimmed });
    setStageResponses(prev => ({ ...prev, [stageId]: trimmed }));
    setInput('');
  };

  const handleOptionClick = (stageId: string, option: StageOption) => {
    if (pendingToolCallConfirmation) {
      return;
    }

    if (typeof option === 'string') {
      const trimmed = option.trim();
      setInput(trimmed);

      const shouldAutoSubmit =
        stageId !== 'zip' || trimmed.toLowerCase() !== 'enter manually';

      if (shouldAutoSubmit) {
        void submitStageResponse(stageId, trimmed);
      }

      if (!shouldAutoSubmit) {
        setStageResponses(prev => ({ ...prev, [stageId]: '' }));
      }

      return;
    }

    setInput(option.value);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-zinc-800 md:text-xl">
            Human-in-the-Loop Backpack Demo
          </h1>
          <button
            onClick={() => setShowDecisionTree(true)}
            className="md:hidden inline-flex items-center rounded-full bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-lg"
          >
            Decision Tree
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col-reverse gap-6 px-6 py-6 md:flex-row md:py-10">
        <section className="flex-1 space-y-8">
          {resolvedStages.map(stage => {
            const showOptions = stage.options.length > 0;
            const isCurrent = currentStage?.id === stage.id;

            return (
              <div
                key={stage.id}
                className={`rounded-2xl border bg-white px-6 py-6 shadow-sm transition-opacity ${
                  stage.isCompleted
                    ? 'opacity-60'
                    : isCurrent
                    ? 'border-blue-200'
                    : 'opacity-100'
                }`}
              >
                <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                  {stage.isCompleted ? 'Completed step' : isCurrent ? 'In progress' : 'Upcoming'}
                </div>

                <div className="mt-2 text-base font-medium text-zinc-900">
                  {stage.assistantText}
                </div>

                {stage.isCompleted && stage.userText && (
                  <div className="mt-3 text-sm text-zinc-600">
                    <span className="mt-2 block text-xs uppercase tracking-wide text-zinc-400">
                      You responded with
                    </span>
                    <span className="font-medium text-zinc-800">
                      {stage.userText}
                    </span>
                  </div>
                )}

                {showOptions && !stage.isCompleted && (
                  <div className="mt-4 space-y-3">
                    {stage.options.map(option => {
                      if (typeof option === 'string') {
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleOptionClick(stage.id, option)}
                            className={`rounded-full border px-3 py-1 text-sm ${
                              input === option
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-blue-600 border-blue-200'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      }

                      return (
                        <div
                          key={option.value}
                          className={`flex gap-4 rounded-xl border px-4 py-4 shadow-sm transition ${
                            input === option.value
                              ? 'border-blue-400 bg-blue-50'
                              : 'border-zinc-200 bg-white'
                          }`}
                        >
                          <img
                            src={`https://picsum.photos/seed/${option.value}/200/200`}
                            alt={option.label}
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <div className="text-base font-semibold text-zinc-900">
                              {option.label}
                            </div>
                            <div className="mt-1 text-sm text-zinc-600">
                              Vendor: {option.vendor}
                            </div>
                            <div className="text-sm text-zinc-600">
                              Price: ${option.price}
                            </div>
                            <div className="text-sm text-zinc-600">
                              Distance: {option.distance}
                            </div>
                            {option.description && (
                              <div className="mt-2 text-sm text-zinc-500">
                                {option.description}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => submitStageResponse(stage.id, option.value)}
                              disabled={pendingToolCallConfirmation}
                              className={`mt-3 inline-flex items-center rounded border border-blue-600 px-3 py-1 text-sm font-medium text-white ${
                                pendingToolCallConfirmation
                                  ? 'cursor-not-allowed bg-blue-300'
                                  : 'bg-blue-600 hover:bg-blue-500'
                              }`}
                            >
                              Select {option.value.toUpperCase()}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!stage.isCompleted && (
                  <>
                    <div className="mt-4">
                      <label className="text-xs uppercase tracking-wide text-zinc-500">
                        Your response
                      </label>
                      <input
                        disabled={!isCurrent || pendingToolCallConfirmation}
                        className="mt-1 w-full rounded border border-zinc-300 bg-white p-2 shadow-sm"
                        value={isCurrent ? input : stage.userText}
                        onChange={e => isCurrent && setInput(e.target.value)}
                        placeholder={stage.autofill}
                      />
                    </div>

                    <button
                      type="button"
                      disabled={!isCurrent || pendingToolCallConfirmation || !input.trim()}
                      onClick={() => submitStageResponse(stage.id, input)}
                      className={`mt-4 inline-flex items-center rounded px-3 py-1 text-sm font-medium shadow-sm ${
                        !isCurrent || pendingToolCallConfirmation || !input.trim()
                          ? 'border border-zinc-200 bg-zinc-100 text-zinc-400'
                          : 'border border-blue-600 bg-blue-600 text-white hover:bg-blue-500'
                      }`}
                    >
                      Send
                    </button>
                  </>
                )}
              </div>
            );
          })}

          {pendingToolCallConfirmation && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Waiting for your confirmation to proceed. Approve or decline the action
              above to continue.
            </div>
          )}
        </section>

        <aside className="hidden md:block w-full max-w-xs rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {decisionTreeContent}
        </aside>
      </main>

      {showDecisionTree && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDecisionTree(false)}
          />
          <div className="absolute top-0 right-0 bottom-0 w-72 max-w-full overflow-y-auto bg-white p-6 shadow-xl">
            <button
              onClick={() => setShowDecisionTree(false)}
              className="absolute top-3 right-3 text-sm text-zinc-500"
            >
              Close
            </button>
            {decisionTreeContent}
          </div>
        </div>
      )}
    </div>
  );
}

